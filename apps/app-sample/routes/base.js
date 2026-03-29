import express from "express";
import * as s from "@es-labs/node/services";

function openMissingFile() {
  fs.readFile('somefile4.txt', (err, data) => {
    if (err) throw err // will cause node JS to crash if throw error in error handler. just handle error inside here or "return next(err)"
  })
}
// openMissingFile() // test error handling

// How to Define Healthiness of an Application
// Server can respond to requests.
// Server can respond to requests and can connect to database.
// Server can respond to requests, can connect to database, and can connect with other third-party systems and integrations
export default express.Router()
  .get('/', (req, res) => res.send({ status: 'app-sample OK' }))
  .get('/healthcheck', (req, res) => res.send({ status: 'app-sample/healthcheck OK' }))
  .get('/check-db', async (req, res) => {
    const connectionName = req.query.conn || 'knex1' // refer to .env.sample file for this value
    const connQuery = req.query.sql || 'SELECT 1'
    try {
      const knex1 = s.get(connectionName) // knex object, can have more than 1
      const { config } = knex1.context.client
      const rv = await knex1.raw(connQuery) // also can try knex1(<table name>).query()
      return res.status(200).json({
        connectionName,
        db: config.client, // DB Type
        result: rv,
      })
    } catch (e) {
      console.log(e)
      return res.status(500).json(e)
    }
  })
