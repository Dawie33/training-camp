import { ConflictException, NotFoundException } from '@nestjs/common'
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
  for (const method of [
    'select',
    'leftJoin',
    'where',
    'whereIn',
    'whereNot',
    'orderBy',
    'insert',
    'update',
    'returning',
  ]) {
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

describe("ScheduledActivitiesService — programmes de skill d'un autre utilisateur", () => {
  const skillActivity = { ...activityRow, activity_type: 'skill', activity_id: 'mon-programme' }

  it("refuse un PATCH qui relie l'activité au programme d'un autre (404), sans rien modifier", async () => {
    // skill_programs vide : le programme visé n'appartient pas à l'utilisateur
    const { service, knexMock } = await buildService({ scheduled_activities: [skillActivity], skill_programs: [] })

    await expect(service.update('a1', 'user-1', { activity_id: 'programme-d-un-autre' })).rejects.toThrow(
      NotFoundException
    )
    // 1 lecture de l'activité + 1 vérification du programme : la mise à jour n'a jamais lieu
    expect(knexMock).toHaveBeenCalledTimes(2)
    expect(knexMock).toHaveBeenNthCalledWith(2, 'skill_programs')
  })

  it("ne revérifie pas le programme quand l'activity_id ne change pas", async () => {
    const { service, builders } = await buildService({ scheduled_activities: [skillActivity], skill_programs: [] })

    await service.update('a1', 'user-1', { activity_id: 'mon-programme', notes: 'Au box' })

    // skill_programs n'est lu que pour enrichir la réponse (await direct), jamais pour la vérification (.first())
    expect(builders.skill_programs.first).not.toHaveBeenCalled()
  })

  it("refuse de créer une activité skill sur le programme d'un autre (404)", async () => {
    const { service } = await buildService({ scheduled_activities: [], skill_programs: [] })

    await expect(
      service.create('user-1', {
        activity_type: 'skill',
        scheduled_date: '2026-10-06',
        activity_id: 'programme-d-un-autre',
      })
    ).rejects.toThrow(NotFoundException)
  })

  it("n'enrichit qu'avec les programmes de l'utilisateur connecté", async () => {
    const { service, builders } = await buildService({
      scheduled_activities: [skillActivity],
      skill_programs: [{ id: 'mon-programme', skill_name: 'Muscle-up', skill_category: 'gymnastics' }],
    })

    await service.findUnified('user-1', { module: 'skill' })

    expect(builders.skill_programs.where).toHaveBeenCalledWith('user_id', 'user-1')
  })
})

describe('ScheduledActivitiesService — index unique par jour (requêtes simultanées)', () => {
  const duplicate = Object.assign(new Error('duplicate key'), {
    code: '23505',
    constraint: 'scheduled_activities_user_date_type_unique',
  })

  it("traduit en 409 un doublon refusé par l'index, au lieu d'une erreur 500", async () => {
    // Le contrôle préalable ne voit rien (double clic) mais l'insertion est refusée par l'index
    const { service, knexMock } = await buildService({ scheduled_activities: [] })
    knexMock
      .mockImplementationOnce(() => builderResolving([]))
      .mockImplementationOnce(() => {
        const builder = builderResolving([])
        builder.then = (_resolve: unknown, reject: (e: unknown) => unknown) => Promise.reject(duplicate).catch(reject)
        return builder
      })

    await expect(service.create('user-1', { activity_type: 'wod', scheduled_date: '2026-10-06' })).rejects.toThrow(
      ConflictException
    )
  })

  it('laisse remonter les autres erreurs de base de données', async () => {
    const { service, knexMock } = await buildService({ scheduled_activities: [] })
    knexMock
      .mockImplementationOnce(() => builderResolving([]))
      .mockImplementationOnce(() => {
        const builder = builderResolving([])
        builder.then = (_resolve: unknown, reject: (e: unknown) => unknown) =>
          Promise.reject(new Error('connexion perdue')).catch(reject)
        return builder
      })

    await expect(service.create('user-1', { activity_type: 'wod', scheduled_date: '2026-10-06' })).rejects.toThrow(
      'connexion perdue'
    )
  })
})
