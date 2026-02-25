import { Injectable, BadRequestException } from '@nestjs/common'
import OpenAI from 'openai'
import {
  buildCrossFitSystemPrompt,
  buildCrossFitWorkoutPrompt
} from '../prompts/crossfit-generator.prompt'
import { GeneratedWorkoutSchema, GeneratedWorkoutValidated } from '../schemas/workout.schema'
import { ZodError } from 'zod'
import { UserContextService } from './user-context.service'

/**
 * Type pour la structure du workout généré par l'IA
 * Inféré automatiquement depuis le schéma Zod
 */
export type GeneratedWorkout = GeneratedWorkoutValidated

export interface WorkoutGenerationParams {
  workoutType?: string
  duration: number
  difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  equipment?: string[]
  focus?: string | string[]
  additionalInstructions?: string
}

@Injectable()
export class AIWorkoutGeneratorService {
  private openai: OpenAI

  constructor(private readonly userContextService: UserContextService) {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    this.openai = new OpenAI({ apiKey })
  }

  /**
   * Génère un workout CrossFit en utilisant l'IA GPT-4o
   * @param params Paramètres de génération
   * @returns Le workout généré au format JSON
   */
  async generateWorkout(params: WorkoutGenerationParams): Promise<GeneratedWorkout> {
    const systemPrompt = buildCrossFitSystemPrompt(params.equipment)
    const userPrompt = buildCrossFitWorkoutPrompt({
      workoutType: params.workoutType || 'mixed',
      duration: params.duration,
      difficulty: params.difficulty || 'intermediate',
      equipment: params.equipment,
      focus: Array.isArray(params.focus) ? params.focus.join(', ') : params.focus,
      additionalInstructions: params.additionalInstructions
    })
    return this.callOpenAI(systemPrompt, userPrompt)
  }

  /**
   * Génère un workout personnalisé enrichi avec le profil complet de l'utilisateur
   * @param userId ID de l'utilisateur
   * @param params Paramètres de génération (difficulty et equipment optionnels — fallback sur profil)
   * @returns Le workout généré au format JSON
   */
  async generatePersonalizedWorkout(userId: string, params: WorkoutGenerationParams): Promise<GeneratedWorkout> {
    const context = await this.userContextService.getUserAIContext(userId)

    const difficulty = params.difficulty ?? (context.sport_level as WorkoutGenerationParams['difficulty']) ?? 'intermediate'
    const equipment = params.equipment && params.equipment.length > 0
      ? params.equipment
      : context.equipment_available.length > 0 ? context.equipment_available : undefined

    const systemPrompt = buildCrossFitSystemPrompt(equipment, context)
    const userPrompt = buildCrossFitWorkoutPrompt({
      workoutType: params.workoutType || 'mixed',
      duration: params.duration,
      difficulty,
      equipment,
      focus: Array.isArray(params.focus) ? params.focus.join(', ') : params.focus,
      additionalInstructions: params.additionalInstructions
    })
    return this.callOpenAI(systemPrompt, userPrompt)
  }

  private async callOpenAI(systemPrompt: string, userPrompt: string): Promise<GeneratedWorkout> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.8,
        max_tokens: 4096,
        response_format: { type: 'json_object' }
      })

      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new BadRequestException('No response from AI')
      }

      const workoutData = JSON.parse(content)
      return GeneratedWorkoutSchema.parse(workoutData)
    } catch (error) {
      console.error('Error generating workout with AI:', error)

      if (error instanceof SyntaxError) {
        throw new BadRequestException('AI generated invalid JSON')
      }

      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        throw new BadRequestException(`Workout validation failed: ${errorMessages}`)
      }

      throw new BadRequestException(`Failed to generate workout: ${error.message}`)
    }
  }
}
