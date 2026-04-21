import Knex from 'knex';
export default class StoreKnex {
  _KNEXFILE: Parameters<typeof Knex>[0] | null;
  _knex: ReturnType<typeof Knex> | null;
  name: string;

  constructor(optionName?: string) {
    const options = optionName ? globalThis.__config?.[optionName] : {};
    if (options) options.connection = process.env[optionName];
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
