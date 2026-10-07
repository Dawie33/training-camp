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

/** Builder Knex chaînable : `first()` est le maillon final de chaque requête du service. */
function createBuilderMock(first: unknown) {
  const builder: Record<string, jest.Mock> = {}
  for (const method of ['where', 'whereNotNull', 'select']) builder[method] = jest.fn().mockReturnValue(builder)
  builder.first = jest.fn().mockResolvedValue(first)
  return builder
}

describe('TrackingService — réutilisation du bilan enregistré', () => {
  const HOUR = 3600 * 1000
  const savedReport = { sport: 'crossfit', period_months: 3, period_summary: 'Bilan enregistré' }
  const newReport = { sport: 'crossfit', period_months: 3, period_summary: 'Nouveau bilan' }

  async function setup(
    options: {
      saved?: { period_months: number; generated_at: Date } | null
      newData?: Partial<Record<'workout_sessions' | 'one_rep_max_history' | 'benchmark_history', boolean>>
    } = {}
  ) {
    const saved =
      options.saved === null
        ? undefined
        : { period_months: 3, generated_at: new Date(Date.now() - 2 * HOUR), report: savedReport, ...options.saved }
    const found = (table: keyof NonNullable<typeof options.newData>) =>
      options.newData?.[table] ? { id: 'nouvelle-ligne' } : undefined

    const builders = {
      tracking_reports: createBuilderMock(saved),
      workout_sessions: createBuilderMock(found('workout_sessions')),
      one_rep_max_history: createBuilderMock(found('one_rep_max_history')),
      benchmark_history: createBuilderMock(found('benchmark_history')),
    }
    const knexMock = jest.fn((table: keyof typeof builders) => builders[table])
    const userContextService = { invalidateCache: jest.fn() }

    const moduleRef = await Test.createTestingModule({
      providers: [
        TrackingService,
        { provide: getConnectionToken(), useValue: knexMock },
        { provide: OpenAIClientService, useValue: {} },
        { provide: UserContextService, useValue: userContextService },
      ],
    }).compile()
    const service = moduleRef.get(TrackingService)

    // Génération et enregistrement remplacés : seule la décision de réutiliser est testée ici
    const generate = jest.spyOn(service as any, 'generateCrossfitReport').mockResolvedValue(newReport)
    const save = jest.spyOn(service as any, 'saveReport').mockResolvedValue(undefined)

    return { service, builders, generate, save, userContextService }
  }

  it('renvoie le bilan enregistré sans rappeler l’IA quand rien n’a changé', async () => {
    // Arrange
    const { service, generate, save, userContextService } = await setup()

    // Act
    const result = await service.generateReport('user-1', 'crossfit', 3)

    // Assert
    expect(result).toEqual({ ...savedReport, reused: true })
    expect(generate).not.toHaveBeenCalled()
    expect(save).not.toHaveBeenCalled()
    expect(userContextService.invalidateCache).not.toHaveBeenCalled()
  })

  it('régénère quand aucun bilan n’est enregistré', async () => {
    const { service, generate } = await setup({ saved: null })

    const result = await service.generateReport('user-1', 'crossfit', 3)

    expect(result).toEqual({ ...newReport, reused: false })
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it('régénère quand la durée demandée est différente', async () => {
    const { service, generate } = await setup()

    const result = await service.generateReport('user-1', 'crossfit', 6)

    expect(result.reused).toBe(false)
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it('régénère quand le bilan a plus de 24 h', async () => {
    const { service, generate } = await setup({
      saved: { period_months: 3, generated_at: new Date(Date.now() - 25 * HOUR) },
    })

    const result = await service.generateReport('user-1', 'crossfit', 3)

    expect(result.reused).toBe(false)
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['une séance terminée', 'workout_sessions'],
    ['un 1RM', 'one_rep_max_history'],
    ['un benchmark', 'benchmark_history'],
  ] as const)('régénère quand %s a été enregistré depuis le bilan', async (_label, table) => {
    const { service, generate, userContextService } = await setup({ newData: { [table]: true } })

    const result = await service.generateReport('user-1', 'crossfit', 3)

    expect(result).toEqual({ ...newReport, reused: false })
    expect(generate).toHaveBeenCalledTimes(1)
    expect(userContextService.invalidateCache).toHaveBeenCalledWith('user-1')
  })

  it('détecte les séances par updated_at, posé par le serveur, et non par completed_at', async () => {
    const generatedAt = new Date(Date.now() - 2 * HOUR)
    const { service, builders } = await setup({ saved: { period_months: 3, generated_at: generatedAt } })

    await service.generateReport('user-1', 'crossfit', 3)

    expect(builders.workout_sessions.whereNotNull).toHaveBeenCalledWith('completed_at')
    expect(builders.workout_sessions.where).toHaveBeenCalledWith('updated_at', '>', generatedAt.toISOString())
  })

  it('enregistre l’heure du début de la génération, pas celle de la fin', async () => {
    const { service, generate, save } = await setup({ saved: null })
    let calledAt = 0
    generate.mockImplementation(async () => {
      calledAt = Date.now()
      await new Promise(resolve => setTimeout(resolve, 5))
      return newReport
    })

    await service.generateReport('user-1', 'crossfit', 3)

    const savedAt = save.mock.calls[0][4] as Date
    expect(savedAt.getTime()).toBeLessThanOrEqual(calledAt)
  })

  it('le bilan mensuel automatique ne se dit pas généré quand il a été réutilisé', async () => {
    const { service, builders } = await setup({
      saved: { period_months: 1, generated_at: new Date(Date.now() - 2 * HOUR) },
    })
    // checkAndGenerateMonthlyReport lit d'abord le bilan pour savoir s'il date du mois en cours
    builders.tracking_reports.first
      .mockResolvedValueOnce({ generated_at: new Date('2020-01-01T00:00:00Z') })
      .mockResolvedValueOnce({ period_months: 1, generated_at: new Date(Date.now() - 2 * HOUR), report: savedReport })

    await expect(service.checkAndGenerateMonthlyReport('user-1', 'crossfit')).resolves.toEqual({ generated: false })
  })
})
