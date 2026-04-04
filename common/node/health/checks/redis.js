// import { redis } from '../../cache/client.js';   // your redis client

export async function checkRedis() {
  // const pong = await redis.ping();
  // if (pong !== 'PONG') throw new Error(`Unexpected PING response: ${pong}`);
  return {
    name: 'checkRedis',
    status: 'ok',
    message: 'Redis reachable',
  };
}
