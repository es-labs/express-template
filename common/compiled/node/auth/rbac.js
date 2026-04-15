/**
 * RBAC middleware — role and permission checks against the active tenant in the JWT payload.
 *
 * Depends on `authenticate` (jwt.js) having already run and set `req.user`.
 *
 * JWT payload shape (relevant fields):
 * {
 *   active_tenant: "tenant_acme",
 *   tenants: {
 *     tenant_acme: {
 *       roles:       ["admin", "billing_manager"],
 *       permissions: ["users:write", "billing:read", "reports:export"]
 *     }
 *   }
 * }
 */

// import { requireRoles, requirePermissions } from 'common/compiled/node/auth/rbac.js';
// router.delete('/users/:id',   authenticate, requireRoles('admin'), handler);
// router.get('/reports',        authenticate, requirePermissions('reports:read'), handler);
// router.post('/billing/export', authenticate, requireRoles('admin', 'billing_manager'), requirePermissions('billing:read', 'reports:export'), handler);

/**
 * Resolves the active tenant context from `req.user`.
 * Returns null when the payload is missing or malformed.
 *
 * @param {import('express').Request} req
 * @returns {{ roles: string[], permissions: string[] } | null}
 */
const _activeTenant = req => {
  const { active_tenant, tenants } = req.user ?? {};
  if (!active_tenant || !tenants) return null;
  return tenants[active_tenant] ?? null;
};

/**
 * Middleware factory — passes when the user holds **at least one** of the given roles
 * in their active tenant.
 *
 * @param {...string} roles - Required roles (ANY match is sufficient).
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.delete('/users/:id', authenticate, requireRoles('admin'), handler);
 */
export const requireRoles =
  (...roles) =>
  (req, res, next) => {
    const tenant = _activeTenant(req);
    if (!tenant) {
      return res.status(403).json({ error: 'No active tenant context' });
    }

    const userRoles = tenant.roles ?? [];
    const allowed = roles.some(r => userRoles.includes(r));
    if (!allowed) {
      logger.warn({ sub: req.user?.sub, required: roles, actual: userRoles }, 'rbac: role check failed');
      return res.status(403).json({ error: 'Insufficient role' });
    }

    next();
  };

/**
 * Middleware factory — passes when the user holds **all** of the given permissions
 * in their active tenant.
 *
 * @param {...string} permissions - Required permissions (ALL must be present).
 * @returns {import('express').RequestHandler}
 *
 * @example
 * router.get('/reports', authenticate, requirePermissions('reports:read'), handler);
 * router.post('/users',  authenticate, requirePermissions('users:write'), handler);
 */
export const requirePermissions =
  (...permissions) =>
  (req, res, next) => {
    const tenant = _activeTenant(req);
    if (!tenant) {
      return res.status(403).json({ error: 'No active tenant context' });
    }

    const userPerms = tenant.permissions ?? [];
    const missing = permissions.filter(p => !userPerms.includes(p));
    if (missing.length > 0) {
      logger.warn({ sub: req.user?.sub, missing }, 'rbac: permission check failed');
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
