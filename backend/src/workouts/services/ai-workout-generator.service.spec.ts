import { BadRequestException, GatewayTimeoutException } from '@nestjs/common'
import { z } from 'zod'
import { AIWorkoutGeneratorService } from './ai-workout-generator.service'
import { ActiveSkillContext, UserAIContext, UserContextService } from './user-context.service'
import { AIInvalidResponseException } from '../../common/ai/ai-invalid-response.exception'
import { JsonCompletionRequest, OpenAIClientService } from '../../common/ai/openai-client.service'
import { buildCrossFitSystemPrompt } from '../prompts/crossfit-generator.prompt'

const muscleUpSkill: ActiveSkillContext = {
  program_id: 'program-1',
  skill_name: 'Muscle-Up',
  skill_category: 'gymnastics',
  step_id: 'step-1',
  step_title: 'Transition',
  recommended_exercises: [{ name: 'Negative Muscle-Ups', sets: 3, reps: 3 }],
  last_trained: null,
}

/**
 * Réutilise le workout d'exemple du prompt système comme réponse IA valide pour le schéma Zod.
 */
function exampleWorkoutJson(): string {
  const blocks = [...buildCrossFitSystemPrompt().matchAll(/```json\n([\s\S]*?)\n```/g)].map(m => m[1])
  return blocks[blocks.length - 1]
}

function buildContext(overrides: Partial<UserAIContext> = {}): UserAIContext {
  return {
    sport_level: 'intermediate',
    oneRepMaxes: [],
    benchmarkResults: {},
    global_goals: {},
    injuries: [],
    physical_limitations: {},
    equipment_available: [],
    training_preferences: {},
    recentSessions: [],
    recentAnalyses: [],
    activeSkills: [muscleUpSkill],
    completedSkillNames: [],
    progressionReports: [],
    diagnostic: {
      ratio_imbalances: [],
      underworked_domains: [],
      load_zone: null,
      load_change_pct: null,
      most_scaled_movements: [],
      benchmark_trends: [],
      sessions_per_week: 0,
      consistency_pct: 0,
      running: null,
    },
    ...overrides,
  }
}

/**
 * Simule `createJsonCompletion` : l'IA « répond » `json`, validé par le schéma demandé comme le ferait le vrai client.
 */
function mockOpenAI(json: string) {
  const createJsonCompletion = jest.fn(({ schema }: JsonCompletionRequest<z.ZodTypeAny>) =>
    Promise.resolve(schema.parse(JSON.parse(json)))
  )
  const openai = { createJsonCompletion } as unknown as OpenAIClientService
  return { createJsonCompletion, openai }
}

describe('AIWorkoutGeneratorService.generatePersonalizedWorkout', () => {
  let createJsonCompletion: jest.Mock
  let service: AIWorkoutGeneratorService

  beforeEach(() => {
    const mock = mockOpenAI(exampleWorkoutJson())
    createJsonCompletion = mock.createJsonCompletion
    const userContext = {
      getUserAIContext: jest.fn().mockResolvedValue(buildContext()),
    } as unknown as UserContextService

    service = new AIWorkoutGeneratorService(mock.openai, userContext)
  })

  /** Prompt utilisateur envoyé à OpenAI lors du dernier appel. */
  function sentUserPrompt(): string {
    return createJsonCompletion.mock.calls[0][0].messages[1].content
  }

  it.each(['conditioning', 'vo2max', 'core'])(
    "type %s → n'injecte pas le travail technique du skill actif",
    async workoutType => {
      await service.generatePersonalizedWorkout('user-1', { workoutType, duration: 45 })

      expect(sentUserPrompt()).not.toContain('TRAVAIL TECHNIQUE')
      expect(sentUserPrompt()).not.toContain('Muscle-Up')
    }
  )

  it('sans type précisé → défaut conditioning, donc pas de travail technique', async () => {
    await service.generatePersonalizedWorkout('user-1', { duration: 45 })

    expect(sentUserPrompt()).not.toContain('TRAVAIL TECHNIQUE')
  })

  it("type technique_metcon → injecte le skill, subordonné aux contraintes de l'athlète", async () => {
    await service.generatePersonalizedWorkout('user-1', { workoutType: 'technique_metcon', duration: 60 })

    expect(sentUserPrompt()).toContain('Muscle-Up')
    expect(sentUserPrompt()).toContain("sauf s'il contredit les contraintes de l'athlète")
    expect(sentUserPrompt()).not.toContain('OBLIGATOIREMENT')
  })

  it("consignes de l'athlète → placées dans les contraintes prioritaires, avant le travail technique", async () => {
    await service.generatePersonalizedWorkout('user-1', {
      workoutType: 'technique_metcon',
      duration: 60,
      additionalInstructions: 'ne sollicite pas les épaules',
    })

    const prompt = sentUserPrompt()
    expect(prompt).toContain("CONTRAINTES DE L'ATHLÈTE (PRIORITAIRES)")
    expect(prompt.indexOf('ne sollicite pas les épaules')).toBeLessThan(prompt.indexOf('TRAVAIL TECHNIQUE'))
  })
})

describe('AIWorkoutGeneratorService — WOD inconnu ou texte inexploitable', () => {
  const userContext = {} as UserContextService

  it("lookup : WOD inconnu de l'IA → 400 qui invite à coller les détails", async () => {
    const service = new AIWorkoutGeneratorService(mockOpenAI('{"error": "UNKNOWN_WOD"}').openai, userContext)

    await expect(service.lookupWorkoutByName('Open 26.1')).rejects.toThrow(
      new BadRequestException(
        "Impossible de trouver le WOD \"Open 26.1\". S'il s'agit d'un WOD récent, colle ses détails dans le champ prévu."
      )
    )
  })

  it('lookup : WOD connu → renvoie le workout', async () => {
    const service = new AIWorkoutGeneratorService(mockOpenAI(exampleWorkoutJson()).openai, userContext)

    await expect(service.lookupWorkoutByName('Fran')).resolves.toHaveProperty('name', 'Barbell Complex + AMRAP')
  })

  it('parse de texte : réponse inexploitable → 400, réessayer ne servirait à rien', async () => {
    const openai = {
      createJsonCompletion: jest.fn().mockRejectedValue(new AIInvalidResponseException()),
    } as unknown as OpenAIClientService
    const service = new AIWorkoutGeneratorService(openai, userContext)

    await expect(service.parseWorkoutText('Bonne journée à tous !')).rejects.toThrow(
      new BadRequestException('Le texte ne semble pas contenir un workout valide')
    )
  })

  it('parse de texte : délai OpenAI dépassé → reste un 504', async () => {
    const openai = {
      createJsonCompletion: jest.fn().mockRejectedValue(new GatewayTimeoutException()),
    } as unknown as OpenAIClientService
    const service = new AIWorkoutGeneratorService(openai, userContext)

    await expect(service.parseWorkoutText('5 rounds for time…')).rejects.toThrow(GatewayTimeoutException)
  })
})
