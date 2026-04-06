import { Keyv } from 'keyv';

export default class StoreKeyV {
  constructor(options = globalThis.__config?.KEYV_CACHE || {}) {
    this._KEYV_CACHE = options;
    this._keyv = null;
  }
  open() {
    this._keyv = this._KEYV_CACHE ? new Keyv(this._KEYV_CACHE) : new Keyv();
    this._keyv.on('error', err => {
      logger.error('keyv Connection Error', err);
    });
  }
  get() {
    return this._keyv;
  }
  close() {
    this._keyv = null;
  }
}
