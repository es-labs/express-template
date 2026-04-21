import { Redis } from 'ioredis';

interface RedisConfig {
  opts: Record<string, unknown>;
  retry?: { step: number; max: number };
  reconnect?: { targetError: string };
}

export default class StoreRedis {
  _REDIS_CONFIG: RedisConfig;
  _redis: Redis | null;

  constructor(options: RedisConfig = globalThis.__config?.REDIS_CONFIG ?? { opts: {} }) {
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
