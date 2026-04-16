# OpenFGA Integration

Fine-grained authorization (FGA) using [OpenFGA](https://openfga.dev) — an open-source Zanzibar-based access control system.

## Overview

The integration replaces the flat `roles` column on the `users` table with relationship tuples stored in an OpenFGA store. This enables:

- Role assignments managed outside the DB (no schema change per new role)
- Per-object permission checks (e.g. "can user X edit document Y?")
- Audit-friendly tuple history via the OpenFGA API

FGA is **optional at runtime** — when `FGA_CONFIG.storeId` is empty the system falls back to the DB `roles` column, so existing deployments continue working without change.

---

## Authorization model

```
type user

type role
  relations
    define assignee: [user]
```

Tuples assign users to roles:

| user    | relation   | object           |
|---------|------------|------------------|
| user:1  | assignee   | role:TestGroup   |
| user:2  | assignee   | role:TestGithub  |
| user:3  | assignee   | role:TestGmail   |
| user:3  | assignee   | role:TestGroup   |

---

## Files changed

| File | Purpose |
|---|---|
| `common/compiled/node/auth/openfga.js` | OpenFGA client wrapper — `setup`, `listUserRoles`, `check`, `writeTuple`, `deleteTuple`, `requireFga` |
| `common/compiled/node/auth/index.js` | `createToken` uses FGA roles; `authUser` attaches `req.fga`; `setup()` accepts `fgaConfig`; re-exports FGA helpers |
| `common/compiled/node/express/preRoute.js` | Reads `FGA_CONFIG` from app config and forwards it to `authService.setup()` |
| `common/compiled/node/package.json` | Added `@openfga/sdk ^0.9.0` |
| `apps/sample-api/.env.json` | Added `FGA_CONFIG` block |
| `scripts/dbdeploy/db-sample/migrations/20260416000000_fga_config.js` | Creates `fga_config` table (stores `store_id` + `auth_model_id`) |
| `scripts/dbdeploy/db-sample/seeds/initial_openfga.js` | Creates FGA store, writes model and seed tuples, saves IDs to `fga_config` |

---

## Setup

### 1. Start OpenFGA

```bash
docker run -p 8080:8080 openfga/openfga run
```

### 2. Install dependencies

```bash
npm i
```

### 3. Run migration and seed

```bash
cd scripts/dbdeploy/db-sample
npx knex migrate:latest
npx knex seed:run --specific=initial_openfga.js
```

The seed prints the `store_id` and `auth_model_id` it created.

### 4. Configure the app

Copy the printed values into `apps/sample-api/.env.json`:

```json
"FGA_CONFIG": {
  "apiUrl": "http://127.0.0.1:8080",
  "storeId": "<printed store_id>",
  "authorizationModelId": "<printed auth_model_id>"
}
```

Restart the API. `createToken` will now fetch roles from OpenFGA on every login.

---

## How it works

### `createToken`

On login, after the password check, `createToken` calls `fga.listUserRoles(userId)` to retrieve the user's roles from OpenFGA via `ListObjects`. The returned role names are embedded in the JWT payload under `roles`, identical to the old format. If FGA returns an empty list (not configured or store empty) the DB `roles` column is used as fallback.

### `authUser`

JWT verification is unchanged. After a successful verify, the middleware attaches `req.fga` to the request:

```js
req.fga = {
  check: (relation, object) => fga.check(req.user.sub, relation, object),
};
```

This lets handlers perform ad-hoc FGA checks without importing the module directly.

---

## Usage in routes

### Middleware factory — `requireFga`

Use `requireFga` after `authUser` for declarative route-level permission checks:

```js
import { authUser, requireFga } from '@common/node/auth';

// Static object — check role assignment
router.delete(
  '/users/:id',
  authUser,
  requireFga('assignee', 'role:admin'),
  handler,
);

// Dynamic object — derived from the request
router.put(
  '/docs/:id',
  authUser,
  requireFga('owner', req => `document:${req.params.id}`),
  handler,
);
```

### Ad-hoc check inside a handler

```js
router.get('/resource', authUser, async (req, res) => {
  const canEdit = await req.fga.check('writer', 'document:42');
  res.json({ canEdit });
});
```

### Tuple management

```js
import { writeTuple, deleteTuple } from '@common/node/auth';

// Grant a user a role
await writeTuple('user:42', 'assignee', 'role:admin');

// Revoke it
await deleteTuple('user:42', 'assignee', 'role:admin');
```

---

## `fga_config` table

Stores the active FGA store and model IDs so they can be read by tooling or admin UIs without relying solely on environment variables.

| Column | Type | Description |
|---|---|---|
| `id` | integer PK | |
| `store_id` | string(64) | OpenFGA store ID |
| `auth_model_id` | string(64) | Authorization model ID |
| `label` | string(80) | Human-readable name, default `"default"` |
| `api_url` | string(255) | FGA server URL |
| `is_active` | boolean | Whether this config is in use |
| `created_at` / `updated_at` | timestamp | |

---

## Running OpenFGA in production

For production deployments OpenFGA requires its own persistent store. See the [OpenFGA deployment guide](https://openfga.dev/docs/getting-started/setup-openfga/docker) for options (PostgreSQL, MySQL, in-memory).

Store and model IDs should be managed via a secrets vault and injected as environment variables — do not commit them.
