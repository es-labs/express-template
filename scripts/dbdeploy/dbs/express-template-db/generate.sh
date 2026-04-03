#!/bin/bash
npx knex --knexfile dbs/express-template-db/knexfile.js migrate:up
npx knex --knexfile dbs/express-template-db/knexfile.js migrate:up
npx knex --knexfile dbs/express-template-db/knexfile.js seed:run
