# Session: RBAC module implementation

**Date:** 2026-04-16

---

## User request

> Can you create a similar module for RBAC involving tenant, roles and permissions? In essence, there is flexibility to choose to use either RBAC or FGA or both.

---

## Context explored

| File | What was read |
|---|---|
| `docs/fga.md` | Existing FGA integration design and usage patterns |
| `common/compiled/node/auth/index.js` | `setup()`, `createToken`, `authUser` — integration points |
| `common/compiled/node/auth/openfga.js` | FGA service module — used as design reference |
| `common/compiled/node/express/preRoute.js` | Where `authService.setup()` is called with config |
| `apps/sample-api/.env.json` | Config file — FGA_CONFIG block as reference |
| `scripts/dbdeploy/db-sample/migrations/20230827094948_initial.js` | Existing `users` table schema |
| `scripts/dbdeploy/db-sample/seeds/initial_users.js` | Seed user data to mirror in RBAC seed |
| `common/compiled/node/services/db/knex.js` | Confirmed `services.get('knex1')` returns a raw Knex instance |

---

## Design decisions

### DB schema

```
tenants           id, name, slug, is_active, timestamps
roles             id, tenant_id→tenants, name, description, timestamps
permissions       id, name (e.g. "users:read"), description, timestamps
role_permissions  (role_id, permission_id) composite PK
user_tenant_roles (user_id, tenant_id, role_id) composite PK
```

Roles are **tenant-scoped**. Permissions are **global** (shared across all tenants — a role in any tenant can be granted any permission). A user can hold **multiple roles per tenant**.

### JWT payload shape (when RBAC enabled)

```json
{
  "sub": 3,
  "roles": ["TestGmail", "TestGroup"],
  "active_tenant": 1,
  "tenants": {
    "1": {
      "roles": ["TestGmail", "TestGroup"],
      "permissions": ["reports:export", "reports:read", "users:read"]
    }
  }
}
```

- `roles` (flat list) retained for backward compatibility with FGA consumers.
- `active_tenant` defaults to `user.tenant` from the `users` table; falls back to first tenant found.
- Permissions are **resolved at login** (JWT is self-contained — no per-request DB call).

### Fallback chain (createToken)

1. RBAC enabled → embed `active_tenant` + `tenants` map in JWT.
2. FGA configured → populate flat `roles` from OpenFGA `ListObjects`.
3. Neither → flat `roles` from `users.roles` DB column.

All three can coexist in the same deployment.

### `req.rbac` (attached by `authUser`)

Synchronous helpers for inline handler use:

```js
req.rbac.hasRole('admin')              // ANY match in active tenant
req.rbac.hasPermission('reports:read') // ALL must be present in active tenant
```

Mirrors `req.fga.check(...)` (async FGA) but reads JWT in-memory.

---

## Files created / modified

### New files

| File | Purpose |
|---|---|
| `common/compiled/node/auth/rbac.js` | DB query service — `setup`, `getUserTenantsData`, `assignRole`, `revokeRole`, `grantPermission`, `revokePermission` |
| `scripts/dbdeploy/db-sample/migrations/20260416000001_rbac_tables.js` | Creates the five RBAC tables |
| `scripts/dbdeploy/db-sample/seeds/initial_rbac.js` | Seeds 1 tenant, 4 permissions, 3 roles, 4 user-role assignments (mirrors initial_users.js) |
| `docs/rbac.md` | Full reference documentation |

### Modified files

| File | Change |
|---|---|
| `common/compiled/node/auth/index.js` | Import `rbac`; extend `setup()`; enrich `createToken` JWT payload; attach `req.rbac` in `authUser`; re-export management helpers |
| `common/compiled/node/express/preRoute.js` | Read `RBAC_CONFIG` and pass as 4th arg to `authService.setup()` |
| `apps/sample-api/.env.json` | Added `RBAC_CONFIG: { enabled: false }` block |

---

## Usage summary

### Enable RBAC

1. Run migration: `npx knex migrate:latest`
2. Run seed: `npx knex seed:run --specific=initial_rbac.js`
3. Set `RBAC_CONFIG.enabled: true` in `.env.json`
4. Restart the API

### RBAC + FGA together

```js
import { authUser, requireFga } from '@common/node/auth';

router.put(
  '/docs/:id',
  authUser,
  (req, res, next) => req.rbac.hasRole('editor') ? next() : res.sendStatus(403), // RBAC: coarse tenant role
  requireFga('owner', req => `document:${req.params.id}`),                        // FGA: fine-grained object
  handler,
);
```

### Management helpers

```js
import { assignRole, revokeRole, grantPermission, revokePermission } from '@common/node/auth';

await assignRole(userId, tenantId, roleId);
await revokeRole(userId, tenantId, roleId);
await grantPermission(roleId, permissionId);
await revokePermission(roleId, permissionId);
```

---

## Mode selection

| Mode | Config |
|---|---|
| RBAC only | `RBAC_CONFIG.enabled: true`, FGA `storeId` empty |
| FGA only | `RBAC_CONFIG.enabled: false`, FGA `storeId` set |
| Both | Both enabled |
| Neither (legacy) | Both disabled — uses flat `users.roles` column |
