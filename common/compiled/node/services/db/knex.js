import Knex from 'knex';
export default class StoreKnex {
  constructor(optionName) {
    const options = globalThis.__config?.[optionName];
    options.connection = process.env[optionName];
    this._KNEXFILE = options;
    this._knex = null;
    this.name = optionName;
  }

  async open() {
    if (!this._KNEXFILE) {
      logger.info('KNEXFILE property empty or undefined - knex not started');
    } else {
      try {
        this._knex = Knex(this._KNEXFILE);
        await this._knex
          .raw('Select 1')
          .then(() => {
            logger.info(`knex CONNECTED(${this.name})`);
          })
          .catch(err => {
            logger.info(`knex ERROR1(${this.name}): ${err.toString()}`);
          });
      } catch (e) {
        logger.info(`knex ERROR2(${this.name}): ${e.toString()}`);
      }
    }
  }
  get() {
    return this._knex;
  }
  async close() {
    if (this._knex) await this._knex.destroy();
    logger.info(`knex CLOSED(${this.name})`);
  }
}

// NOSONAR
// Model.knex().destroy(() => {}) // returns a promise
// Update with your config settings.
// Mysql 8 issue for now
// ALTER USER 'user'@'%' IDENTIFIED WITH mysql_native_password BY 'user123!@#PK';
// FLUSH PRIVILEGES;
// npx knex migrate:make create_users --env development
// npx knex migrate:latest --env development
// npx knex seed:make seed_name --env development
// npx knex seed:run --env development
// migrations
//
// exports.up = function (knex, Promise) {
//   return Promise.all([
//     knex.schema.createTable('ideas', table => {
//       table.increments('id').primary()
//       table.string('idea')
//       table.string('creator')
//     })
//   ])
// }
// exports.down = function (knex, Promise) {
//   return Promise.all([
//     knex.schema.dropTable('ideas')
//   ])
// }
// seeds
// exports.seed = function (knex, Promise) {
//   return knex('ideas').del().then(() => {
//     return knex('ideas').insert([
//         {creator: 'Ali', idea: 'A To Do List app!'},
//         {creator: 'Ali', idea: 'A Blog!'},
//         {creator: 'Ali', idea: 'A calculator'}
//     ])
//   })
// }

// https://dev.to/aspittel/objection--knex--painless-postgresql-in-your-node-app--6n6
