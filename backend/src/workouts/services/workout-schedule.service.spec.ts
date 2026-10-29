import { NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { GoogleCalendarService } from '../../google-calendar/google-calendar.service'
import { WorkoutScheduleService } from './workout-schedule.service'

/** Colonne `date` telle que la renvoie le driver pg : un objet Date à minuit, heure locale. */
const pgDate = (year: number, month: number, day: number) => new Date(year, month - 1, day)

/**
 * Builder Knex chaînable : chaque méthode renvoie le builder, et `await builder` résout `rows`
 * (quel que soit le dernier maillon). `first()` résout la première ligne.
 */
function builderResolving(rows: unknown[]) {
  const builder: any = {}
  for (const method of [
    'select',
    'leftJoin',
    'where',
    'whereNot',
    'whereIn',
    'insert',
    'update',
    'returning',
    'delete',
  ]) {
    builder[method] = jest.fn(() => builder)
  }
  builder.first = jest.fn(() => Promise.resolve(rows[0]))
  builder.then = (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
    Promise.resolve(rows).then(resolve, reject)
  return builder
}

/**
 * Chaque appel `knex(table)` consomme, dans l'ordre, le prochain jeu de lignes de `results`.
 * L'ordre doit suivre celui des requêtes du service.
 */
async function buildService(results: unknown[][]) {
  const builders: any[] = []
  const knexMock: any = jest.fn(() => {
    const builder = builderResolving(results[builders.length] ?? [])
    builders.push(builder)
    return builder
  })
  knexMock.raw = jest.fn()

  // Client Google simulé : aucun appel réseau
  const google = {
    syncWorkout: jest.fn().mockResolvedValue(null),
    updateEvent: jest.fn().mockResolvedValue(true),
    deleteEvent: jest.fn().mockResolvedValue(true),
  }

  const moduleRef = await Test.createTestingModule({
    providers: [
      WorkoutScheduleService,
      { provide: getConnectionToken(), useValue: knexMock },
      { provide: GoogleCalendarService, useValue: google },
    ],
  }).compile()

  return { service: moduleRef.get(WorkoutScheduleService), knexMock, builders, google }
}

const scheduleRow = {
  id: 's1',
  user_id: 'user-1',
  workout_id: 'w1',
  scheduled_date: pgDate(2026, 10, 6),
  status: 'scheduled',
  google_event_id: 'evt-1',
}

describe('WorkoutScheduleService — synchronisation Google Agenda', () => {
  describe('create', () => {
    const workout = { id: 'w1', name: 'Fran', workout_type: 'for_time', estimated_duration: 20 }
    const inserted = { ...scheduleRow, google_event_id: null }

    it("enregistre l'id de l'événement Google créé", async () => {
      // workout, contrôle de doublon (vide), insertion, enregistrement de l'id
      const { service, builders, google } = await buildService([[workout], [], [inserted], []])
      google.syncWorkout.mockResolvedValue('evt-1')

      const result = await service.create('user-1', { workout_id: 'w1', scheduled_date: '2026-10-06' })

      expect(google.syncWorkout).toHaveBeenCalledWith('user-1', {
        name: 'Fran',
        scheduledDate: '2026-10-06',
        duration: 20,
        type: 'for_time',
      })
      expect(builders[3].where).toHaveBeenCalledWith('id', 's1')
      expect(builders[3].update).toHaveBeenCalledWith({ google_event_id: 'evt-1' })
      expect(result.google_event_id).toBe('evt-1')
    })

    it("n'écrit rien de plus quand l'agenda n'est pas connecté", async () => {
      const { service, knexMock } = await buildService([[workout], [], [inserted]])

      const result = await service.create('user-1', { workout_id: 'w1', scheduled_date: '2026-10-06' })

      expect(knexMock).toHaveBeenCalledTimes(3)
      expect(result.google_event_id).toBeNull()
    })

    it('planifie la séance même si Google échoue', async () => {
      const { service, google } = await buildService([[workout], [], [inserted]])
      google.syncWorkout.mockRejectedValue(new Error('Service Unavailable'))

      await expect(service.create('user-1', { workout_id: 'w1', scheduled_date: '2026-10-06' })).resolves.toEqual(
        expect.objectContaining({ id: 's1' })
      )
    })

    it('planifie un jour de repos sans workout, et sans événement Google', async () => {
      // Arrange — pas de lecture de workout : contrôle de doublon (vide), puis insertion
      const restRow = { ...inserted, workout_id: null, session_type: 'rest' }
      const { service, builders, google } = await buildService([[], [restRow]])

      // Act
      const result = await service.create('user-1', { session_type: 'rest', scheduled_date: '2026-11-02' })

      // Assert
      expect(builders[1].insert).toHaveBeenCalledWith(
        expect.objectContaining({ session_type: 'rest', workout_id: null, scheduled_date: '2026-11-02' })
      )
      expect(google.syncWorkout).not.toHaveBeenCalled()
      expect(result).toEqual(restRow)
    })

    it('refuse toujours un créneau de séance sans workout', async () => {
      const { service } = await buildService([])

      await expect(service.create('user-1', { scheduled_date: '2026-11-02' })).rejects.toThrow(
        'workout_id ou personalized_workout_id est requis'
      )
    })
  })

  describe('update', () => {
    const moved = { ...scheduleRow, scheduled_date: pgDate(2026, 10, 8) }
    const withDetails = { ...moved, workout_name: 'Fran', estimated_duration: 20 }

    it("déplace l'événement Google à la nouvelle date, en gardant la durée du workout", async () => {
      // lecture, contrôle de conflit (vide), mise à jour, relecture avec la durée
      const { service, google } = await buildService([[scheduleRow], [], [moved], [withDetails]])

      await service.update('s1', 'user-1', { scheduled_date: '2026-10-08' })

      expect(google.updateEvent).toHaveBeenCalledWith('user-1', 'evt-1', { scheduledDate: '2026-10-08', duration: 20 })
    })

    it('ne cherche pas de conflit ni ne touche Google quand la date envoyée est celle déjà enregistrée', async () => {
      // existing.scheduled_date est un objet Date : la comparaison doit porter sur le jour
      const { service, knexMock, google } = await buildService([[scheduleRow], [scheduleRow]])

      await service.update('s1', 'user-1', { scheduled_date: '2026-10-06', notes: 'Au box' })

      expect(knexMock).toHaveBeenCalledTimes(2)
      expect(google.updateEvent).not.toHaveBeenCalled()
    })

    it("ne touche pas Google quand la séance n'a pas d'événement (agenda non connecté)", async () => {
      const notSynced = { ...scheduleRow, google_event_id: null }
      const { service, google } = await buildService([
        [notSynced],
        [],
        [{ ...notSynced, scheduled_date: '2026-10-08' }],
      ])

      await service.update('s1', 'user-1', { scheduled_date: '2026-10-08' })

      expect(google.updateEvent).not.toHaveBeenCalled()
    })

    it('déplace la séance même si Google échoue', async () => {
      const { service, google } = await buildService([[scheduleRow], [], [moved], [withDetails]])
      google.updateEvent.mockRejectedValue(new Error('Service Unavailable'))

      await expect(service.update('s1', 'user-1', { scheduled_date: '2026-10-08' })).resolves.toEqual(moved)
    })
  })

  describe('delete', () => {
    it("supprime l'événement Google de la séance supprimée", async () => {
      const { service, builders, google } = await buildService([[{ google_event_id: 'evt-1' }]])

      await expect(service.delete('s1', 'user-1')).resolves.toEqual({ success: true })

      expect(builders[0].delete).toHaveBeenCalledWith(['google_event_id'])
      expect(google.deleteEvent).toHaveBeenCalledWith('user-1', 'evt-1')
    })

    it("ne contacte pas Google quand la séance n'avait pas d'événement", async () => {
      const { service, google } = await buildService([[{ google_event_id: null }]])

      await service.delete('s1', 'user-1')

      expect(google.deleteEvent).not.toHaveBeenCalled()
    })

    it('supprime la séance même si Google échoue', async () => {
      const { service, google } = await buildService([[{ google_event_id: 'evt-1' }]])
      google.deleteEvent.mockRejectedValue(new Error('Service Unavailable'))

      await expect(service.delete('s1', 'user-1')).resolves.toEqual({ success: true })
    })

    it("renvoie 404 sans contacter Google quand la séance n'existe pas", async () => {
      const { service, google } = await buildService([[]])

      await expect(service.delete('s1', 'user-1')).rejects.toThrow(NotFoundException)
      expect(google.deleteEvent).not.toHaveBeenCalled()
    })
  })

  describe('suggestWeek', () => {
    it('rattache un jour Box au bon jour de la semaine quand pg renvoie la colonne date en objet Date', async () => {
      // Arrange — pg construit une colonne `date` à minuit heure locale : new Date(2026, 9, 6) = mardi 6 octobre.
      // Avec toISOString(), à Paris, ce mardi devenait le lundi 5 (22 h UTC la veille).
      const boxRows = [{ scheduled_date: new Date(2026, 9, 6) }]
      const { service } = await buildService([boxRows, []])

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
})
