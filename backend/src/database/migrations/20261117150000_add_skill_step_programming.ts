import { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('skill_program_steps', table => {
    table.text('frequency').nullable()
    table.text('when_to_train').nullable()
    table.text('warmup').nullable()
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('skill_program_steps', table => {
    table.dropColumns('frequency', 'when_to_train', 'warmup')
  })
}
