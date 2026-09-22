import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { AnalyticsService } from 'src/analytics/analytics.service'
import { UserContextService } from './user-context.service'

/**
 * Le diagnostic vient du module analytics, testé séparément par ses propres
 * calculateurs : ici on le neutralise pour n'éprouver que l'agrégation de contexte.
 */
const emptyOverview = {
  strength_ratios: { ratios: [], missing_lifts: [] },
  energy_systems: { total_scored_sessions: 0, domains: [], underworked: [] },
  load: { acwr_zone: null, last_week_change_pct: null },
  movements: { most_scaled: [] },
  benchmarks: [],
  volume: { avg_per_week: 0, consistency_pct: 0 },
}

const analyticsMock = { getOverview: jest.fn().mockResolvedValue(emptyOverview) }

/**
 * Le service enchaîne 7 requêtes Knex en Promise.all, chacune terminée par un
 * maillon différent (.first(), .orderBy(), .limit(), .groupBy(), .pluck()). Plutôt
 * que de mocker chaque méthode terminale une par une (voir skill testing-knex-nestjs),
 * on rend le builder "thenable" : toutes les méthodes de chaînage renvoient le
 * builder, et son .then() résout directement la valeur voulue, quel que soit le
 * dernier maillon appelé par le service.
 */
const CHAIN_METHODS = [
  'select', 'where', 'whereNotNull', 'whereRaw', 'whereIn', 'leftJoin', 'join',
  'orderBy', 'limit', 'offset', 'groupBy', 'first', 'on', 'andOnVal', 'andOn', 'pluck',
]

function createChainableBuilder(resolvedValue: unknown) {
  const builder: any = {}
  for (const method of CHAIN_METHODS) {
    builder[method] = jest.fn().mockReturnThis()
  }
  builder.then = (resolve: (value: unknown) => void) => resolve(resolvedValue)
  return builder
}

interface QueryOverrides {
  profile?: unknown
  oneRepMaxes?: unknown[]
  cfSessions?: unknown[]
  recentAnalyses?: unknown[]
  activeSkills?: unknown[]
  completedSkillNames?: unknown[]
  progressionReports?: unknown[]
}

/**
 * L'ordre des mockImplementationOnce suit l'ordre des `this.knex(...)` dans
 * getUserAIContext() : users, one_rep_maxes, workout_sessions (crossfit),
 * workout_sessions (analyses), skill_programs (actives), skill_programs (terminees),
 * tracking_reports.
 */
function createKnexMock(overrides: QueryOverrides = {}) {
  const knexMock: any = jest
    .fn()
    .mockImplementationOnce(() => createChainableBuilder(overrides.profile ?? null))
    .mockImplementationOnce(() => createChainableBuilder(overrides.oneRepMaxes ?? []))
    .mockImplementationOnce(() => createChainableBuilder(overrides.cfSessions ?? []))
    .mockImplementationOnce(() => createChainableBuilder(overrides.recentAnalyses ?? []))
    .mockImplementationOnce(() => createChainableBuilder(overrides.activeSkills ?? []))
    .mockImplementationOnce(() => createChainableBuilder(overrides.completedSkillNames ?? []))
    .mockImplementationOnce(() => createChainableBuilder(overrides.progressionReports ?? []))
  knexMock.raw = jest.fn((sql: string) => sql)
  return knexMock
}

/** Mock répétable (pas de mockImplementationOnce) pour les tests de cache. */
function createRepeatableKnexMock() {
  const knexMock: any = jest.fn(() => createChainableBuilder([]))
  knexMock.raw = jest.fn((sql: string) => sql)
  return knexMock
}

async function buildService(knexMock: any): Promise<UserContextService> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      UserContextService,
      { provide: getConnectionToken(), useValue: knexMock },
      { provide: AnalyticsService, useValue: analyticsMock },
    ],
  }).compile()

  return moduleRef.get(UserContextService)
}

