import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { OpenAIClientService } from 'src/common/ai/openai-client.service'
import { SessionResults } from 'src/workout-sessions/schemas/session-results.schema'
import { UserContextService } from 'src/workouts/services/user-context.service'
import { AIProgressionReport } from './schemas/progression-report.schema'
import { TrackingService } from './tracking.service'
import { CrossfitSessionRow, ProgressionReport } from './types/tracking.types'

/**
 * Méthodes privées appelées ou espionnées par les tests. Les types sont lus sur le service
 * (`TrackingService['…']` accepte les membres privés) : si une signature change, le test ne compile plus.
 */
interface TrackingServiceInternals {
  aggregateCrossfit: TrackingService['aggregateCrossfit']
  buildCrossfitPrompt: TrackingService['buildCrossfitPrompt']
  formatCFResult: TrackingService['formatCFResult']
  generateCrossfitReport: TrackingService['generateCrossfitReport']
  saveReport: TrackingService['saveReport']
}
const internalsOf = (service: TrackingService) => service as unknown as TrackingServiceInternals

async function createService(deps: { knex?: unknown; openai?: unknown; userContext?: unknown } = {}) {
  const moduleRef = await Test.createTestingModule({
    providers: [
      TrackingService,
      { provide: getConnectionToken(), useValue: deps.knex ?? jest.fn() },
      { provide: OpenAIClientService, useValue: deps.openai ?? {} },
      { provide: UserContextService, useValue: deps.userContext ?? {} },
    ],
  }).compile()
  return moduleRef.get(TrackingService)
}

/**
 * Requête Knex simulée : les méthodes de chaînage renvoient la requête, `first()` la première
 * ligne, et un `await` direct sur la requête (via `then`) renvoie toutes les lignes.
 */
function createQueryMock(rows: unknown[]) {
  const query: Record<string, jest.Mock> = {}
  for (const method of ['leftJoin', 'select', 'where', 'whereNotNull', 'orderBy']) {
    query[method] = jest.fn().mockReturnValue(query)
  }
  query.first = jest.fn().mockResolvedValue(rows[0])
  query.then = jest.fn((resolve: (value: unknown[]) => unknown, reject: (reason: unknown) => unknown) =>
    Promise.resolve(rows).then(resolve, reject)
  )
  return query
}

/** Colonne timestamptz telle que la renvoie le driver pg : un objet Date. */
const at = (iso: string) => new Date(iso)

/** Séance terminée d'une heure, par défaut un Fran en 3:45. */
function session(startedAt: string, overrides: Partial<CrossfitSessionRow> = {}): CrossfitSessionRow {
  const started = at(startedAt)
  return {
    started_at: started,
    completed_at: new Date(started.getTime() + 3600 * 1000),
    workout_name: 'Fran',
    workout_type: 'for_time',
    results: { elapsed_time_seconds: 225 },
    ...overrides,
  }
}

/** Partie du bilan rédigée par l'IA, minimale mais valide pour AIProgressionReportSchema. */
const aiReport: AIProgressionReport = {
  period_summary: 'Bilan de l’IA',
  overall_trend: 'stable',
  highlights: [],
  type_trends: [],
  strengths: [],
  weak_points: [],
  recommendations: [],
  consistency_feedback: 'Régulier',
}

function report(overrides: Partial<ProgressionReport> = {}): ProgressionReport {
  return { ...aiReport, sport: 'crossfit', period_months: 3, generated_at: '2026-10-01T08:00:00.000Z', ...overrides }
}

