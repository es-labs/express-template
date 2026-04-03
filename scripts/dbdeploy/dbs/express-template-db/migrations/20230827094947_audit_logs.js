/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.createTable('audit_logs', (table) => {
    table.increments('id').primary()
    table.string('user')
    table.datetime('timestamp')
    table.string('db_name')
    table.string('table_name')
    table.string('op').comment('READ, UPDATE, DELETE, INSERT')
    table.string('where_cols')
    table.string('where_vals')
    table.string('cols_changed')
    table.text('prev_values')
    table.text('new_values')
    table.index(['timestamp', 'db_name', 'op'])
  })
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.dropTableIfExists('audit_logs')
}
