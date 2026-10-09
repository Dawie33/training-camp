import { AIWorkoutGeneratorService } from './ai-workout-generator.service'
import { ActiveSkillContext, UserAIContext, UserContextService } from './user-context.service'
import { OpenAIClientService } from '../../common/ai/openai-client.service'
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
  const blocks = [...buildCrossFitSystemPrompt().matchAll(/```json\n([\s\S]*?)\n```/g)].map((m) => m[1])
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
    },
    ...overrides,
  }
}

describe('AIWorkoutGeneratorService.generatePersonalizedWorkout', () => {
  let create: jest.Mock
  let service: AIWorkoutGeneratorService

  beforeEach(() => {
    create = jest.fn().mockResolvedValue({ choices: [{ message: { content: exampleWorkoutJson() } }] })
    const openai = {
      client: { chat: { completions: { create } } },
      model: 'gpt-4.1',
      temperatureParam: () => ({}),
      completionParams: () => ({}),
    } as unknown as OpenAIClientService
    const userContext = {
      getUserAIContext: jest.fn().mockResolvedValue(buildContext()),
    } as unknown as UserContextService

    service = new AIWorkoutGeneratorService(openai, userContext)
  })

  /** Prompt utilisateur envoyé à OpenAI lors du dernier appel. */
  function sentUserPrompt(): string {
    return create.mock.calls[0][0].messages[1].content
  }

  it.each(['conditioning', 'vo2max', 'core'])('type %s → n\'injecte pas le travail technique du skill actif', async (workoutType) => {
    await service.generatePersonalizedWorkout('user-1', { workoutType, duration: 45 })

    expect(sentUserPrompt()).not.toContain('TRAVAIL TECHNIQUE')
    expect(sentUserPrompt()).not.toContain('Muscle-Up')
  })

  it('sans type précisé → défaut conditioning, donc pas de travail technique', async () => {
    await service.generatePersonalizedWorkout('user-1', { duration: 45 })

    expect(sentUserPrompt()).not.toContain('TRAVAIL TECHNIQUE')
  })

  it('type technique_metcon → injecte le skill, subordonné aux contraintes de l\'athlète', async () => {
    await service.generatePersonalizedWorkout('user-1', { workoutType: 'technique_metcon', duration: 60 })

    expect(sentUserPrompt()).toContain('Muscle-Up')
    expect(sentUserPrompt()).toContain('sauf s\'il contredit les contraintes de l\'athlète')
    expect(sentUserPrompt()).not.toContain('OBLIGATOIREMENT')
  })

  it('consignes de l\'athlète → placées dans les contraintes prioritaires, avant le travail technique', async () => {
    await service.generatePersonalizedWorkout('user-1', {
      workoutType: 'technique_metcon',
      duration: 60,
      additionalInstructions: 'ne sollicite pas les épaules',
    })

    const prompt = sentUserPrompt()
    expect(prompt).toContain('CONTRAINTES DE L\'ATHLÈTE (PRIORITAIRES)')
    expect(prompt.indexOf('ne sollicite pas les épaules')).toBeLessThan(prompt.indexOf('TRAVAIL TECHNIQUE'))
  })
})
