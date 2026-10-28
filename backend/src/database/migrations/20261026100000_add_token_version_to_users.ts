import type { Knex } from 'knex'

/**
 * Version des jetons JWT d'un utilisateur, recopiée dans chaque jeton à sa création.
 *
 * La déconnexion l'incrémente : tous les jetons émis avant portent l'ancienne version
 * et sont refusés par JwtStrategy, même s'ils ne sont pas encore expirés.
 */
export async function up(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', table => {
    table.integer('token_version').notNullable().defaultTo(0)
  })
}

export async function down(knex: Knex): Promise<void> {
  await knex.schema.alterTable('users', table => {
    table.dropColumn('token_version')
  })
}
