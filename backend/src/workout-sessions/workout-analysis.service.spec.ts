import { ConflictException, NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { getConnectionToken } from 'nest-knexjs'
import { OpenAIClientService } from '../common/ai/openai-client.service'
import { UserContextService } from '../workouts/services/user-context.service'
import { WorkoutAnalysisService } from './workout-analysis.service'

function builder(value: unknown) {
  const query: Record<string, jest.Mock> = {}
  for (const name of ['select', 'where', 'first', 'whereNot', 'whereNotNull', 'orderBy', 'limit', 'update']) {
    query[name] = jest.fn().mockReturnValue(query)
  }
  query.then = jest.fn((resolve: (result: unknown) => unknown) => Promise.resolve(value).then(resolve))
  return query
}

async function fixture(values: unknown[]) {
  const queries = values.map(builder)
  const db = Object.assign(jest.fn(), { raw: jest.fn().mockReturnValue('updated_at::text as analysis_version') })
  for (const query of queries) db.mockReturnValueOnce(query)
  const ai = { createJsonCompletion: jest.fn().mockResolvedValue({ summary: 'Test' }) }
  const moduleRef = await Test.createTestingModule({
    providers: [
      WorkoutAnalysisService,
      { provide: getConnectionToken(), useValue: db },
      { provide: OpenAIClientService, useValue: ai },
      { provide: UserContextService, useValue: { invalidateCache: jest.fn() } },
    ],
  }).compile()
  return { service: moduleRef.get(WorkoutAnalysisService), queries, ai }
}

const session = {
  id: 'session',
  personalized_workout_id: 'personal',
  analysis_version: '2026-10-01 10:00:00.123456+00',
  results: { rounds: 3, reps: 12, rpe: 8 },
}

describe('WorkoutAnalysisService', () => {
  it('lit le plan personnalisé propriétaire, ses sections et son historique', async () => {
    const { service, queries, ai } = await fixture([
      session,
      {
        plan_json: {
          name: 'Force historique',
          blocks: { sections: [{ type: 'strength', exercises: [{ name: 'Squat', reps: 5 }] }] },
        },
      },
      [],
      1,
    ])
    await service.analyzeSession('session', 'user')
    expect(queries[1].where).toHaveBeenCalledWith({ id: 'personal', user_id: 'user' })
    expect(queries[2].where).toHaveBeenCalledWith({ personalized_workout_id: 'personal', user_id: 'user' })
    const prompt = ai.createJsonCompletion.mock.calls[0][0].messages[0].content
    for (const text of ['Force historique', 'Squat', '3 rounds + 12 reps', '8/10', 'Non renseigné']) {
      expect(prompt).toContain(text)
    }
    expect(prompt).not.toContain('Non (Scaled)')
  })

  it('ne transmet pas le plan personnalisé d’un autre utilisateur', async () => {
    const { service, ai } = await fixture([session, undefined])
    await expect(service.analyzeSession('session', 'user')).rejects.toBeInstanceOf(NotFoundException)
    expect(ai.createJsonCompletion).not.toHaveBeenCalled()
  })

  it('ne restaure pas une analyse obsolète si la séance a changé pendant l’appel IA', async () => {
    const { service, queries } = await fixture([session, { plan_json: {} }, [], 0])
    await expect(service.analyzeSession('session', 'user')).rejects.toBeInstanceOf(ConflictException)
    expect(queries[3].where).toHaveBeenCalledWith({
      id: 'session',
      user_id: 'user',
      updated_at: session.analysis_version,
    })
  })
})