describe('TrackingService — agrégation et prompt du bilan', () => {
  // Méthodes privées testées directement : ce sont des calculs purs sur les sessions
  let internals: TrackingServiceInternals

  beforeAll(async () => {
    internals = internalsOf(await createService())
  })

  it("donne à l'IA la date réelle de chaque workout, à Paris", () => {
    // Un mardi (toString().split('T')[0] donnait '') puis un lundi à 0 h 30 à Paris
    const agg = internals.aggregateCrossfit([session('2026-10-06T10:00:00Z'), session('2026-10-11T22:30:00Z')], [], [])

    expect(agg.namedWorkouts.map(w => w.date)).toEqual(['2026-10-06', '2026-10-12'])

    const prompt = internals.buildCrossfitPrompt(agg, [], undefined, 1)
    expect(prompt).toContain('- 2026-10-06 | Fran (for_time) : 3:45')
  })

  it('compte les semaines à Paris : une séance le lundi à 0 h 30 reste dans sa semaine', () => {
    // Lundi 0 h 30 à Paris (dimanche 22 h 30 UTC) + mercredi de la même semaine
    const agg = internals.aggregateCrossfit([session('2026-10-04T22:30:00Z'), session('2026-10-07T10:00:00Z')], [], [])

    // Une seule semaine d'entraînement sur une semaine : 100 % (le découpage UTC en voyait deux, soit 200 %)
    expect(agg.consistencyPct).toBe(100)
  })
})

describe('TrackingService — formatage du résultat d’un workout', () => {
  let internals: TrackingServiceInternals

  beforeAll(async () => {
    internals = internalsOf(await createService())
  })

  it.each<[string, SessionResults | null, string | null, string | null]>([
    ['for time : temps en minutes et secondes', { elapsed_time_seconds: 225 }, 'for_time', '3:45'],
    ['for time : secondes sur deux chiffres', { elapsed_time_seconds: 305 }, 'for_time', '5:05'],
    ['AMRAP : rounds et reps', { rounds: 5, reps: 12 }, 'amrap', '5 rounds + 12 reps'],
    ['AMRAP : rounds seuls', { rounds: 7 }, 'amrap', '7 rounds'],
    ['AMRAP : zéro round reste un score', { rounds: 0, reps: 18 }, 'amrap', '0 rounds + 18 reps'],
    ['AMRAP sans rounds : se rabat sur les reps', { reps: 40 }, 'amrap', '40 reps'],
    ['charge à la racine (format historique)', { load_kg: 100 }, 'strength', '100kg'],
    ['charge à la racine en texte : ignorée', { load_kg: '100' }, 'strength', null],
    ['reps seules', { reps: 30 }, 'emom', '30 reps'],
    ['for time sans temps ni reps', {}, 'for_time', null],
    ['aucun résultat', null, 'for_time', null],
  ])('%s', (_label, results, type, expected) => {
    expect(internals.formatCFResult(results, type)).toBe(expected)
  })
})

describe('TrackingService — seuil de 3 séances avant l’appel à l’IA', () => {
  async function setup(sessionCount: number) {
    const sessions = Array.from({ length: sessionCount }, (_, i) => session(`2026-10-0${i + 1}T10:00:00Z`))
    const queries = {
      tracking_reports: createQueryMock([]),
      'workout_sessions as ws': createQueryMock(sessions),
      one_rep_maxes: createQueryMock([]),
      one_rep_max_history: createQueryMock([]),
      benchmark_history: createQueryMock([]),
      users: createQueryMock([{ sport_level: 'intermediate', global_goals: null }]),
    }
    const createCompletion = jest
      .fn()
      .mockResolvedValue({ choices: [{ message: { content: JSON.stringify(aiReport) } }] })
    const userContextService = {
      getUserAIContext: jest.fn().mockResolvedValue({ diagnostic: undefined }),
      invalidateCache: jest.fn(),
    }

    const service = await createService({
      knex: jest.fn((table: keyof typeof queries) => queries[table]),
      openai: { client: { chat: { completions: { create: createCompletion } } }, temperatureParam: () => ({}) },
      userContext: userContextService,
    })
    jest.spyOn(internalsOf(service), 'saveReport').mockResolvedValue(undefined)

    return { service, createCompletion, userContextService }
  }

  it.each([
    [0, '0 séance complétée'],
    [1, '1 séance complétée'],
    [2, '2 séances complétées'],
  ])('avec %i séance(s), renvoie un bilan d’attente sans appeler l’IA', async (count, wording) => {
    const { service, createCompletion, userContextService } = await setup(count)

    const result = await service.generateReport('user-1', 3)

    expect(createCompletion).not.toHaveBeenCalled()
    expect(userContextService.getUserAIContext).not.toHaveBeenCalled()
    expect(result.period_summary).toBe(
      `Pas assez de données sur 3 mois (${wording}). Continue à t'entraîner pour débloquer ton bilan !`
    )
    expect(result).toMatchObject({ sport: 'crossfit', period_months: 3, reused: false, highlights: [] })
  })

  it('appelle l’IA dès 3 séances', async () => {
    const { service, createCompletion } = await setup(3)

    const result = await service.generateReport('user-1', 3)

    expect(createCompletion).toHaveBeenCalledTimes(1)
    expect(result.period_summary).toBe(aiReport.period_summary)
  })
})

