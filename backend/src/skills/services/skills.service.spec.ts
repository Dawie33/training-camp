import { Knex } from 'knex'
import { UserContextService } from 'src/workouts/services/user-context.service'
import { GoogleCalendarService } from 'src/google-calendar/google-calendar.service'
import { toParisDate } from 'src/common/utils/date-only'
import { SkillsService } from './skills.service'
import { CreateSkillProgramDto } from '../dto/skill.dto'

function setup(results: unknown[], failCommit = false) {
  const queries: { table: string; methods: Record<string, jest.Mock> }[] = []
  let committed = false
  const db = jest.fn((table: string) => {
    const result = results.shift()
    const methods: Record<string, jest.Mock> = {}
    const builder = {
      then: (resolve: (v: unknown) => unknown, reject: (e: unknown) => unknown) =>
        Promise.resolve(result).then(resolve, reject),
    }
    for (const method of [
      'where',
      'whereNotIn',
      'join',
      'forUpdate',
      'first',
      'insert',
      'update',
      'delete',
      'returning',
      'count',
      'orderBy',
    ]) {
      methods[method] = jest.fn(() => builder)
      Object.assign(builder, { [method]: methods[method] })
    }
    queries.push({ table, methods })
    return builder
  })
  const knex = Object.assign(db, {
    transaction: jest.fn(async (callback: (trx: Knex.Transaction) => Promise<unknown>) => {
      const result = await callback(db as unknown as Knex.Transaction)
      if (failCommit) throw new Error('commit failed')
      committed = true
      return result
    }),
  })
  const invalidateCache = jest.fn(() => {
    expect(committed || !knex.transaction.mock.calls.length).toBe(true)
  })
  const google = { deleteEvent: jest.fn().mockResolvedValue(true) }
  const service = new SkillsService(
    knex as unknown as Knex,
    { invalidateCache } as unknown as UserContextService,
    google as unknown as GoogleCalendarService
  )
  return { service, queries, knex, invalidateCache, google }
}

const data = (): CreateSkillProgramDto => ({
  skill_name: 'Muscle-up',
  skill_category: 'gymnastics',
  steps: Array.from({ length: 4 }, (_, i) => ({
    step_number: i + 1,
    title: 'Etape',
    frequency: '3x',
    when_to_train: 'Avant',
    warmup: 'Mobilite',
  })),
})

