import crypto from 'node:crypto'
const DEFAULT_ENCODING = 'base64' // 'binary'

export const encryptText = (alg, key, iv, text, encoding = DEFAULT_ENCODING) => {
  const cipher = crypto.createCipheriv(alg, key, iv)
  return cipher.update(text, 'utf8', encoding) + cipher.final(encoding)
}

export const decryptText = (alg, key, iv, text, encoding = DEFAULT_ENCODING) => {
  const decipher = crypto.createDecipheriv(alg, key, iv)
  return decipher.update(text, encoding) + decipher.final()
}

export const genIv = () => new Buffer.alloc(16, crypto.pseudoRandomBytes(16))

export const genKey = (algorithm, password) => {
  const [size, algo] = algorithm.includes("256") ? [32, 'sha256'] :
    // algorithm.includes("192") ? [32, 'sha192'] : // this is not support
    algorithm.includes("128") ? [32, 'md5'] : []
  const hash = crypto.createHash(algo)
  hash.update(password)
  return new Buffer.alloc(size, hash.digest('hex'),'hex')
}