describe('TrackingService — réutilisation du bilan enregistré', () => {
  const HOUR = 3600 * 1000
  const savedReport = report({ period_summary: 'Bilan enregistré' })
  const newReport = report({ period_summary: 'Nouveau bilan' })

  async function setup(
    options: {
      saved?: { period_months: number; generated_at: Date } | null
      newData?: Partial<Record<'workout_sessions' | 'one_rep_max_history' | 'benchmark_history', boolean>>
    } = {}
  ) {
    const saved =
      options.saved === null
        ? []
        : [{ period_months: 3, generated_at: new Date(Date.now() - 2 * HOUR), report: savedReport, ...options.saved }]
    const found = (table: keyof NonNullable<typeof options.newData>) =>
      options.newData?.[table] ? [{ id: 'nouvelle-ligne' }] : []

    const builders = {
      tracking_reports: createQueryMock(saved),
      workout_sessions: createQueryMock(found('workout_sessions')),
      one_rep_max_history: createQueryMock(found('one_rep_max_history')),
      benchmark_history: createQueryMock(found('benchmark_history')),
    }
    const userContextService = { invalidateCache: jest.fn() }
    const service = await createService({
      knex: jest.fn((table: keyof typeof builders) => builders[table]),
      userContext: userContextService,
    })

    // Génération et enregistrement remplacés : seule la décision de réutiliser est testée ici
    const internals = internalsOf(service)
    const generate = jest.spyOn(internals, 'generateCrossfitReport').mockResolvedValue(newReport)
    const save = jest.spyOn(internals, 'saveReport').mockResolvedValue(undefined)

    return { service, builders, generate, save, userContextService }
  }

  it('renvoie le bilan enregistré sans rappeler l’IA quand rien n’a changé', async () => {
    // Arrange
    const { service, generate, save, userContextService } = await setup()

    // Act
    const result = await service.generateReport('user-1', 3)

    // Assert
    expect(result).toEqual({ ...savedReport, reused: true })
    expect(generate).not.toHaveBeenCalled()
    expect(save).not.toHaveBeenCalled()
    expect(userContextService.invalidateCache).not.toHaveBeenCalled()
  })

  it('régénère quand aucun bilan n’est enregistré', async () => {
    const { service, generate } = await setup({ saved: null })

    const result = await service.generateReport('user-1', 3)

    expect(result).toEqual({ ...newReport, reused: false })
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it('régénère quand la durée demandée est différente', async () => {
    const { service, generate } = await setup()

    const result = await service.generateReport('user-1', 6)

    expect(result.reused).toBe(false)
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it('régénère quand le bilan a plus de 24 h', async () => {
    const { service, generate } = await setup({
      saved: { period_months: 3, generated_at: new Date(Date.now() - 25 * HOUR) },
    })

    const result = await service.generateReport('user-1', 3)

    expect(result.reused).toBe(false)
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it.each([
    ['une séance terminée', 'workout_sessions'],
    ['un 1RM', 'one_rep_max_history'],
    ['un benchmark', 'benchmark_history'],
  ] as const)('régénère quand %s a été enregistré depuis le bilan', async (_label, table) => {
    const { service, generate, userContextService } = await setup({ newData: { [table]: true } })

    const result = await service.generateReport('user-1', 3)

    expect(result).toEqual({ ...newReport, reused: false })
    expect(generate).toHaveBeenCalledTimes(1)
    expect(userContextService.invalidateCache).toHaveBeenCalledWith('user-1')
  })

  it('détecte les séances par updated_at, posé par le serveur, et non par completed_at', async () => {
    const generatedAt = new Date(Date.now() - 2 * HOUR)
    const { service, builders } = await setup({ saved: { period_months: 3, generated_at: generatedAt } })

    await service.generateReport('user-1', 3)

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

    await service.generateReport('user-1', 3)

    // Spy typé sur la signature de saveReport : l'index suit ses paramètres (userId, months, report, generatedAt)
    const savedAt = save.mock.calls[0][3]
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

    await expect(service.checkAndGenerateMonthlyReport('user-1')).resolves.toEqual({ generated: false })
  })
})

describe('TrackingService — bilan mensuel automatique', () => {
  afterEach(() => jest.useRealTimers())

  /** `now` et `savedAt` en UTC ; `savedAt` null = aucun bilan enregistré. */
  async function setup(now: string, savedAt: string | null) {
    const reports = createQueryMock(savedAt ? [{ generated_at: at(savedAt) }] : [])
    const service = await createService({ knex: jest.fn(() => reports) })
    const generate = jest.spyOn(service, 'generateReport').mockResolvedValue({ ...report(), reused: false })
    // Horloge figée seulement après la création du module Nest
    jest.useFakeTimers({ now: at(now) })
    return { service, generate }
  }

  it('ne régénère pas un bilan déjà fait ce mois-ci', async () => {
    const { service, generate } = await setup('2026-10-15T10:00:00Z', '2026-10-03T10:00:00Z')

    await expect(service.checkAndGenerateMonthlyReport('user-1')).resolves.toEqual({ generated: false })
    expect(generate).not.toHaveBeenCalled()
  })

  it.each<[string, string | null]>([
    ['aucun bilan enregistré', null],
    ['un bilan du mois précédent', '2026-09-28T10:00:00Z'],
    ['un bilan du même mois l’an dernier', '2025-10-15T10:00:00Z'],
  ])('génère un bilan sur 1 mois avec %s', async (_label, savedAt) => {
    const { service, generate } = await setup('2026-10-15T10:00:00Z', savedAt)

    await expect(service.checkAndGenerateMonthlyReport('user-1')).resolves.toEqual({ generated: true })
    expect(generate).toHaveBeenCalledWith('user-1', 1)
  })

  it('le 1er du mois à 0 h 30 à Paris, le bilan du mois précédent est périmé', async () => {
    // 1er novembre 0 h 30 à Paris = 31 octobre 23 h 30 UTC : un serveur en UTC se croyait encore en octobre
    const { service, generate } = await setup('2026-10-31T23:30:00Z', '2026-10-20T10:00:00Z')

    await expect(service.checkAndGenerateMonthlyReport('user-1')).resolves.toEqual({ generated: true })
    expect(generate).toHaveBeenCalledTimes(1)
  })

  it('un bilan généré le 1er à 0 h 30 à Paris compte pour ce mois-là', async () => {
    // Généré le 1er novembre 0 h 30 à Paris (31 octobre 23 h 30 UTC), connexion le 15 novembre
    const { service, generate } = await setup('2026-11-15T10:00:00Z', '2026-10-31T23:30:00Z')

    await expect(service.checkAndGenerateMonthlyReport('user-1')).resolves.toEqual({ generated: false })
    expect(generate).not.toHaveBeenCalled()
  })
})
