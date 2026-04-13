// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
import ClientPgLite from 'knex-pglite';

export default {
  development: {
    client: ClientPgLite,
    dialect: 'postgres',
    connection: { connectionString: './dev.db' },
  },

  staging: {
    client: 'mysql', // postgresql
    connection: {
      database: 'my_db',
      user: 'username',
      password: 'password',
    },
    pool: {
      min: 2,
      max: 10,
    },
    migrations: {
      tableName: 'knex_migrations',
    },
  },
  production: {
    // information for this should be from a secrets file or env
  },
};
