import crypto from 'node:crypto';
const HASH_KEYLEN = 64;

// const password = 'user-password';
// const salt = crypto.randomBytes(16).toString('hex'); // Generate unique random salt
// const keylen = 64; // Length of the resulting derived key
const setScryptHash = (password, salt) => {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, HASH_KEYLEN, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString('hex'));
    });
  });
};

/**
 * Verifies an input password against a stored hash and salt.
 * @param {string} passwordAttempt - The password provided by the user.
 * @param {string} storedSalt - Hex-encoded salt retrieved from DB.
 * @param {string} storedHash - Hex-encoded hash retrieved from DB.
 */
const matchScryptHash = (passwordAttempt, storedSalt, storedHash) => {
  const salt = Buffer.from(storedSalt, 'hex');
  const hash = Buffer.from(storedHash, 'hex');
  return new Promise((resolve, reject) => {
    crypto.scrypt(passwordAttempt, salt, HASH_KEYLEN, (err, derivedKey) => {
      if (err) reject(err);
      // Compare buffers safely to prevent side-channel attacks
      const isMatch = crypto.timingSafeEqual(hash, derivedKey);
      resolve(isMatch);
    });
  });
};

export { setScryptHash, matchScryptHash };
