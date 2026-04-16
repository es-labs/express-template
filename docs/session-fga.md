# Session: OpenFGA integration

**Date:** 2026-04-16

---

## User request

> Add fine-grained authorization (FGA) using OpenFGA. Replace the flat `roles` column on the `users` table with relationship tuples stored in an OpenFGA store, while keeping backward compatibility with the existing DB roles fallback.

---

## Context explored

| File | What was read |
|---|---|
| `common/compiled/node/auth/index.js` | Existing `setup()`, `createToken`, `authUser` — integration points |
| `common/compiled/node/express/preRoute.js` | Where `authService.setup()` is called |
| `apps/sample-api/.env.json` | Config file — reference for adding `FGA_CONFIG` block |
| `scripts/dbdeploy/db-sample/migrations/20230827094948_initial.js` | Existing `users` table — confirmed `roles` string column |
| `scripts/dbdeploy/db-sample/seeds/initial_users.js` | Seed user/role data to mirror as FGA tuples |
| `common/compiled/node/package.json` | Where `@openfga/sdk` dependency was added |

---

## Design decisions

### Authorization model

```
type user

type role
  relations
    define assignee: [user]
```

The model maps directly to the existing flat roles: a user is an "assignee" of a named role object. This mirrors the `users.roles` comma-separated column format so existing role names (e.g. `TestGroup`) work unchanged.

### Tuple format

| user | relation | object |
|---|---|---|
| `user:1` | `assignee` | `role:TestGroup` |
| `user:2` | `assignee` | `role:TestGithub` |
| `user:3` | `assignee` | `role:TestGmail` |
| `user:3` | `assignee` | `role:TestGroup` |

### Fallback chain (createToken)

1. FGA configured (`storeId` set) → call `fga.listUserRoles(userId)` via `ListObjects`.
2. FGA returns empty list (not configured / store empty) → fall back to `users.roles` DB column.

The JWT `roles` array format is identical in both cases — consumers are unaware which source was used.

### `req.fga` (attached by `authUser`)

Async helper for per-request fine-grained object checks:

```js
req.fga.check(relation, object) → Promise<boolean>
```

Does not require importing the FGA module in route handlers.

### `fga_config` table

Stores the active store ID and authorization model ID in the application DB so tooling and admin UIs can read them without relying solely on environment variables.

### Optional at runtime

When `FGA_CONFIG.storeId` is empty (default), the entire FGA path is bypassed. Existing deployments continue working with the DB `roles` column and require no migration.

---

## Files created / modified

### New files

| File | Purpose |
|---|---|
| `common/compiled/node/auth/openfga.js` | OpenFGA client wrapper — `setup`, `listUserRoles`, `check`, `writeTuple`, `deleteTuple`, `requireFga` |
| `scripts/dbdeploy/db-sample/migrations/20260416000000_fga_config.js` | Creates `fga_config` table (stores `store_id` + `auth_model_id`) |
| `scripts/dbdeploy/db-sample/seeds/initial_openfga.js` | Creates FGA store, writes authorization model and seed tuples, persists IDs to `fga_config` |
| `docs/fga.md` | Full reference documentation |

### Modified files

| File | Change |
|---|---|
| `common/compiled/node/auth/index.js` | Import `openfga`; extend `setup()` with `fgaConfig`; call `fga.listUserRoles` in `createToken`; attach `req.fga` in `authUser`; re-export FGA helpers |
| `common/compiled/node/express/preRoute.js` | Read `FGA_CONFIG` and pass to `authService.setup()` when `storeId` is set |
| `apps/sample-api/.env.json` | Added `FGA_CONFIG` block |
| `common/compiled/node/package.json` | Added `@openfga/sdk ^0.9.0` |

---

## Usage summary

### Enable FGA

1. Start OpenFGA: `docker run -p 8080:8080 openfga/openfga run`
2. Run migration: `npx knex migrate:latest`
3. Run seed: `npx knex seed:run --specific=initial_openfga.js` (prints `store_id` and `auth_model_id`)
4. Copy the printed values into `apps/sample-api/.env.json`:

```json
"FGA_CONFIG": {
  "apiUrl": "http://127.0.0.1:8080",
  "storeId": "<printed store_id>",
  "authorizationModelId": "<printed auth_model_id>"
}
```

5. Restart the API.

### Route middleware — `requireFga`

```js
import { authUser, requireFga } from '@common/node/auth';

// Static object — check role assignment
router.delete('/users/:id', authUser, requireFga('assignee', 'role:admin'), handler);

// Dynamic object — derived from the request
router.put('/docs/:id', authUser, requireFga('owner', req => `document:${req.params.id}`), handler);
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

await writeTuple('user:42', 'assignee', 'role:admin');   // grant
await deleteTuple('user:42', 'assignee', 'role:admin');  // revoke
```

---

## `fga_config` table

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

## Seed data (initial_openfga.js)

The seed is idempotent — it checks for an existing store named `"sample-app"` before creating a new one. It:

1. Creates (or reuses) the `"sample-app"` store.
2. Writes the authorization model (`user`, `role` with `assignee` relation).
3. Writes tuples mirroring `initial_users.js`.
4. Saves `store_id` and `auth_model_id` to the `fga_config` table.

If the OpenFGA server is unreachable the seed exits gracefully with a warning rather than throwing.

---

## Mode selection

| Mode | Config |
|---|---|
| FGA enabled | `FGA_CONFIG.storeId` set to a valid store ID |
| FGA disabled (legacy fallback) | `FGA_CONFIG.storeId` empty (default) |
| FGA + RBAC together | Both `FGA_CONFIG.storeId` set and `RBAC_CONFIG.enabled: true` |
