import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { UserContextService } from 'src/user-context/user-context.service'
import { WorkoutScheduleService } from './workout-schedule.service'
import * as visibility from './workout-visibility'
import { WorkoutsService } from './workouts.service'

/** Builder Knex "thenable" : chaque maillon renvoie le builder, l'await résout la valeur voulue. */
function createChainableBuilder(resolvedValue: unknown) {
  const builder: any = {}
  for (const method of [
    'select',
    'where',
    'whereIn',
    'whereBetween',
    'first',
    'max',
    'groupBy',
    'count',
    'limit',
    'offset',
    'orderBy',
    'update',
    'returning',
    'delete',
    'forUpdate',
    'insert',
    'onConflict',
    'merge',
  ]) {
    builder[method] = jest.fn().mockReturnThis()
  }
  builder.then = (resolve: (value: unknown) => void) => resolve(resolvedValue)
  return builder
}

describe('WorkoutsService.checkAndScheduleMonthlyBenchmark', () => {
  const scheduleService = { create: jest.fn() }
  let scheduleBuilder: any

  async function buildService(): Promise<WorkoutsService> {
    scheduleBuilder = createChainableBuilder(undefined)
    // Ordre des this.knex(...) : workouts (benchmarks), user_workout_schedule (déjà planifié ?), benchmark_history
    const knexMock = jest
      .fn()
      .mockImplementationOnce(() => createChainableBuilder([{ id: 'fran', name: 'Fran' }]))
      .mockImplementationOnce(() => scheduleBuilder)
      .mockImplementationOnce(() => createChainableBuilder([]))
    const moduleRef = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        { provide: getConnectionToken(), useValue: knexMock },
        { provide: UserContextService, useValue: {} },
        { provide: WorkoutScheduleService, useValue: scheduleService },
      ],
    }).compile()
    return moduleRef.get(WorkoutsService)
  }

  beforeEach(() => jest.resetAllMocks())
  afterEach(() => jest.useRealTimers())

  it('raisonne sur le mois parisien, même la nuit du changement de mois (encore le mois précédent en UTC)', async () => {
    // Arrange — 23 h 30 UTC le 31 octobre = 0 h 30 le 1er novembre à Paris (heure d'hiver)
    jest.useFakeTimers({ now: new Date('2026-10-31T23:30:00Z'), doNotFake: ['nextTick', 'setImmediate'] })
    scheduleService.create.mockResolvedValue({})
    const service = await buildService()

    // Act
    const result = await service.checkAndScheduleMonthlyBenchmark('user-1')

    // Assert — novembre complet, et premier créneau à J+3 du 1er novembre
    expect(result).toEqual({ scheduled: true, workoutName: 'Fran' })
    expect(scheduleBuilder.whereBetween).toHaveBeenCalledWith('scheduled_date', ['2026-11-01', '2026-11-30'])
    expect(scheduleService.create).toHaveBeenCalledWith('user-1', {
      workout_id: 'fran',
      scheduled_date: '2026-11-04',
      notes: 'Test benchmark mensuel automatique',
    })
  })
})

