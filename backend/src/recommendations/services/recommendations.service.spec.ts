import { Test } from '@nestjs/testing'
import { OpenAIClientService } from 'src/common/ai/openai-client.service'
import { UserAIContext, UserContextService } from 'src/workouts/services/user-context.service'
import { RecommendationsService } from './recommendations.service'

describe('RecommendationsService.computeSessionStats', () => {
  let service: RecommendationsService

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RecommendationsService,
        { provide: OpenAIClientService, useValue: {} },
        { provide: UserContextService, useValue: {} },
      ],
    }).compile()
    service = moduleRef.get(RecommendationsService)
  })

  afterEach(() => jest.useRealTimers())

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
