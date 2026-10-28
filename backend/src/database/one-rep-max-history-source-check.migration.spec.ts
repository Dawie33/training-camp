import knexFactory, { Knex } from 'knex'
import { down, up } from './migrations/20261027104512_add_one_rep_max_history_source_check'

/**
 * Pas de base de données : un vrai Knex « pg » génère le SQL, mais la couche connexion
 * est remplacée par un faux qui enregistre chaque requête et renvoie un nombre de lignes.
 */
function createRecordingKnex(rowCounts: number[] = []) {
  const queries: { sql: string; bindings: unknown[] }[] = []
  const knex: Knex = knexFactory({ client: 'pg' })
  const client = knex.client as Record<string, unknown>
  client.acquireConnection = async () => ({})
  client.releaseConnection = async () => undefined
  client._query = async (_connection: unknown, query: { sql: string; bindings: unknown[]; response?: unknown }) => {
    queries.push({ sql: query.sql, bindings: query.bindings })
    query.response = { rowCount: rowCounts.shift() ?? 0, rows: [], command: 'UPDATE' }
    return query
  }
  return { knex, queries }
}

describe('migration add_one_rep_max_history_source_check', () => {
  let warn: jest.SpyInstance

  beforeEach(() => {
    warn = jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  afterEach(() => warn.mockRestore())

  it('normalise les sources avant de poser la contrainte CHECK', async () => {
    const { knex, queries } = createRecordingKnex()

    await up(knex)

    expect(queries).toHaveLength(3)
    // 1. casse / espaces → valeur canonique
    expect(queries[0].sql).toBe(
      'update "one_rep_max_history" set "source" = lower(trim(source)) where "source" not in ($1, $2) and lower(trim(source)) = ANY($3)'
    )
    expect(queries[0].bindings).toEqual(['real', 'estimated', ['real', 'estimated']])
    // 2. valeur inconnue → 'estimated'
    expect(queries[1].sql).toBe('update "one_rep_max_history" set "source" = $1 where "source" not in ($2, $3)')
    expect(queries[1].bindings).toEqual(['estimated', 'real', 'estimated'])
    // 3. la contrainte, en dernier : sinon l'ALTER TABLE échouerait sur une donnée existante
    expect(queries[2].sql).toContain('ADD CONSTRAINT one_rep_max_history_source_check')
    expect(queries[2].sql).toContain("CHECK (source IN ('real', 'estimated'))")
    expect(warn).not.toHaveBeenCalled()
  })

  it('signale dans les logs les lignes de source inconnue passées à estimated', async () => {
    const { knex } = createRecordingKnex([0, 2])

    await up(knex)

    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("2 ligne(s) avec une source inconnue passée(s) à 'estimated'")
    )
  })

  it('down retire uniquement la contrainte', async () => {
    const { knex, queries } = createRecordingKnex()

    await down(knex)

    expect(queries).toHaveLength(1)
    expect(queries[0].sql).toBe(
      'ALTER TABLE one_rep_max_history DROP CONSTRAINT IF EXISTS one_rep_max_history_source_check'
    )
  })
})