describe('WorkoutsService — visibilité des workouts', () => {
  const viewer = { id: 'user-2', role: 'user' }
  let visibilitySpy: jest.SpyInstance

  async function buildService(knexMock: jest.Mock): Promise<WorkoutsService> {
    Object.assign(knexMock, {
      transaction: jest.fn((callback: (trx: jest.Mock) => Promise<unknown>) => callback(knexMock)),
    })
    const moduleRef = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        { provide: getConnectionToken(), useValue: knexMock },
        { provide: UserContextService, useValue: {} },
        { provide: WorkoutScheduleService, useValue: { create: jest.fn() } },
      ],
    }).compile()
    return moduleRef.get(WorkoutsService)
  }

  beforeEach(() => {
    // Espion sur la vraie règle : on vérifie qu'elle est appliquée, son SQL est testé dans workout-visibility.spec.ts
    visibilitySpy = jest.spyOn(visibility, 'applyVisibility')
  })
  afterEach(() => jest.restoreAllMocks())

  it('applique la règle à la liste et à son comptage', async () => {
    // Arrange — this.knex(...) : liste, puis comptage
    const listBuilder = createChainableBuilder([])
    const countBuilder = createChainableBuilder({ count: 0 })
    const service = await buildService(jest.fn().mockReturnValueOnce(listBuilder).mockReturnValueOnce(countBuilder))

    // Act
    await service.findAll({}, viewer)

    // Assert
    expect(visibilitySpy).toHaveBeenCalledWith(listBuilder, viewer)
    expect(visibilitySpy).toHaveBeenCalledWith(countBuilder, viewer)
  })

  it("renvoie null pour un workout qui n'est pas visible par l'utilisateur", async () => {
    // Arrange — la requête filtrée ne trouve rien
    const builder = createChainableBuilder(undefined)
    const service = await buildService(jest.fn().mockReturnValue(builder))

    // Act
    const result = await service.findOne('workout-prive-de-a', viewer)

    // Assert
    expect(result).toBeNull()
    expect(visibilitySpy).toHaveBeenCalledWith(builder, viewer)
  })

  it('applique la règle à la liste des benchmarks', async () => {
    // Arrange
    const builder = createChainableBuilder([])
    const service = await buildService(jest.fn().mockReturnValue(builder))

    // Act
    await service.getBenchmarkWorkouts(viewer)

    // Assert
    expect(visibilitySpy).toHaveBeenCalledWith(builder, viewer)
  })

  it("ne planifie que parmi les benchmarks visibles, et s'arrête sans erreur s'il n'y en a aucun", async () => {
    // Arrange — aucun benchmark visible
    const builder = createChainableBuilder([])
    const knexMock = jest.fn().mockReturnValue(builder)
    const service = await buildService(knexMock)

    // Act
    const result = await service.checkAndScheduleMonthlyBenchmark('user-2')

    // Assert — plus de TypeError sur target.id, et aucune autre requête
    expect(result).toEqual({ scheduled: false })
    expect(visibilitySpy).toHaveBeenCalledWith(builder, { id: 'user-2' })
    expect(knexMock).toHaveBeenCalledTimes(1)
  })

  it("refuse la modification d'un workout que l'utilisateur ne peut pas modifier (404)", async () => {
    // Arrange — la mise à jour filtrée ne touche aucune ligne
    const builder = createChainableBuilder([])
    const service = await buildService(jest.fn().mockReturnValue(builder))
    const permissionSpy = jest.spyOn(visibility, 'applyEditPermission')

    // Act + Assert
    await expect(service.update('workout-de-a', { name: 'Renommé' }, viewer)).rejects.toBeInstanceOf(NotFoundException)
    expect(permissionSpy).toHaveBeenCalledWith(builder, viewer)
  })

  it("refuse la suppression d'un workout que l'utilisateur ne peut pas supprimer (404)", async () => {
    // Arrange — la suppression filtrée ne touche aucune ligne
    const builder = createChainableBuilder(undefined)
    const service = await buildService(jest.fn().mockReturnValue(builder))
    const permissionSpy = jest.spyOn(visibility, 'applyEditPermission')

    // Act + Assert
    await expect(service.remove('fran', viewer)).rejects.toBeInstanceOf(NotFoundException)
    expect(permissionSpy).toHaveBeenCalledWith(builder, viewer)
  })

  it("supprime le workout de l'utilisateur", async () => {
    // Arrange — une ligne supprimée
    const service = await buildService(
      jest
        .fn()
        .mockReturnValueOnce(createChainableBuilder({ id: 'mon-workout' }))
        .mockReturnValue(createChainableBuilder(undefined))
    )

    // Act
    const result = await service.remove('mon-workout', viewer)

    // Assert
    expect(result).toEqual({ success: true })
  })

  it('refuse la suppression d’un workout déjà utilisé pour préserver les séances et le calendrier', async () => {
    const service = await buildService(
      jest
        .fn()
        .mockReturnValueOnce(createChainableBuilder({ id: 'workout' }))
        .mockReturnValue(createChainableBuilder({ id: 'session' }))
    )
    await expect(service.remove('workout', viewer)).rejects.toBeInstanceOf(ConflictException)
  })

  it('enregistre tous les champs modifiables, dont le benchmark et les JSON', async () => {
    const query = createChainableBuilder([{ id: 'workout', is_benchmark: true }])
    const service = await buildService(jest.fn().mockReturnValue(query))
    await service.update(
      'workout',
      {
        is_benchmark: true,
        coach_notes: 'Technique',
        equipment_required: ['barbell'],
        slug: 'test',
      },
      viewer
    )
    expect(query.update).toHaveBeenCalledWith({
      is_benchmark: true,
      coach_notes: 'Technique',
      equipment_required: '["barbell"]',
      slug: 'test',
    })
    await expect(service.update('workout', {}, viewer)).rejects.toBeInstanceOf(BadRequestException)
  })

  it('utilise le nom canonique et vérifie la visibilité pour un résultat de benchmark', async () => {
    const query = createChainableBuilder({ id: 'workout', name: 'Fran', is_benchmark: true })
    const service = await buildService(jest.fn().mockReturnValue(query))
    const record = jest.spyOn(service, 'recordBenchmarkResult').mockResolvedValue({
      level: 'beginner',
      benchmark_results: {},
    })
    await service.saveBenchmarkResult('user-2', { workoutId: 'workout', result: { time_seconds: 300 } })
    expect(visibilitySpy).toHaveBeenCalledWith(query, { id: 'user-2' })
    expect(record).toHaveBeenCalledWith('user-2', 'workout', 'Fran', { time_seconds: 300 }, 'manual')
  })
})

