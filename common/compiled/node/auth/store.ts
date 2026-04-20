let _tokenServiceName: string;
let _tokenServiceType: string;
let _userServiceName: string;
let _userServiceType: string;
// biome-ignore lint/suspicious/noExplicitAny: lookup returns the underlying store instance (knex or keyv)
let _lookup: ((name: string) => any) | null = null;

const { JWT_REFRESH_STORE_NAME = '' } = globalThis.__config.JWT;

const { AUTH_USER_STORE_NAME } = process.env;

const tokenStore = () => _lookup?.(_tokenServiceName); // knex or keyv instance for token storage
const knex = () => _lookup?.(_userServiceName); // knex instance for user table

/**
 * Wire up the backing stores.
 *   tokenServiceName — service name from SERVICES_CONFIG (e.g. 'keyv')
 *   userServiceName  — service name from SERVICES_CONFIG (e.g. 'knex1')
 *   lookup           — services.get — resolves a name to the underlying store instance
 */
export const setup = (tokenServiceName: string, userServiceName: string, lookup: (name: string) => any) => {
  _tokenServiceName = tokenServiceName;
  _tokenServiceType = globalThis.__config?.SERVICES_CONFIG?.[tokenServiceName]?.type ?? 'keyv';
  _userServiceName = userServiceName;
  _userServiceType = globalThis.__config?.SERVICES_CONFIG?.[userServiceName]?.type ?? 'knex';
  _lookup = lookup;
};

// id field must be unique; upsert for PostgreSQL/MySQL
export const setRefreshToken = async (id, refresh_token) => {
  if (_tokenServiceType === 'knex')
    await tokenStore()(JWT_REFRESH_STORE_NAME).insert({ id, refresh_token }).onConflict('id').merge();
  else await tokenStore().set(id, refresh_token);
};

export const getRefreshToken = async id => {
  if (_tokenServiceType === 'knex')
    return (await tokenStore()(JWT_REFRESH_STORE_NAME).where({ id }).first()).refresh_token;
  else return tokenStore().get(id);
};

export const revokeRefreshToken = async id => {
  if (_tokenServiceType === 'knex') await tokenStore()(JWT_REFRESH_STORE_NAME).where({ id }).delete();
  else await tokenStore().delete(id);
};

export const findUser = async where => {
  if (_userServiceType === 'knex') return knex()(AUTH_USER_STORE_NAME).where(where).first();
  return null;
};

export const updateUser = async (where, payload) => {
  if (_userServiceType === 'knex') return knex()(AUTH_USER_STORE_NAME).where(where).update(payload);
};
