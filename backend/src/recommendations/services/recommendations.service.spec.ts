import { Test } from '@nestjs/testing'
import { OpenAIClientService } from 'src/common/ai/openai-client.service'
import type { UserAIContext } from 'src/user-context/types/user-context.types'
import { UserContextService } from 'src/user-context/user-context.service'
import { RecommendationsService } from './recommendations.service'
import { DailyCoachStore } from './daily-coach-store.service'

describe('RecommendationsService.computeSessionStats', () => {
  let service: RecommendationsService
  const store = { run: jest.fn() }
  const openai = { createJsonCompletion: jest.fn() }
  const userContext = { getUserAIContext: jest.fn() }

  beforeEach(async () => {
    jest.clearAllMocks()
    const moduleRef = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: OpenAIClientService, useValue: openai },
        { provide: UserContextService, useValue: userContext },
        { provide: DailyCoachStore, useValue: store },
      ],
    }).compile()
    service = moduleRef.get(RecommendationsService)
  })

  afterEach(() => jest.useRealTimers())

  it('conserve les statistiques dans le prompt sans les persister dans le résultat de recommandation', async () => {
    const ctx: UserAIContext = {
      sport_level: 'intermediate',
      oneRepMaxes: [],
      benchmarkResults: {},
      global_goals: {},
      injuries: [],
      physical_limitations: {},
      equipment_available: [],
      training_preferences: {},
      recentSessions: [{ date: '2026-10-05', sport: 'crossfit', duration_minutes: 45 }],
      recentAnalyses: [],
      activeSkills: [],
      completedSkillNames: [],
      progressionReports: [],
      diagnostic: {
        ratio_imbalances: [],
        underworked_domains: [],
        load_zone: null,
        load_change_pct: null,
        most_scaled_movements: [],
        benchmark_trends: [],
        sessions_per_week: 0,
        consistency_pct: 0,
        running: null,
      },
    }
    const recommendation = {
      recommended_sport: 'rest',
      recommended_type: 'active_recovery',
      urgency: 'low',
      reason: 'Récupération',
      coaching_insight: 'Repos actif',
      suggested_duration: 20,
    }
    userContext.getUserAIContext.mockResolvedValue(ctx)
    openai.createJsonCompletion.mockResolvedValue(recommendation)
    store.run.mockImplementationOnce(async (_user, _day, _operation, prepare) => (await prepare())())

    await expect(service.getNextSessionRecommendation('u', '2026-10-06')).resolves.toEqual({ recommendation })
    expect(openai.createJsonCompletion.mock.calls[0][0].messages[1].content).toContain(
      'CrossFit : 1 séance(s) — dernière il y a 1j'
    )
  })

  it('change de clé uniquement à minuit à Paris, pas à minuit UTC', async () => {
    jest.useFakeTimers({ now: new Date('2026-10-05T21:59:59Z') })
    await service.getNextSessionRecommendation('u')
    jest.setSystemTime(new Date('2026-10-05T22:00:00Z'))
    await service.getNextSessionRecommendation('u')
    jest.setSystemTime(new Date('2026-10-06T00:00:00Z'))
    await service.getNextSessionRecommendation('u')
    expect(store.run.mock.calls.map(call => call.slice(0, 3))).toEqual([
      ['u', '2026-10-05', 'recommendation'],
      ['u', '2026-10-06', 'recommendation'],
      ['u', '2026-10-06', 'recommendation'],
    ])
  })

  it.each([
    [[], null],
    [[{ date: '2026-10-06', sport: 'crossfit' }], 0],
    [[{ date: '2026-10-03', sport: 'crossfit' }], 3],
  ])('calcule les jours depuis les séances %j', (recentSessions, days) => {
    jest.useFakeTimers({ now: new Date('2026-10-06T10:00:00Z') })
    const stats = service['computeSessionStats']({ recentSessions } as UserAIContext)
    expect(stats.days_since_last).toBe(days)
    expect(stats.total_sessions_21d).toBe(recentSessions.length)
  })

  it("compte les jours depuis la dernière séance à partir d'aujourd'hui à Paris, même entre minuit et 2 h", () => {
    // Arrange — 22 h 30 UTC le 5 octobre = 0 h 30 le 6 octobre à Paris ; dernière séance le 5
    jest.useFakeTimers({ now: new Date('2026-10-05T22:30:00Z') })
    const ctx = { recentSessions: [{ date: '2026-10-05', sport: 'crossfit' }] } as unknown as UserAIContext

    // Act
    const stats = service['computeSessionStats'](ctx)

    // Assert
    expect(stats.days_since_last).toBe(1)
    expect(stats.total_sessions_21d).toBe(1)
  })

  it('compte plus de 10 séances sans limiter les statistiques au détail du prompt', () => {
    jest.useFakeTimers({ now: new Date('2026-10-06T10:00:00Z') })
    const ctx = {
      recentSessions: Array.from({ length: 15 }, () => ({ date: '2026-10-05', sport: 'crossfit' })),
    } as UserAIContext

    const stats = service['computeSessionStats'](ctx)

    expect(stats.total_sessions_21d).toBe(15)
    expect(stats.days_since_last).toBe(1)
  })

  it('calcule les délais par type avec le jour demandé, même si minuit est passé pendant la préparation', () => {
    jest.useFakeTimers({ now: new Date('2026-10-06T22:01:00Z') })
    const ctx = {
      recentSessions: [
        { date: '2026-10-03', sport: 'crossfit', workout_type: 'strength_max' },
        { date: '2026-10-06', sport: 'crossfit', workout_type: 'conditioning' },
        { date: '2026-10-05', sport: 'crossfit', workout_type: 'strength_max' },
        { date: '2026-10-06', sport: 'crossfit', workout_type: 'legacy_type' },
        { date: '2026-10-06', sport: 'crossfit' },
      ],
    } as UserAIContext

    const stats = service['computeSessionStats'](ctx, '2026-10-06')

    expect(stats.days_since_last_by_type).toEqual({
      technique_metcon: null,
      strength_max: 1,
      conditioning: 0,
      vo2max: null,
      core: null,
    })
    expect(stats.total_sessions_21d).toBe(5)
  })
})
