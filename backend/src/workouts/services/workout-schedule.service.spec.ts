import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { GoogleCalendarService } from '../../google-calendar/google-calendar.service'
import { WorkoutScheduleService } from './workout-schedule.service'

/** Builder Knex "thenable" : chaque maillon renvoie le builder, l'await résout la valeur voulue. */
function createChainableBuilder(resolvedValue: unknown) {
  const builder: any = {}
  for (const method of ['select', 'where', 'whereIn']) {
    builder[method] = jest.fn().mockReturnThis()
  }
  builder.then = (resolve: (value: unknown) => void) => resolve(resolvedValue)
  return builder
}

async function buildService(knexMock: unknown): Promise<WorkoutScheduleService> {
  const moduleRef = await Test.createTestingModule({
    providers: [
      WorkoutScheduleService,
      { provide: getConnectionToken(), useValue: knexMock },
      { provide: GoogleCalendarService, useValue: {} },
    ],
  }).compile()
  return moduleRef.get(WorkoutScheduleService)
}

describe('WorkoutScheduleService.suggestWeek', () => {
  it('rattache un jour Box au bon jour de la semaine quand pg renvoie la colonne date en objet Date', async () => {
    // Arrange — pg construit une colonne `date` à minuit heure locale : new Date(2026, 9, 6) = mardi 6 octobre.
    // Avec toISOString(), à Paris, ce mardi devenait le lundi 5 (22 h UTC la veille).
    const boxRows = [{ scheduled_date: new Date(2026, 9, 6) }]
    const knexMock = jest
      .fn()
      .mockImplementationOnce(() => createChainableBuilder(boxRows))
      .mockImplementationOnce(() => createChainableBuilder([]))
    const service = await buildService(knexMock)

    // Act
    const result = await service.suggestWeek('user-1', '2026-10-19')

    // Assert
    expect(result.weeks_analyzed).toBe(1)
    expect(result.days.map(d => d.date)).toEqual([
      '2026-10-19',
      '2026-10-20',
      '2026-10-21',
      '2026-10-22',
      '2026-10-23',
      '2026-10-24',
      '2026-10-25',
    ])
    expect(result.days[0].isBox).toBe(false)
    expect(result.days[1]).toEqual({ date: '2026-10-20', isBox: true, isRest: false, types: [] })
  })
})
