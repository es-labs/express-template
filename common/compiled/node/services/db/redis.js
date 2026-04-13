import Redis from 'ioredis';

export default class StoreRedis {
  constructor(options = globalThis.__config?.REDIS_CONFIG || {}) {
    this._REDIS_CONFIG = options;
    this._redis = null;
  }

  open() {
    const redisOpts = this._REDIS_CONFIG.opts;
    if (this._REDIS_CONFIG.retry)
      redisOpts.retryStrategy = times => Math.min(times * this._REDIS_CONFIG.retry.step, this._REDIS_CONFIG.retry.max);
    if (this._REDIS_CONFIG.reconnect)
      redisOpts.reconnectOnError = err => !!err.message.includes(this._REDIS_CONFIG.reconnect.targetError);
    this._redis = new Redis(redisOpts);
  }

  get() {
    return this._redis;
  }
  close() {
    if (this._redis) {
      this._redis.disconnect();
      this._redis = null;
    }
  }
}
