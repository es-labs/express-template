import { generateKeyPairSync, randomUUID } from 'node:crypto';

const keys = new Map(); // kid → key object
let currentKid = null;

const generateKey = () => {
  const { privateKey, publicKey } = generateKeyPairSync('ec', {
    namedCurve: 'P-256',
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  const kid = randomUUID();

  keys.set(kid, {
    kid,
    privateKey,
    publicKey,
    createdAt: new Date(),
  });

  currentKid = kid;
  return kid;
};

export const rotateKey = () => {
  const newKid = generateKey();

  // prune keys older than 2 hours (after tokens expire)
  const cutoff = Date.now() - 2 * 60 * 60 * 1000;
  for (const [kid, key] of keys.entries()) {
    if (kid !== newKid && key.createdAt.getTime() < cutoff) {
      keys.delete(kid);
    }
  }

  return newKid;
};

// generate initial key on startup
generateKey();

export const getPrivateKey = () => keys.get(currentKid).privateKey;
export const getPublicKey = () => keys.get(currentKid).publicKey;
export const getKid = () => currentKid;
export const getAllPublicKeys = () =>
  [...keys.values()].map(k => ({
    kid: k.kid,
    publicKey: k.publicKey,
  }));
