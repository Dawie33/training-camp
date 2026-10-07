import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { OpenAIClientService } from 'src/common/ai/openai-client.service'
import { UserContextService } from 'src/workouts/services/user-context.service'
import { TrackingService } from './tracking.service'

/** Colonne timestamptz telle que la renvoie le driver pg : un objet Date. */
const at = (iso: string) => new Date(iso)

describe('TrackingService — agrégation et prompt du bilan', () => {
  let service: TrackingService
  // Méthodes privées testées directement : ce sont des calculs purs sur les sessions
  let internals: {
    aggregateCrossfit: (sessions: unknown[], orm: unknown[], benchmarks: unknown[]) => any
    buildCrossfitPrompt: (agg: unknown, orms: unknown[], profile: unknown, months: number) => string
  }

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        TrackingService,
        { provide: getConnectionToken(), useValue: jest.fn() },
        { provide: OpenAIClientService, useValue: {} },
        { provide: UserContextService, useValue: {} },
      ],
    }).compile()
    service = moduleRef.get(TrackingService)
    internals = service as unknown as typeof internals
  })

  const fran = { workout_name: 'Fran', workout_type: 'for_time', results: { elapsed_time_seconds: 225 } }

  it("donne à l'IA la date réelle de chaque workout, à Paris", () => {
    // Un mardi (toString().split('T')[0] donnait '') puis un lundi à 0 h 30 à Paris
    const agg = internals.aggregateCrossfit(
      [
        { ...fran, started_at: at('2026-10-06T10:00:00Z') },
        { ...fran, started_at: at('2026-10-11T22:30:00Z') },
      ],
      [],
      []
    )

    expect(agg.namedWorkouts.map((w: { date: string }) => w.date)).toEqual(['2026-10-06', '2026-10-12'])

    const prompt = internals.buildCrossfitPrompt(agg, [], null, 1)
    expect(prompt).toContain('- 2026-10-06 | Fran (for_time) : 3:45')
  })

  it('compte les semaines à Paris : une séance le lundi à 0 h 30 reste dans sa semaine', () => {
    // Lundi 0 h 30 à Paris (dimanche 22 h 30 UTC) + mercredi de la même semaine
    const agg = internals.aggregateCrossfit(
      [
        { ...fran, started_at: at('2026-10-04T22:30:00Z') },
        { ...fran, started_at: at('2026-10-07T10:00:00Z') },
      ],
      [],
      []
    )

    // Une seule semaine d'entraînement sur une semaine : 100 % (le découpage UTC en voyait deux, soit 200 %)
    expect(agg.consistencyPct).toBe(100)
  })
})
