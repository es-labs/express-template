import StoreKeyV from './db/keyv.js';
import StoreKnex from './db/knex.js';
import StoreRedis from './db/redis.js';
import Wss from './websocket.js';
// import auth from '../auth/index.js'
import '../auth/index.js';

let servicesConfig = [];
const services = {};

const start = async (app, server, config = globalThis.__config?.SERVICES_CONFIG || []) => {
  // const serviceTypesAvailable = process.env.SERVICES_TYPES_AVAILABLE.split(',');
  try {
    servicesConfig = config;
    servicesConfig.forEach(svc => {
      const opts = globalThis.__config?.[svc.options];
      if (opts && svc.type === 'knex' && StoreKnex) services[svc.name] = new StoreKnex(opts);
      if (opts && svc.type === 'redis' && StoreRedis) services[svc.name] = new StoreRedis(opts);
      if (opts && svc.type === 'keyv' && StoreKeyV) services[svc.name] = new StoreKeyV(opts);
      if (opts && svc.type === 'ws' && Wss) services[svc.name] = new Wss(opts);

      if (opts) {
        if (svc.type === 'ws') {
          services[svc.name].open(server, app); // set server or get app object
        } else {
          services[svc.name].open();
        }
      }
    });
  } catch (e) {
    logger.info(e);
  }
};

const stop = async () => {
  logger.info('services - stop - begin');
  try {
    const promises = servicesConfig.map(svc => services[svc.name].close());
    await Promise.allSettled(promises);
  } catch (e) {
    logger.info(e.toString());
  }
  logger.info('services - stop - end');
};

const get = service => services[service]?.get() || null;

const list = () => servicesConfig;

export { get, list, start, stop };
