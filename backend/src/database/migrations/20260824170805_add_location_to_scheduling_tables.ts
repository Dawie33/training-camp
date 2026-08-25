import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema.alterTable('user_workout_schedule', (table) => {
        table.enum('location', ['home', 'box']).nullable()
    })

    await knex.schema.alterTable('scheduled_activities', (table) => {
        table.enum('location', ['home', 'box']).nullable()
    })
}


export async function down(knex: Knex): Promise<void> {
    await knex.schema.alterTable('user_workout_schedule', (table) => {
        table.dropColumn('location')
    })

    await knex.schema.alterTable('scheduled_activities', (table) => {
        table.dropColumn('location')
    })
}

