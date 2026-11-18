import { BadRequestException, NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { UserContextService } from '../user-context/user-context.service'
import { WorkoutsService } from '../workouts/services/workouts.service'
import { WorkoutScheduleService } from '../workouts/services/workout-schedule.service'
import { WorkoutSessionsService } from './workout-sessions.service'

function builder(value: unknown) {
  const methods: Record<string, jest.Mock> = {}
  for (const name of ['where', 'first', 'forUpdate', 'insert', 'update', 'delete', 'returning', 'orderBy']) {
    methods[name] = jest.fn().mockReturnValue(methods)
  }
  methods.then = jest.fn((resolve: (result: unknown) => unknown, reject: (error: unknown) => unknown) =>
    Promise.resolve(value).then(resolve, reject)
  )
  return methods
}

async function fixture(values: unknown[], realBenchmarks = false) {
  const queries = values.map(builder)
  const db = Object.assign(jest.fn(), { fn: { now: jest.fn().mockReturnValue('now') } })
  for (const query of queries) db.mockReturnValueOnce(query)
  const knex = Object.assign(jest.fn(), {
    transaction: jest.fn((callback: (trx: typeof db) => Promise<unknown>) => callback(db)),
  })
  const workouts = { recordBenchmarkResult: jest.fn(), removeSessionBenchmark: jest.fn() }
  const context = { invalidateCache: jest.fn() }
  const moduleRef = await Test.createTestingModule({
    providers: [
      WorkoutSessionsService,
      { provide: getConnectionToken(), useValue: knex },
      { provide: UserContextService, useValue: context },
      realBenchmarks ? WorkoutsService : { provide: WorkoutsService, useValue: workouts },
      { provide: WorkoutScheduleService, useValue: {} },
    ],
  }).compile()
  return { service: moduleRef.get(WorkoutSessionsService), db, knex, queries, workouts, context }
}

const session = {
  id: 'session',
  user_id: 'user',
  workout_id: 'workout',
  started_at: '2026-10-01T10:00:00Z',
  completed_at: '2026-10-01T11:00:00Z',
  results: { elapsed_time_seconds: 300 },
}

describe('WorkoutSessionsService', () => {
  it('valide résultats et chronologie avant toute écriture', async () => {
    const { service, knex } = await fixture([])
    await expect(service.create('user', { results: { rpe: 11 } })).rejects.toBeInstanceOf(BadRequestException)
    await expect(
      service.create('user', {
        started_at: '2026-10-02T10:00:00Z',
        completed_at: '2026-10-01T10:00:00Z',
      })
    ).rejects.toBeInstanceOf(BadRequestException)
    expect(knex.transaction).not.toHaveBeenCalled()
  })

  it.each(['workout_id', 'personalized_workout_id'] as const)('refuse une référence %s invisible', async key => {
    const { service, queries } = await fixture([undefined])
    await expect(service.create('user', { [key]: 'private' })).rejects.toBeInstanceOf(NotFoundException)
    expect(queries[0].where).toHaveBeenCalled()
    expect(queries[0].insert).not.toHaveBeenCalled()
    if (key === 'personalized_workout_id') {
      expect(queries[0].where).toHaveBeenCalledWith({ id: 'private', user_id: 'user' })
    }
  })

  it('enregistre séance complète, benchmark et calendrier dans la même transaction', async () => {
    const { service, db, queries, workouts } = await fixture([
      { id: 'workout' },
      { id: 'schedule', workout_id: 'workout', personalized_workout_id: null },
      [session],
      { is_benchmark: true, name: 'Fran' },
      1,
    ])
    await expect(
      service.create('user', {
        workout_id: 'workout',
        schedule_id: 'schedule',
        started_at: session.started_at,
        completed_at: session.completed_at,
        results: session.results,
      })
    ).resolves.toEqual(session)
    expect(queries[2].insert).toHaveBeenCalledWith(
      expect.objectContaining({
        completed_at: session.completed_at,
        results: JSON.stringify(session.results),
      })
    )
    expect(workouts.recordBenchmarkResult).toHaveBeenCalledWith(
      'user',
      'workout',
      'Fran',
      { time_seconds: 300, rounds: undefined, reps: undefined },
      'manual',
      { sessionId: 'session', measuredAt: session.completed_at, transaction: db }
    )
    expect(queries[4].update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'completed',
        completed_session_id: 'session',
      })
    )
  })

  it('propage un échec benchmark sans compléter le calendrier ni annoncer un succès', async () => {
    const { service, queries, workouts, context, knex } = await fixture([
      { id: 'workout' },
      { id: 'schedule', workout_id: 'workout', personalized_workout_id: null },
      [session],
      { is_benchmark: true, name: 'Fran' },
      1,
    ])
    workouts.recordBenchmarkResult.mockRejectedValue(new Error('database unavailable'))
    await expect(
      service.create('user', {
        workout_id: 'workout',
        schedule_id: 'schedule',
        started_at: session.started_at,
        completed_at: session.completed_at,
        results: session.results,
      })
    ).rejects.toThrow('database unavailable')
    expect(knex.transaction).toHaveBeenCalledTimes(1)
    expect(queries[4].update).not.toHaveBeenCalled()
    expect(context.invalidateCache).not.toHaveBeenCalled()
  })

  it('refuse un calendrier étranger ou un workout différent avant insertion', async () => {
    const { service, db } = await fixture([undefined])
    await expect(
      service.create('user', {
        schedule_id: 'foreign',
        started_at: session.started_at,
        completed_at: session.completed_at,
      })
    ).rejects.toBeInstanceOf(NotFoundException)
    expect(db).toHaveBeenCalledTimes(1)
    const mismatch = await fixture([{ workout_id: 'other', personalized_workout_id: null }])
    await expect(
      mismatch.service.create('user', {
        schedule_id: 'schedule',
        started_at: session.started_at,
        completed_at: session.completed_at,
      })
    ).rejects.toBeInstanceOf(BadRequestException)
  })

  it('invalide l’analyse et réutilise la même référence benchmark lors des corrections', async () => {
    const { service, queries, workouts } = await fixture([
      session,
      [session],
      { name: 'Fran', is_benchmark: true },
      session,
      [session],
      { name: 'Fran', is_benchmark: true },
    ])
    await service.update('session', 'user', { results: { elapsed_time_seconds: 300 } })
    await service.update('session', 'user', { results: { elapsed_time_seconds: 290 } })
    expect(queries[1].update).toHaveBeenCalledWith(expect.objectContaining({ ai_analysis: null }))
    expect(queries[4].update).toHaveBeenCalledWith(expect.objectContaining({ ai_analysis: null }))
    for (const call of workouts.recordBenchmarkResult.mock.calls) expect(call[5].sessionId).toBe('session')
  })

  it('ne modifie pas une séance étrangère', async () => {
    const { service, queries } = await fixture([undefined])
    await expect(service.update('foreign', 'user', { notes: 'test' })).resolves.toBeNull()
    expect(queries[0].where).toHaveBeenCalledWith({ id: 'foreign', user_id: 'user' })
    expect(queries[0].update).not.toHaveBeenCalled()
  })

  it('conserve le démarrage puis la mise à jour des notes d’une séance encore en cours', async () => {
    const active = { ...session, completed_at: null }
    const { service, queries } = await fixture([active, [active]])
    await expect(service.update('session', 'user', { notes: 'En cours' })).resolves.toEqual(active)
    expect(queries[1].update).toHaveBeenCalledWith(expect.objectContaining({ notes: 'En cours' }))
  })

  it('permet de logger le workout réellement fait sur un créneau Box sans prescription', async () => {
    const { service, queries } = await fixture([
      { id: 'workout' },
      { id: 'schedule', session_type: 'box_session', workout_id: null, personalized_workout_id: null },
      [session],
      { is_benchmark: false },
      1,
    ])
    await service.create('user', {
      workout_id: 'workout',
      schedule_id: 'schedule',
      started_at: session.started_at,
      completed_at: session.completed_at,
      results: session.results,
    })
    expect(queries[4].update).toHaveBeenCalledWith(expect.objectContaining({ completed_session_id: 'session' }))
  })

  it('réinitialise le créneau et retire la mesure benchmark avant de supprimer la séance', async () => {
    const { service, db, queries, workouts } = await fixture([session, 1, 1])
    await expect(service.delete('session', 'user')).resolves.toBe(true)
    expect(queries[1].where).toHaveBeenCalledWith({ completed_session_id: 'session', user_id: 'user' })
    expect(queries[1].update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'scheduled',
        completed_session_id: null,
      })
    )
    expect(workouts.removeSessionBenchmark).toHaveBeenCalledWith(db, 'user', 'session')
    expect(queries[2].delete).toHaveBeenCalled()
  })

  it.each([false, true])(
    'reconstruit le résumé benchmark sans effacer les autres mesures (mesure restante : %s)',
    async remaining => {
      const latest = remaining
        ? {
            workout_id: 'workout',
            score_type: 'time_seconds',
            score_value: '350.00',
            extra_reps: null,
            measured_at: '2026-09-01T10:00:00Z',
          }
        : undefined
      const { service, queries } = await fixture(
        [
          session,
          1,
          { benchmark_results: { Fran: { result: 'ancien' }, Cindy: { result: 'conservé' } } },
          { workout_id: 'workout', workout_name: 'Fran' },
          1,
          latest,
          1,
          1,
        ],
        true
      )
      await service.delete('session', 'user')
      const update = queries[6].update.mock.calls[0][0]
      const summary = JSON.parse(update.benchmark_results)
      expect(summary.Cindy).toEqual({ result: 'conservé' })
      if (remaining) {
        expect(summary.Fran).toEqual({
          workout_id: 'workout',
          result: { time_seconds: 350 },
          date: latest?.measured_at,
        })
      } else {
        expect(summary.Fran).toBeUndefined()
      }
      expect(update).not.toHaveProperty('sport_level')
    }
  )
})
