import type { Knex } from 'knex'

/**
 * `one_rep_max_history.source` était un varchar libre, alors que `one_rep_maxes.source` est l'enum
 * `one_rm_source` ('real', 'estimated') : seule la validation du DTO protégeait la colonne.
 *
 * Le code n'écrit que 'real' ou 'estimated' (OneRepMaxesService.upsert, backfill depuis l'enum,
 * défaut de la colonne). Une autre valeur ne peut venir que d'une écriture SQL manuelle : on la
 * normalise avant de poser la contrainte, sinon l'ALTER TABLE échouerait.
 * - casse / espaces ('Real ', 'ESTIMATED') → valeur canonique
 * - toute autre valeur → 'estimated' : un 1RM d'origine inconnue ne doit pas s'afficher « Mesuré »
 *
 * Irréversible pour ces lignes : le down retire la contrainte mais ne restaure pas les valeurs d'origine.
 */
const ALLOWED_SOURCES = ['real', 'estimated']

export async function up(knex: Knex): Promise<void> {
  await knex('one_rep_max_history')
    .whereNotIn('source', ALLOWED_SOURCES)
    .whereRaw('lower(trim(source)) = ANY(?)', [ALLOWED_SOURCES])
    .update({ source: knex.raw('lower(trim(source))') })

  const unknownCount = await knex('one_rep_max_history')
    .whereNotIn('source', ALLOWED_SOURCES)
    .update({ source: 'estimated' })
  if (unknownCount > 0) {
    console.warn(`[one_rep_max_history] ${unknownCount} ligne(s) avec une source inconnue passée(s) à 'estimated'`)
  }

  await knex.raw(`
    ALTER TABLE one_rep_max_history
    ADD CONSTRAINT one_rep_max_history_source_check
      CHECK (source IN ('real', 'estimated'))
  `)
}

export async function down(knex: Knex): Promise<void> {
  await knex.raw('ALTER TABLE one_rep_max_history DROP CONSTRAINT IF EXISTS one_rep_max_history_source_check')
}
