/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.raw(`
    CREATE OR REPLACE FUNCTION enforce_append_only()
    RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      RAISE EXCEPTION 'Table % is append-only — % is not permitted',
        TG_TABLE_NAME, TG_OP;
    END;
    $$
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw(`DROP FUNCTION IF EXISTS enforce_append_only()`);
}
