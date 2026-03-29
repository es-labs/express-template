// import { db } from '../../db/client.js';   // your db client
export async function checkDatabase() {
  // await db.raw('SELECT 1');   // or db.execute / pool.query etc.
  return {
    name:    'checkDatabase',
    status:  'ok',
    message: 'Database reachable',
  };
}