describe('UserContextService.getUserAIContext', () => {
  it('profil absent en base → applique les valeurs par défaut', async () => {
    // Arrange
    const knexMock = createKnexMock()
    const service = await buildService(knexMock)

    // Act
    const result = await service.getUserAIContext('user-1')

    // Assert
    expect(result.sport_level).toBe('intermediate')
    expect(result.equipment_available).toEqual([])
    expect(result.training_preferences).toEqual({})
    expect(result.injuries).toEqual({})
    expect(result.oneRepMaxes).toEqual([])
  })

  it('profil présent → reprend les champs du profil tels quels', async () => {
    // Arrange
    const knexMock = createKnexMock({
      profile: {
        sport_level: 'advanced',
        height: 180,
        weight: 82,
        benchmark_results: { fran: { result: { time: '5:00' }, date: '2026-01-01' } },
        injuries: { shoulder: 'left' },
        physical_limitations: {},
        global_goals: { strength: true },
        equipment_available: ['barbell', 'rower'],
        training_preferences: { preferred_duration: 60 },
      },
      oneRepMaxes: [{ lift: 'back_squat', value: 120 }],
    })
    const service = await buildService(knexMock)

    // Act
    const result = await service.getUserAIContext('user-1')

    // Assert
    expect(result.sport_level).toBe('advanced')
    expect(result.height).toBe(180)
    expect(result.weight).toBe(82)
    expect(result.equipment_available).toEqual(['barbell', 'rower'])
    expect(result.oneRepMaxes).toEqual([{ lift: 'back_squat', value: 120 }])
    expect(knexMock).toHaveBeenNthCalledWith(1, 'users')
    expect(knexMock).toHaveBeenNthCalledWith(2, 'one_rep_maxes')
  })

  it('trie les séances par date décroissante et calcule leur durée', async () => {
    // Arrange
    const knexMock = createKnexMock({
      cfSessions: [
        { started_at: '2026-08-27T18:00:00Z', completed_at: '2026-08-27T18:50:00Z', workout_type: 'strength', perceived_effort: '7' },
        { started_at: '2026-08-28T10:00:00Z', completed_at: '2026-08-28T10:45:00Z', workout_type: 'metcon', perceived_effort: '8' },
      ],
    })
    const service = await buildService(knexMock)

    // Act
    const result = await service.getUserAIContext('user-1')

    // Assert — le travail de force est désormais un type de séance CrossFit, pas un sport distinct
    expect(result.recentSessions).toEqual([
      { date: '2026-08-28', sport: 'crossfit', workout_type: 'metcon', duration_minutes: 45, perceived_effort: 8 },
      { date: '2026-08-27', sport: 'crossfit', workout_type: 'strength', duration_minutes: 50, perceived_effort: 7 },
    ])
  })

  it('limite les séances récentes à 20, en gardant les plus récentes', async () => {
    // Arrange
    const cfSessions = Array.from({ length: 25 }, (_, i) => {
      const day = String(i + 1).padStart(2, '0')
      return {
        started_at: `2026-01-${day}T10:00:00Z`,
        completed_at: `2026-01-${day}T10:20:00Z`,
        workout_type: 'metcon',
        perceived_effort: '5',
      }
    })
    const knexMock = createKnexMock({ cfSessions })
    const service = await buildService(knexMock)

    // Act
    const result = await service.getUserAIContext('user-1')

    // Assert
    expect(result.recentSessions).toHaveLength(20)
    expect(result.recentSessions[0].date).toBe('2026-01-25')
    expect(result.recentSessions[19].date).toBe('2026-01-06')
  })

  it('recentAnalyses : parse ai_analysis qu\'il soit JSON string ou déjà objet', async () => {
    // Arrange
    const knexMock = createKnexMock({
      recentAnalyses: [
        {
          started_at: '2026-08-20T10:00:00Z',
          workout_name: 'Fran',
          ai_analysis: JSON.stringify({ performance_level: 'pr', strengths: ['pacing'], improvements: ['grip'], next_steps: 'plus de volume' }),
        },
        {
          started_at: '2026-08-15T10:00:00Z',
          workout_name: 'Grace',
          ai_analysis: { performance_level: 'average', strengths: [], improvements: [], next_steps: '' },
        },
      ],
    })
    const service = await buildService(knexMock)

    // Act
    const result = await service.getUserAIContext('user-1')

    // Assert
    expect(result.recentAnalyses).toEqual([
      { date: '2026-08-20', workout_name: 'Fran', performance_level: 'pr', strengths: ['pacing'], improvements: ['grip'], next_steps: 'plus de volume' },
      { date: '2026-08-15', workout_name: 'Grace', performance_level: 'average', strengths: [], improvements: [], next_steps: '' },
    ])
  })

  it('activeSkills : parse recommended_exercises qu\'il soit JSON string ou déjà tableau', async () => {
    // Arrange
    const knexMock = createKnexMock({
      activeSkills: [
        {
          program_id: 'p1', skill_name: 'Muscle-up', skill_category: 'gymnastics',
          step_id: 's1', step_title: 'Strict pull-ups', step_description: undefined,
          recommended_exercises: JSON.stringify([{ name: 'Strict pull-up', sets: 5, reps: 5 }]),
          coaching_tips: undefined, last_trained: null,
        },
        {
          program_id: 'p2', skill_name: 'Snatch', skill_category: 'weightlifting',
          step_id: 's2', step_title: 'Overhead squat', step_description: undefined,
          recommended_exercises: [{ name: 'Overhead squat', sets: 3, reps: 5 }],
          coaching_tips: undefined, last_trained: '2026-08-01',
        },
      ],
    })
    const service = await buildService(knexMock)

    // Act
    const result = await service.getUserAIContext('user-1')

    // Assert
    expect(result.activeSkills[0].recommended_exercises).toEqual([{ name: 'Strict pull-up', sets: 5, reps: 5 }])
    expect(result.activeSkills[1].recommended_exercises).toEqual([{ name: 'Overhead squat', sets: 3, reps: 5 }])
  })

  it('progressionReports : parse report qu\'il soit JSON string ou déjà objet', async () => {
    // Arrange
    const knexMock = createKnexMock({
      progressionReports: [
        {
          sport: 'crossfit', period_months: 3, generated_at: '2026-08-01',
          report: JSON.stringify({ overall_trend: 'improving', period_summary: 'Progression continue', strengths: ['engine'], weak_points: ['gymnastics'], recommendations: ['plus de skill work'] }),
        },
      ],
    })
    const service = await buildService(knexMock)

    // Act
    const result = await service.getUserAIContext('user-1')

    // Assert
    expect(result.progressionReports).toEqual([
      {
        sport: 'crossfit', period_months: 3, overall_trend: 'improving', period_summary: 'Progression continue',
        strengths: ['engine'], weak_points: ['gymnastics'], recommendations: ['plus de skill work'],
        overall_fitness_level: undefined, generated_at: '2026-08-01',
      },
    ])
  })

  it('un deuxième appel dans le TTL (30min) ne réinterroge pas la base', async () => {
    // Arrange
    const knexMock = createRepeatableKnexMock()
    const service = await buildService(knexMock)

    // Act
    await service.getUserAIContext('user-1')
    await service.getUserAIContext('user-1')

    // Assert
    expect(knexMock).toHaveBeenCalledTimes(7)
  })

  it('invalidateCache force une nouvelle interrogation de la base', async () => {
    // Arrange
    const knexMock = createRepeatableKnexMock()
    const service = await buildService(knexMock)

    // Act
    await service.getUserAIContext('user-1')
    service.invalidateCache('user-1')
    await service.getUserAIContext('user-1')

    // Assert
    expect(knexMock).toHaveBeenCalledTimes(14)
  })

  it('completedSkillNames : reprend les noms des programmes de competence termines', async () => {
    // Arrange
    const knexMock = createKnexMock({ completedSkillNames: ['Muscle-Up', 'Handstand Walk'] })
    const service = await buildService(knexMock)

    // Act
    const result = await service.getUserAIContext('user-1')

    // Assert
    expect(result.completedSkillNames).toEqual(['Muscle-Up', 'Handstand Walk'])
  })
})
