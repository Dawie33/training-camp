import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { GoogleCalendarService } from '../google-calendar/google-calendar.service'
import { ScheduledActivitiesService } from './scheduled-activities.service'

/** Colonne `date` telle que la renvoie le driver pg : un objet Date à minuit, heure locale. */
const pgDate = (year: number, month: number, day: number) => new Date(year, month - 1, day)

/**
 * Builder Knex chaînable : chaque méthode renvoie le builder, et `await builder` résout `rows`
 * (quel que soit le dernier maillon : orderBy, whereIn, select, first…).
 */
function builderResolving(rows: unknown) {
  const builder: any = {}
  for (const method of ['select', 'leftJoin', 'where', 'whereIn', 'whereNot', 'orderBy', 'update', 'returning']) {
    builder[method] = jest.fn(() => builder)
  }
  builder.first = jest.fn(() => Promise.resolve(Array.isArray(rows) ? rows[0] : rows))
  builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(rows).then(resolve, reject)
  return builder
}

async function buildService(tables: Record<string, unknown[]>) {
  const builders: Record<string, any> = {}
  const knexMock: any = jest.fn((table: string) => {
    builders[table] = builderResolving(tables[table] ?? [])
    return builders[table]
  })
  knexMock.raw = jest.fn()

  const moduleRef = await Test.createTestingModule({
    providers: [
      ScheduledActivitiesService,
      { provide: getConnectionToken(), useValue: knexMock },
      { provide: GoogleCalendarService, useValue: { syncWorkout: jest.fn().mockResolvedValue(null) } },
    ],
  }).compile()

  return { service: moduleRef.get(ScheduledActivitiesService), knexMock, builders }
}

const activityRow = {
  id: 'a1',
  user_id: 'user-1',
  scheduled_date: pgDate(2026, 10, 6),
  activity_type: 'wod',
  activity_id: null,
  status: 'scheduled',
}

describe('ScheduledActivitiesService.findUnified', () => {
  it("renvoie le bon jour pour une colonne date, sans le décalage d'un jour de toISOString()", async () => {
    const { service } = await buildService({ scheduled_activities: [activityRow] })

    const [activity] = await service.findUnified('user-1', { module: 'wod' })

    expect(activity).toEqual(
      expect.objectContaining({ scheduled_date: '2026-10-06', title: 'WOD', _source: 'scheduled_activities' })
    )
  })

  it('fait de même pour les séances CrossFit', async () => {
    const { service } = await buildService({
      user_workout_schedule: [
        {
          id: 's1',
          user_id: 'user-1',
          scheduled_date: pgDate(2026, 10, 6),
          session_type: 'workout',
          workout_name: 'Fran',
        },
      ],
    })

    const [activity] = await service.findUnified('user-1', { module: 'crossfit' })

    expect(activity).toEqual(
      expect.objectContaining({ scheduled_date: '2026-10-06', title: 'Fran', module: 'crossfit' })
    )
  })

  it('enrichit une activité skill avec le programme lié (nom, étape en cours, progression)', async () => {
    const { service } = await buildService({
      scheduled_activities: [{ ...activityRow, activity_type: 'skill', activity_id: 'p1' }],
      skill_programs: [{ id: 'p1', skill_name: 'Muscle-up', skill_category: 'gymnastics' }],
      skill_program_steps: [
        { program_id: 'p1', title: 'Transition au sol', status: 'completed' },
        { program_id: 'p1', title: 'Kip swing', status: 'in_progress' },
      ],
    })

    const [activity] = await service.findUnified('user-1', { module: 'skill' })

    expect(activity).toEqual(
      expect.objectContaining({
        title: 'Muscle-up',
        skill_program_id: 'p1',
        skill_step_title: 'Kip swing',
        skill_progress: 50,
      })
    )
  })
})

describe('ScheduledActivitiesService.update', () => {
  it('ne cherche pas de conflit quand la date envoyée est celle déjà enregistrée', async () => {
    const { service, knexMock } = await buildService({ scheduled_activities: [activityRow] })

    await service.update('a1', 'user-1', { scheduled_date: '2026-10-06', notes: 'Au box' })

    // 1 lecture de l'activité + 1 mise à jour : pas de requête de conflit
    // (avant, la comparaison chaîne / objet Date était toujours vraie)
    expect(knexMock).toHaveBeenCalledTimes(2)
  })

  it('cherche un conflit quand la date change', async () => {
    const { service, knexMock } = await buildService({ scheduled_activities: [activityRow] })

    await expect(service.update('a1', 'user-1', { scheduled_date: '2026-10-07' })).rejects.toThrow('déjà planifiée')
    expect(knexMock).toHaveBeenCalledTimes(2)
  })
})
