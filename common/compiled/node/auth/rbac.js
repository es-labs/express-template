/**
 * DB-backed RBAC service — tenant-scoped roles and permissions.
 *
 * Tables required (created by migration 20260416000001_rbac_tables):
 *   tenants           — registered tenants
 *   roles             — named roles, each scoped to a tenant
 *   permissions       — global permission strings (e.g. "users:read")
 *   role_permissions  — M:N join between roles and permissions
 *   user_tenant_roles — M:N:N join of user × tenant × role
 *
 * This service is optional — when not configured, createToken falls back to
 * the flat DB roles column or FGA as before.
 *
 * Usage:
 *   import * as rbac from '@common/node/auth/rbac.js';
 *   rbac.setup(knexInstance); // call once at startup via auth setup()
 *
 *   // In createToken — fetch tenant/role/permission data to embed in JWT
 *   const data = await rbac.getUserTenantsData(userId, user.tenant);
 *
 *   // Management helpers (e.g. admin routes)
 *   await rbac.assignRole(userId, tenantId, roleId);
 *   await rbac.revokeRole(userId, tenantId, roleId);
 *   await rbac.grantPermission(roleId, permissionId);
 *   await rbac.revokePermission(roleId, permissionId);
 */

/** @type {import('knex').Knex | null} */
let _knex = null;

/**
 * Initialise the RBAC service with a Knex query builder instance.
 * Call once during app startup (via auth setup()).
 *
 * @param {import('knex').Knex} knexInstance
 */
const setup = knexInstance => {
  _knex = knexInstance;
};

/**
 * Returns true when the RBAC service has been initialised.
 * @returns {boolean}
 */
const isConfigured = () => _knex !== null;

/**
 * Fetch all tenant memberships for a user, together with their roles and the
 * permissions resolved from those roles.
 *
 * Returns null when:
 * - RBAC has not been configured (setup() not called), or
 * - the user has no active tenant memberships.
 *
 * The returned shape is embedded directly into the JWT payload by createToken.
 *
 * @param {string|number} userId
 * @param {string|number} [defaultTenantId]
 *   Preferred active_tenant. If the user belongs to this tenant it will be
 *   used; otherwise the first tenant found is used.
 * @returns {Promise<{
 *   active_tenant: number,
 *   tenants: Record<number, { roles: string[], permissions: string[] }>
 * } | null>}
 */
const getUserTenantsData = async (userId, defaultTenantId) => {
  if (!_knex) return null;
  try {
    const rows = await _knex('user_tenant_roles as utr')
      .join('roles as r', 'r.id', 'utr.role_id')
      .join('tenants as t', 't.id', 'utr.tenant_id')
      .leftJoin('role_permissions as rp', 'rp.role_id', 'r.id')
      .leftJoin('permissions as p', 'p.id', 'rp.permission_id')
      .where('utr.user_id', userId)
      .where('t.is_active', true)
      .select('utr.tenant_id', 'r.name as role_name', 'p.name as permission_name');

    if (rows.length === 0) return null;

    // Group rows into { tenantId: { roles: Set, permissions: Set } }
    const map = {};
    for (const row of rows) {
      const tid = row.tenant_id;
      if (!map[tid]) map[tid] = { roles: new Set(), permissions: new Set() };
      map[tid].roles.add(row.role_name);
      if (row.permission_name) map[tid].permissions.add(row.permission_name);
    }

    // Convert Sets to sorted arrays for deterministic JWT payloads
    const tenants = {};
    for (const [tid, data] of Object.entries(map)) {
      tenants[Number(tid)] = {
        roles: [...data.roles].sort(),
        permissions: [...data.permissions].sort(),
      };
    }

    const tenantIds = Object.keys(tenants).map(Number);
    const active_tenant = tenantIds.includes(Number(defaultTenantId)) ? Number(defaultTenantId) : tenantIds[0];

    return { active_tenant, tenants };
  } catch (err) {
    logger.error({ err, userId }, 'rbac: getUserTenantsData failed');
    return null;
  }
};

/**
 * Assign a role to a user within a tenant (idempotent).
 *
 * @param {number} userId
 * @param {number} tenantId
 * @param {number} roleId
 */
const assignRole = async (userId, tenantId, roleId) => {
  await _knex('user_tenant_roles')
    .insert({ user_id: userId, tenant_id: tenantId, role_id: roleId })
    .onConflict(['user_id', 'tenant_id', 'role_id'])
    .ignore();
};

/**
 * Revoke a role from a user within a tenant.
 *
 * @param {number} userId
 * @param {number} tenantId
 * @param {number} roleId
 */
const revokeRole = async (userId, tenantId, roleId) => {
  await _knex('user_tenant_roles').where({ user_id: userId, tenant_id: tenantId, role_id: roleId }).delete();
};

/**
 * Grant a permission to a role (idempotent).
 *
 * @param {number} roleId
 * @param {number} permissionId
 */
const grantPermission = async (roleId, permissionId) => {
  await _knex('role_permissions')
    .insert({ role_id: roleId, permission_id: permissionId })
    .onConflict(['role_id', 'permission_id'])
    .ignore();
};

/**
 * Revoke a permission from a role.
 *
 * @param {number} roleId
 * @param {number} permissionId
 */
const revokePermission = async (roleId, permissionId) => {
  await _knex('role_permissions').where({ role_id: roleId, permission_id: permissionId }).delete();
};

export { assignRole, getUserTenantsData, grantPermission, isConfigured, revokePermission, revokeRole, setup };