describe('SkillsService', () => {
  it('persists programming fields and invalidates only after commit', async () => {
    const { service, queries, invalidateCache } = setup([[{ id: 'p' }], [{ id: 's' }]])
    await service.create('u', data())
    expect(queries[1].methods.insert).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ frequency: '3x', when_to_train: 'Avant', warmup: 'Mobilite', status: 'in_progress' }),
      ])
    )
    expect(invalidateCache).toHaveBeenCalledWith('u')
  })
  it('does not invalidate on failed commit', async () => {
    const { service, invalidateCache } = setup([[{ id: 'p' }], []], true)
    await expect(service.create('u', data())).rejects.toThrow('commit failed')
    expect(invalidateCache).not.toHaveBeenCalled()
  })
  it.each([
    [1, 2, 2, 4],
    [1, 2, 4, 5],
  ])('rejects invalid saved numbering', async (...numbers) => {
    const { service, knex } = setup([])
    const input = data()
    input.steps.forEach((s, i) => {
      s.step_number = numbers[i]
    })
    await expect(service.create('u', input)).rejects.toMatchObject({ status: 400 })
    expect(knex.transaction).not.toHaveBeenCalled()
  })
  it('rejects malformed exercise objects', async () => {
    const { service } = setup([])
    const input = data()
    input.steps[0].recommended_exercises = [{ other: true }, { name: 'Dip' }]
    await expect(service.create('u', input)).rejects.toMatchObject({ status: 400 })
  })
  it('invalidates after pause without removing planned sessions', async () => {
    const { service, queries, invalidateCache } = setup([{ id: 'p' }, [{ status: 'paused' }]])
    await service.updateProgram('p', 'u', { status: 'paused' })
    expect(queries.map(q => q.table)).not.toContain('scheduled_activities')
    expect(invalidateCache).toHaveBeenCalledWith('u')
  })
  it.each(['completed', 'abandoned'])('cleans future scheduled sessions on %s', async status => {
    const { service, queries, google } = setup([{ id: 'p' }, [{ status }], [{ google_event_id: 'g' }]])
    await service.updateProgram('p', 'u', { status })
    expect(queries[2].methods.where).toHaveBeenCalledWith({
      user_id: 'u',
      activity_type: 'skill',
      activity_id: 'p',
      status: 'scheduled',
    })
    expect(queries[2].methods.where).toHaveBeenCalledWith(
      'scheduled_date',
      '>=',
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/)
    )
    expect(google.deleteEvent).toHaveBeenCalledWith('u', 'g')
  })
  it('deletes only an owned program and its future schedules', async () => {
    const { service, queries } = setup([{ id: 'p' }, [], 1])
    await service.deleteProgram('p', 'u')
    expect(queries[0].methods.where).toHaveBeenCalledWith({ id: 'p', user_id: 'u' })
    expect(queries[2].methods.delete).toHaveBeenCalled()
  })
  it('rejects an unowned program without writing', async () => {
    const { service, queries, invalidateCache } = setup([undefined])
    await expect(service.deleteProgram('p', 'u')).rejects.toMatchObject({ status: 404 })
    expect(queries).toHaveLength(1)
    expect(invalidateCache).not.toHaveBeenCalled()
  })
  it('unlocks the next step atomically', async () => {
    const { service, queries, invalidateCache } = setup([
      { status: 'active' },
      { step_number: 1, status: 'in_progress' },
      [{ id: 's' }],
      { id: 'next', status: 'locked' },
      1,
      { count: '1' },
    ])
    await service.updateStep('p', 's', 'u', { status: 'completed' })
    expect(queries[4].methods.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'in_progress' }))
    expect(invalidateCache).toHaveBeenCalledWith('u')
  })
  it('completes the final step and cleans future schedules', async () => {
    const { service, queries } = setup([
      { status: 'active' },
      { step_number: 4, status: 'in_progress' },
      [{ id: 's' }],
      undefined,
      { count: '0' },
      1,
      [],
    ])
    await service.updateStep('p', 's', 'u', { status: 'completed' })
    expect(queries[5].methods.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'completed' }))
    expect(queries[6].table).toBe('scheduled_activities')
  })
  it('rejects completing a locked step', async () => {
    const { service, queries } = setup([{ status: 'active' }, { status: 'locked' }])
    await expect(service.updateStep('p', 's', 'u', { status: 'completed' })).rejects.toMatchObject({ status: 409 })
    expect(queries).toHaveLength(2)
  })
  it('logs a session and completes only matching planned activities', async () => {
    const { service, queries } = setup([
      { program_id: 'p' },
      { id: 'p' },
      [{ id: 'l', session_date: new Date(2026, 0, 5) }],
      1,
    ])
    const log = await service.logProgress('u', { step_id: 's', session_date: '2026-01-05' })
    expect(log.session_date).toBe('2026-01-05')
    expect(queries[3].methods.where).toHaveBeenCalledWith({
      user_id: 'u',
      activity_type: 'skill',
      activity_id: 'p',
      scheduled_date: '2026-01-05',
      status: 'scheduled',
    })
  })
  it('rejects future sessions without querying', async () => {
    const { service, knex } = setup([])
    await expect(service.logProgress('u', { step_id: 's', session_date: '2999-01-01' })).rejects.toMatchObject({
      status: 400,
    })
    expect(knex).not.toHaveBeenCalled()
  })
  it('rejects logging a step owned by someone else', async () => {
    const { service, queries, invalidateCache } = setup([undefined])
    await expect(service.logProgress('u', { step_id: 's', session_date: '2026-01-05' })).rejects.toMatchObject({
      status: 404,
    })
    expect(queries).toHaveLength(1)
    expect(invalidateCache).not.toHaveBeenCalled()
  })
  it('allows historic logging for an already completed program', async () => {
    const { service } = setup([
      { program_id: 'p', status: 'completed' },
      { id: 'p', status: 'completed' },
      [{ id: 'l', session_date: '2026-01-05' }],
      1,
    ])
    await expect(service.logProgress('u', { step_id: 's', session_date: '2026-01-05' })).resolves.toMatchObject({
      id: 'l',
      session_date: '2026-01-05',
    })
  })
  it('invalidates after deleting a log', async () => {
    const { service, queries, invalidateCache } = setup([
      { id: 'l', program_id: 'p', session_date: '2026-01-05' },
      { id: 'p' },
      1,
      undefined,
      1,
    ])
    await service.deleteLog('l', 'u')
    expect(queries[4].methods.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'scheduled' }))
    expect(invalidateCache).toHaveBeenCalledWith('u')
  })
  it('keeps the calendar completed if another log exists that day', async () => {
    const { service, queries } = setup([
      { id: 'l', program_id: 'p', session_date: '2026-01-05' },
      { id: 'p' },
      1,
      { id: 'other' },
    ])
    await service.deleteLog('l', 'u')
    expect(queries.map(q => q.table)).not.toContain('scheduled_activities')
  })
  it('does not reintroduce a planned slot today for a finished program', async () => {
    const { service, queries, google } = setup([
      { id: 'l', program_id: 'p', session_date: toParisDate(new Date()) },
      { id: 'p', status: 'completed' },
      1,
      undefined,
      [{ google_event_id: 'g' }],
    ])
    await service.deleteLog('l', 'u')
    expect(queries[4].methods.delete).toHaveBeenCalledWith(['google_event_id'])
    expect(queries[4].methods.update).not.toHaveBeenCalled()
    expect(google.deleteEvent).toHaveBeenCalledWith('u', 'g')
  })
})
