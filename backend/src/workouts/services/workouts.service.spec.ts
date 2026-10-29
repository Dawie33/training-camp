import { NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { UserContextService } from './user-context.service'
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
    const builder = createChainableBuilder(0)
    const service = await buildService(jest.fn().mockReturnValue(builder))
    const permissionSpy = jest.spyOn(visibility, 'applyEditPermission')

    // Act + Assert
    await expect(service.remove('fran', viewer)).rejects.toBeInstanceOf(NotFoundException)
    expect(permissionSpy).toHaveBeenCalledWith(builder, viewer)
  })

  it("supprime le workout de l'utilisateur", async () => {
    // Arrange — une ligne supprimée
    const service = await buildService(jest.fn().mockReturnValue(createChainableBuilder(1)))

    // Act
    const result = await service.remove('mon-workout', viewer)

    // Assert
    expect(result).toEqual({ success: true })
  })
})
