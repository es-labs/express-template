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

`roles` (flat list) is kept for backward compatibility. `active_tenant` is the user's default tenant from the `users.tenant` column.

---

## Files changed

| File | Purpose |
|---|---|
| `common/compiled/node/auth/rbac.js` | DB query service — `setup`, `getUserTenantsData`, `assignRole`, `revokeRole`, `grantPermission`, `revokePermission` |
| `common/compiled/node/auth/index.js` | `setup()` accepts `rbacConfig`; `createToken` merges RBAC data into JWT; `authUser` attaches `req.rbac`; re-exports RBAC helpers |
| `common/compiled/node/express/preRoute.js` | Reads `RBAC_CONFIG` and forwards it to `authService.setup()` |
| `apps/sample-api/.env.json` | Added `RBAC_CONFIG` block |
| `scripts/dbdeploy/db-sample/migrations/20260416000001_rbac_tables.js` | Creates `tenants`, `roles`, `permissions`, `role_permissions`, `user_tenant_roles` |
| `scripts/dbdeploy/db-sample/seeds/initial_rbac.js` | Seeds 1 tenant, 4 permissions, 3 roles, 4 user-role assignments |

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

### `createToken`

On login, after the password check, `createToken` calls `rbac.getUserTenantsData(userId, user.tenant)`. This runs a single JOIN query across `user_tenant_roles → roles → role_permissions → permissions` for all active tenants the user belongs to. The result is merged into the JWT payload as `active_tenant` and `tenants`.

If RBAC is not enabled or the user has no tenant memberships, the field is omitted and the flat `roles` column / FGA fallback applies as before.

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

## Seed data (initial_rbac.js)

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

## Choosing between RBAC, FGA, or both

| Use case | Recommendation |
|---|---|
| Tenant isolation, coarse role checks | RBAC |
| Per-object ownership or sharing (e.g. "can edit document:42") | FGA |
| Both coarse and fine-grained control | RBAC + FGA together |
| No external service, simple deployments | RBAC only |
| Maximum flexibility, dynamic policies | FGA only or RBAC + FGA |

