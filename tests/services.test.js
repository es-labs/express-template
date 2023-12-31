
'use strict'
let sqldb

require('../env')

beforeAll(async () => {
  await require('@es-labs/node/config')(process.cwd())
  const StoreKnex = require('@es-labs/node/services/db/knex') 
  sqldb = new StoreKnex()
  await sqldb.open()
})
afterAll(async () => {
  await sqldb.close()
})  

describe('Test Services', () => {
  it('Test Knex', async () => {
    let knex = sqldb.get()
    const rv = ( await knex('users').where({ username: 'ais-one' }).first() ).githubId
    expect(rv).toStrictEqual(4284574)
  })
})

describe('Services Test', () => {
  it('should pass', () => {
    expect(true).toBe(true)
  })
})
