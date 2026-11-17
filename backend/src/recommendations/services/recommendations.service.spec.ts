import { Test } from '@nestjs/testing'
import { OpenAIClientService } from 'src/common/ai/openai-client.service'
import { UserAIContext, UserContextService } from 'src/workouts/services/user-context.service'
import { RecommendationsService } from './recommendations.service'
import { DailyCoachStore } from './daily-coach-store.service'

describe('RecommendationsService.computeSessionStats', () => {
  let service: RecommendationsService
  const store = { run: jest.fn() }

  beforeEach(async () => {
    jest.clearAllMocks()
    const moduleRef = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: OpenAIClientService, useValue: {} },
        { provide: UserContextService, useValue: {} },
        { provide: DailyCoachStore, useValue: store },
      ],
    }).compile()
    service = moduleRef.get(RecommendationsService)
  })

  afterEach(() => jest.useRealTimers())

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
    expect(stats.days_since_last.crossfit).toBe(days)
    expect(stats.total_sessions_21d).toBe(recentSessions.length)
  })

  it("compte les jours depuis la dernière séance à partir d'aujourd'hui à Paris, même entre minuit et 2 h", () => {
    // Arrange — 22 h 30 UTC le 5 octobre = 0 h 30 le 6 octobre à Paris ; dernière séance le 5
    jest.useFakeTimers({ now: new Date('2026-10-05T22:30:00Z') })
    const ctx = { recentSessions: [{ date: '2026-10-05', sport: 'crossfit' }] } as unknown as UserAIContext

    // Act
    const stats = service['computeSessionStats'](ctx)

    // Assert
    expect(stats.days_since_last).toEqual({ crossfit: 1 })
    expect(stats.total_sessions_21d).toBe(1)
  })
})
