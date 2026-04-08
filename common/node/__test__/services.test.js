import '../config.js'; // setup env vars
import assert from 'node:assert';
import { after, before, describe, it } from 'node:test';
import StoreKnex from '../node/services/db/knex.js';

let sqldb;

const RUN_TEST = false;
if (RUN_TEST) {
  before(async () => {
    sqldb = new StoreKnex();
    await sqldb.open();
  });

  after(async () => {
    await sqldb.close();
  });

  describe('Test Services', () => {
    it.skip('Test Knex', async () => {
      const knex = sqldb.get();
      const rv = (await knex('users').where({ username: 'ais-one' }).first()).githubId;
      assert.strictEqual(rv, 4284574);
    });
  });

  describe('Services Test', () => {
    it.skip('should pass', () => {
      assert.strictEqual(true, true);
    });
  });
}
