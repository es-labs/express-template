let redis;
const setTokenService = service => (redis = service);
const setRefreshToken = async (id, refresh_token) => redis.set(id, refresh_token);
const getRefreshToken = async id => redis.get(id);
const revokeRefreshToken = async id => redis.del(id);

const setUserService = () => {};
const setRefreshTokenStoreName = () => {};
const setAuthUserStoreName = () => {};
const findUser = () => {};
const updateUser = () => {};

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
