import StoreKeyV from './db/keyv.ts';
import StoreKnex from './db/knex.ts';
import StoreRedis from './db/redis.ts';
import Wss from './websocket.ts';
import '../auth/jwt.ts';

type ServiceConfig = { type: string; options: string };
let servicesConfig: Record<string, ServiceConfig> = {};
const services: Record<string, any> = {};

const start = async (app, server, config = globalThis.__config?.SERVICES_CONFIG || {}) => {
  try {
    servicesConfig = config;
    for (const [name, svc] of Object.entries(servicesConfig)) {
      const opts = globalThis.__config?.[svc.options];
      if (opts && svc.type === 'knex' && StoreKnex) services[name] = new StoreKnex(svc.options);
      if (opts && svc.type === 'redis' && StoreRedis) services[name] = new StoreRedis(opts);
      if (opts && svc.type === 'keyv' && StoreKeyV) services[name] = new StoreKeyV(opts);
      if (opts && svc.type === 'ws' && Wss) services[name] = new Wss(opts);

      if (opts) {
        if (svc.type === 'ws') {
          services[name].open(server, app); // set server or get app object
        } else {
          services[name].open();
        }
      }
    }
  } catch (e) {
    logger.info(e);
  }
};

const stop = async () => {
  logger.info('services - stop - begin');
  try {
    const promises = Object.keys(servicesConfig).map(name => services[name].close());
    await Promise.allSettled(promises);
  } catch (e) {
    logger.info(e.toString());
  }
  logger.info('services - stop - end');
};

const get = service => services[service]?.get() || null;

const list = () => servicesConfig;

export { get, list, start, stop };
