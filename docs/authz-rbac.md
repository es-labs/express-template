# DB-backed RBAC

Role-based access control (RBAC) with tenant, role, and permission support — stored in the application database.

## Overview

The RBAC module provides multi-tenant, coarse-grained authorization as a complement (or alternative) to the fine-grained FGA system:

- Roles and permissions are stored in the DB — no external service required
- Users can belong to multiple tenants, each with their own role assignments
- On login, roles and their resolved permissions are embedded in the JWT
- **Optional at runtime** — when `RBAC_CONFIG.enabled` is `false` the system falls back to the flat `roles` column on the `users` table

RBAC and FGA can be used together: RBAC for coarse-grained tenant/role checks, FGA for fine-grained per-object checks.

---

## Data model

### Schema

```
tenants           id, name, slug, is_active, timestamps
roles             id, tenant_id→tenants, name, description, timestamps
permissions       id, name (e.g. "users:read"), description, timestamps
role_permissions  (role_id, permission_id) composite PK
user_tenant_roles (user_id, tenant_id, role_id) composite PK
```

Roles are **tenant-scoped**. Permissions are **global** (shared across all tenants). A user can hold **multiple roles per tenant**.

```
tenants
  └── roles (tenant_id FK)
        └── role_permissions (role_id FK)
              └── permissions

users
  └── user_tenant_roles (user_id, tenant_id, role_id)
```

### JWT payload when RBAC is enabled

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

- `roles` (flat list) retained for backward compatibility.
- `active_tenant` defaults to `user.tenant` from the `users` table; falls back to first tenant found.
- Permissions are **resolved at login** — JWT is self-contained, no per-request DB call.

---

## Files

### New files

| File | Purpose |
|---|---|
| `common/compiled/node/auth/rbac-service.js` | DB query service — `setup`, `getUserTenantsData`, `assignRole`, `revokeRole`, `grantPermission`, `revokePermission` |
| `scripts/dbdeploy/db-sample/migrations/20260416000001_rbac_tables.js` | Creates `tenants`, `roles`, `permissions`, `role_permissions`, `user_tenant_roles` |
| `scripts/dbdeploy/db-sample/seeds/initial_rbac.js` | Seeds 1 tenant, 4 permissions, 3 roles, 4 user-role assignments |

### Modified files

| File | Change |
|---|---|
| `common/compiled/node/auth/index.js` | Import `rbac-service`; extend `setup()`; enrich `createToken` JWT payload; attach `req.rbac` in `authUser`; re-export management helpers |
| `common/compiled/node/express/preRoute.js` | Read `RBAC_CONFIG` and pass as 4th arg to `authService.setup()` |
| `apps/sample-api/.env.json` | Added `RBAC_CONFIG: { enabled: false }` block |

---

## Setup

### 1. Run migration and seed

```bash
cd scripts/dbdeploy/db-sample
npx knex migrate:latest
npx knex seed:run --specific=initial_rbac.js
```

### 2. Enable RBAC in the app

Set `enabled` to `true` in `apps/sample-api/.env.json`:

```json
"RBAC_CONFIG": {
  "enabled": true
}
```

Restart the API. `createToken` will now fetch tenant/role/permission data on every login and embed it in the JWT.

---

## How it works

### Fallback chain (`createToken`)

1. RBAC enabled → call `rbac.getUserTenantsData(userId, user.tenant)` — runs a single JOIN query across `user_tenant_roles → roles → role_permissions → permissions` for all active tenants. Embeds `active_tenant` and `tenants` in the JWT.
2. FGA configured → populate flat `roles` from OpenFGA `ListObjects`.
3. Neither → flat `roles` from `users.roles` DB column.

All three can coexist in the same deployment.

### `authUser`

After JWT verification, `authUser` attaches `req.rbac` to the request for inline handler checks:

```js
req.rbac = {
  hasRole: (...roles)       => boolean,  // ANY match in active tenant
  hasPermission: (...perms) => boolean,  // ALL must be present in active tenant
};
```

---

## Usage in routes

### Ad-hoc check inside a handler

```js
router.get('/dashboard', authUser, async (req, res) => {
  const canExport = req.rbac.hasPermission('reports:export');
  res.json({ canExport });
});
```

### Using RBAC and FGA together

```js
import { authUser, requireFga } from '@common/node/auth';

// Coarse: user must be an admin in their active tenant (inline check)
// Fine:   user must own this specific document
router.put(
  '/docs/:id',
  authUser,
  (req, res, next) => req.rbac.hasRole('admin') ? next() : res.sendStatus(403),
  requireFga('owner', req => `document:${req.params.id}`),
  handler,
);
```

---

## Role and permission management

```js
import { assignRole, revokeRole, grantPermission, revokePermission } from '@common/node/auth';

// Assign a role to a user in a tenant
await assignRole(userId, tenantId, roleId);

// Remove it
await revokeRole(userId, tenantId, roleId);

// Add a permission to a role
await grantPermission(roleId, permissionId);

// Remove it
await revokePermission(roleId, permissionId);
```

---

## Seed data (`initial_rbac.js`)

| Tenant | Role | Permissions |
|---|---|---|
| Default (id=1) | TestGroup | `users:read`, `reports:read` |
| Default (id=1) | TestGithub | `users:read` |
| Default (id=1) | TestGmail | `users:read`, `reports:read`, `reports:export` |

| User | Roles in tenant 1 |
|---|---|
| user:1 (test) | TestGroup |
| user:2 (ais-one) | TestGithub |
| user:3 (aaronjxz) | TestGmail, TestGroup |

---

## Mode selection

| Mode | Config |
|---|---|
| RBAC only | `RBAC_CONFIG.enabled: true`, FGA `storeId` empty |
| FGA only | `RBAC_CONFIG.enabled: false`, FGA `storeId` set |
| Both | Both enabled |
| Neither (legacy) | Both disabled — uses flat `users.roles` column |

| Use case | Recommendation |
|---|---|
| Tenant isolation, coarse role checks | RBAC |
| Per-object ownership or sharing (e.g. "can edit document:42") | FGA |
| Both coarse and fine-grained control | RBAC + FGA together |
| No external service, simple deployments | RBAC only |
| Maximum flexibility, dynamic policies | FGA only or RBAC + FGA |
