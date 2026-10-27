import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { UserContextService } from './user-context.service'
import { WorkoutScheduleService } from './workout-schedule.service'
import { WorkoutsService } from './workouts.service'

/** Builder Knex "thenable" : chaque maillon renvoie le builder, l'await résout la valeur voulue. */
function createChainableBuilder(resolvedValue: unknown) {
  const builder: any = {}
  for (const method of ['select', 'where', 'whereIn', 'whereBetween', 'first', 'max', 'groupBy']) {
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