describe('WorkoutsService — historique benchmark transactionnel', () => {
  it.each([
    { savedId: 'october', latestId: 'november', overallId: 'november', expectedLevel: 'advanced' },
    { savedId: 'october', latestId: 'october', overallId: 'other-workout', expectedLevel: 'advanced' },
    { savedId: 'october', latestId: 'october', overallId: 'october', expectedLevel: 'intermediate' },
  ])('préserve la chronologie après upsert : %j', async ({ savedId, latestId, overallId, expectedLevel }) => {
    const user = createChainableBuilder({
      sport_level: 'advanced',
      benchmark_results: { Cindy: { result: { rounds: 20 } } },
    })
    const update = createChainableBuilder(1)
    const history = createChainableBuilder([{ id: savedId }])
    const latest = createChainableBuilder({
      id: latestId,
      score_type: 'time_seconds',
      score_value: latestId === savedId ? '300' : '240',
      extra_reps: null,
      measured_at: latestId === savedId ? '2026-10-01T10:00:00Z' : '2026-11-01T10:00:00Z',
    })
    const overall = createChainableBuilder({ id: overallId })
    const db = jest
      .fn()
      .mockReturnValueOnce(user)
      .mockReturnValueOnce(history)
      .mockReturnValueOnce(latest)
      .mockReturnValueOnce(overall)
      .mockReturnValueOnce(update)
    const moduleRef = await Test.createTestingModule({
      providers: [
        WorkoutsService,
        {
          provide: getConnectionToken(),
          useValue: { transaction: (callback: (trx: jest.Mock) => Promise<unknown>) => callback(db) },
        },
        { provide: UserContextService, useValue: { invalidateCache: jest.fn() } },
        { provide: WorkoutScheduleService, useValue: {} },
      ],
    }).compile()
    const service = moduleRef.get(WorkoutsService)
    const result = await service.recordBenchmarkResult('user', 'fran', 'Fran', { time_seconds: 300 }, 'manual', {
      sessionId: 'session',
      measuredAt: '2026-10-01T10:00:00Z',
    })
    expect(user.forUpdate).toHaveBeenCalled()
    expect(history.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        session_id: 'session',
        measured_at: '2026-10-01T10:00:00Z',
        workout_name: 'Fran',
        score_value: 300,
      })
    )
    expect(history.onConflict).toHaveBeenCalledWith('session_id')
    expect(history.merge).toHaveBeenCalled()
    expect(latest.where).toHaveBeenCalledWith({ user_id: 'user', workout_id: 'fran' })
    expect(latest.orderBy.mock.calls).toEqual([
      ['measured_at', 'desc'],
      ['id', 'desc'],
    ])
    expect(overall.where).toHaveBeenCalledWith({ user_id: 'user' })
    expect(result.benchmark_results).toEqual({
      Cindy: { result: { rounds: 20 } },
      Fran: {
        workout_id: 'fran',
        result: { time_seconds: latestId === savedId ? 300 : 240 },
        date: latestId === savedId ? '2026-10-01T10:00:00Z' : '2026-11-01T10:00:00Z',
      },
    })
    expect(result.level).toBe(expectedLevel)
    const profileUpdate = update.update.mock.calls[0][0]
    if (overallId === savedId) expect(profileUpdate.sport_level).toBe(expectedLevel)
    else expect(profileUpdate).not.toHaveProperty('sport_level')
  })
})
