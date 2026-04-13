let knex;
let JWT_REFRESH_STORE_NAME;
let AUTH_USER_STORE_NAME;

const setTokenService = service => (knex = service);
const setUserService = service => (knex = service);
const setRefreshTokenStoreName = name => (JWT_REFRESH_STORE_NAME = name);
const setAuthUserStoreName = name => (AUTH_USER_STORE_NAME = name);

// id field must be unique, upsert for PostgreSQL, MySQL only
const setRefreshToken = async (id, refresh_token) =>
  knex(JWT_REFRESH_STORE_NAME).insert({ id, refresh_token }).onConflict('id').merge();
const getRefreshToken = async id => (await knex(JWT_REFRESH_STORE_NAME).where({ id: id }).first()).refresh_token;
const revokeRefreshToken = async id => knex(JWT_REFRESH_STORE_NAME).where({ id: id }).delete();

const findUser = async where => knex(AUTH_USER_STORE_NAME).where(where).first();
const updateUser = async (where, payload) => knex(AUTH_USER_STORE_NAME).where(where).first().update(payload);

export {
  findUser,
  getRefreshToken,
  revokeRefreshToken,
  setAuthUserStoreName,
  setRefreshToken,
  setRefreshTokenStoreName,
  setTokenService,
  setUserService,
  updateUser,
};
