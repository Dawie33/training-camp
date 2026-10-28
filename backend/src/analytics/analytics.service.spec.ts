import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { AnalyticsService } from './analytics.service'

const USER_ID = 'user-1'

/**
 * Faux query builder Knex : chaque méthode de chaînage renvoie le builder, `first()` résout
 * `firstValue`, et un `await` direct sur le builder résout `rows`.
 */
function createBuilder(rows: unknown[] = [], firstValue?: unknown) {
  const builder: any = {}
  for (const method of ['select', 'where', 'whereNotNull', 'orderBy', 'join', 'leftJoin', 'min']) {
    builder[method] = jest.fn().mockReturnValue(builder)
  }
  builder.first = jest.fn().mockResolvedValue(firstValue)
  builder.then = (resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(rows).then(resolve, reject)
  return builder
}

interface Fixtures {
  sessions?: unknown[]
  oneRepMaxes?: unknown[]
  latestSession?: unknown
}

describe('AnalyticsService', () => {
  /** Une entrée par appel à knex(table) : une table interrogée deux fois donne deux builders. */
  let queries: { table: string; builder: any }[]

  async function getOverview(fixtures: Fixtures = {}) {
    const factories: Record<string, () => any> = {
      // Liste des séances (await direct) et date de la première séance (first)
      workout_sessions: () => createBuilder(fixtures.sessions ?? [], { first_started_at: null }),
      one_rep_maxes: () => createBuilder(fixtures.oneRepMaxes ?? []),
      benchmark_history: () => createBuilder(),
      one_rep_max_history: () => createBuilder(),
      skill_programs: () => createBuilder(),
      'skill_program_steps as sps': () => createBuilder(),
      'workout_sessions as ws': () => createBuilder([], fixtures.latestSession),
    }
    queries = []
    const knexMock: any = jest.fn((table: string) => {
      const builder = factories[table]()
      queries.push({ table, builder })
      return builder
    })
    knexMock.raw = jest.fn(() => 'raw')

    const moduleRef = await Test.createTestingModule({
      providers: [AnalyticsService, { provide: getConnectionToken(), useValue: knexMock }],
    }).compile()

    return moduleRef.get(AnalyticsService).getOverview(USER_ID, 3)
  }

  it("filtre chaque requête sur l'utilisateur", async () => {
    await getOverview()

    expect(queries).toHaveLength(8)
    for (const { table, builder } of queries) {
      const userFilter = builder.where.mock.calls.find(
        ([column, value]: [string, unknown]) => column.endsWith('user_id') && value === USER_ID
      )
      expect({ table, filtered: Boolean(userFilter) }).toEqual({ table, filtered: true })
    }
  })

  describe("durée d'effort", () => {
    it('préfère le chrono saisi, sinon l’écart début/fin, et écarte une séance de plus de 4 h', async () => {
      const overview = await getOverview({
        sessions: [
          // Chrono de 4 min dans une séance d'une heure : effort glycolytique
          {
            started_at: '2026-09-01T09:00:00.000Z',
            completed_at: '2026-09-01T10:00:00.000Z',
            results: { elapsed_time_seconds: 240 },
          },
          // Sans chrono : 20 min entre début et fin, effort aérobie
          { started_at: '2026-09-02T09:00:00.000Z', completed_at: '2026-09-02T09:20:00.000Z', results: null },
          // Chrono laissé tourner 5 h : ignoré
          { started_at: '2026-09-03T09:00:00.000Z', completed_at: '2026-09-03T14:00:00.000Z', results: {} },
        ],
      })

      const countOf = (domain: string) =>
        overview.energy_systems.domains.find(stat => stat.domain === domain)?.session_count ?? 0
      expect(overview.energy_systems.total_scored_sessions).toBe(2)
      expect(countOf('glycolytic')).toBe(1)
      expect(countOf('aerobic')).toBe(1)
    })
  })

  it('convertit en nombres les 1RM renvoyés en texte par Knex (decimal)', async () => {
    const overview = await getOverview({
      oneRepMaxes: [
        { lift: 'back_squat', value: '150.00' },
        { lift: 'front_squat', value: '127.50' },
      ],
      sessions: [
        {
          started_at: '2026-09-01T09:00:00.000Z',
          completed_at: '2026-09-01T10:00:00.000Z',
          results: { exercise_results: [{ name: 'Back Squat', section_type: 'strength', load_kg: 90, scaled: false }] },
        },
      ],
    })

    const ratio = overview.strength_ratios.ratios.find(r => r.key === 'front_squat_to_back_squat')
    expect(ratio?.value_pct).toBe(85)
    expect(overview.movements.movements[0].pct_of_1rm).toBe(60)
  })

  it('transmet la source des 1RM : un ratio sur un 1RM estimé est signalé', async () => {
    const overview = await getOverview({
      oneRepMaxes: [
        { lift: 'back_squat', value: '150.00', source: 'estimated' },
        { lift: 'front_squat', value: '127.50', source: 'real' },
      ],
    })

    const ratio = overview.strength_ratios.ratios.find(r => r.key === 'front_squat_to_back_squat')
    expect(ratio?.based_on_estimate).toBe(true)
  })

  it('ne retient que les exercices structurés et nommés', async () => {
    const overview = await getOverview({
      sessions: [
        {
          started_at: '2026-09-01T09:00:00.000Z',
          completed_at: '2026-09-01T10:00:00.000Z',
          results: {
            exercise_results: [
              { name: 'Thruster', section_type: 'metcon', load_kg: 42.5, scaled: false },
              { name: '   ', section_type: 'metcon', scaled: false },
              { section_type: 'metcon', load_kg: 50, scaled: false },
              'Wall Ball 9 kg',
            ],
          },
        },
        // Ancien format texte libre : ignoré
        {
          started_at: '2026-09-02T09:00:00.000Z',
          completed_at: '2026-09-02T10:00:00.000Z',
          results: { exercise_details: { 'Back Squat': '5x5 à 100 kg' } },
        },
      ],
    })

    expect(overview.movements.movements.map(m => m.name)).toEqual(['Thruster'])
  })

  describe('dernière séance', () => {
    const latestRow = (aiAnalysis: unknown) => ({
      id: 'session-9',
      started_at: '2026-09-20T09:00:00.000Z',
      ai_analysis: aiAnalysis,
      workout_name: 'Fran',
    })

    it('relit une analyse stockée en texte JSON', async () => {
      const overview = await getOverview({
        latestSession: latestRow(JSON.stringify({ summary: 'Bon pacing', performance_level: 'good' })),
      })

      expect(overview.latest_session).toMatchObject({ session_id: 'session-9', workout_name: 'Fran' })
      expect(overview.latest_session?.analysis).toMatchObject({ summary: 'Bon pacing', performance_level: 'good' })
    })

    it('renvoie une analyse nulle quand elle est incomplète ou illisible', async () => {
      const partial = await getOverview({ latestSession: latestRow({ summary: 'Sans niveau' }) })
      const unreadable = await getOverview({ latestSession: latestRow('{pas du json') })

      expect(partial.latest_session?.analysis).toBeNull()
      expect(unreadable.latest_session?.analysis).toBeNull()
    })

    it('renvoie null sans séance terminée', async () => {
      const overview = await getOverview()

      expect(overview.latest_session).toBeNull()
    })
  })
})
