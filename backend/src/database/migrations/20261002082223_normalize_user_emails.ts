import type { Knex } from 'knex'

export async function up(knex: Knex): Promise<void> {
  // Deux comptes dont les emails ne diffèrent que par la casse ne peuvent pas être fusionnés automatiquement :
  // on s'arrête avec un message clair plutôt que de laisser échouer la contrainte unique.
  // Le message ne contient pas les emails, pour ne pas les écrire dans les logs.
  const duplicates = await knex('users')
    .select(knex.raw('lower(trim(email)) AS email'))
    .groupByRaw('lower(trim(email))')
    .havingRaw('count(*) > 1')
  if (duplicates.length > 0) {
    throw new Error(
      `${duplicates.length} email(s) existent en plusieurs exemplaires à la casse près. ` +
        'Fusionner ou supprimer les comptes en double avant de relancer la migration.'
    )
  }

  await knex('users').update({ email: knex.raw('lower(trim(email))') })

  // Garde-fou en base : même si un futur code oublie de normaliser, deux emails
  // qui ne diffèrent que par la casse ne peuvent plus coexister.
  await knex.raw('CREATE UNIQUE INDEX users_email_lower_unique ON users (lower(email))')
}

export async function down(knex: Knex): Promise<void> {
  // La casse d'origine des emails est perdue : seul l'index est retiré.
  await knex.raw('DROP INDEX IF EXISTS users_email_lower_unique')
}
