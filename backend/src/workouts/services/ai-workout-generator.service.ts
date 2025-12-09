import { Injectable, BadRequestException } from '@nestjs/common'
import OpenAI from 'openai'
import {
  buildGenericSystemPrompt,
  buildGenericWorkoutPrompt,
  WorkoutGenerationParams
} from '../prompts/generic-generator.prompt'
import {
  buildMobilitySystemPrompt,
  buildMobilityWorkoutPrompt
} from '../prompts/mobility-generator.prompt'
import {
  buildCrossFitSystemPrompt,
  buildCrossFitWorkoutPrompt
} from '../prompts/crossfit-generator.prompt'
import {
  buildRunningSystemPrompt,
  buildRunningWorkoutPrompt
} from '../prompts/running-generator.prompt'
import {
  buildCyclingSystemPrompt,
  buildCyclingWorkoutPrompt
} from '../prompts/cycling-generator.prompt'
import {
  buildMusculationSystemPrompt,
  buildMusculationWorkoutPrompt
} from '../prompts/musculation-generator.prompt'
import {
  buildCrossTrainingSystemPrompt,
  buildCrossTrainingWorkoutPrompt
} from '../prompts/cross-training-generator.prompt'
import { GeneratedWorkoutSchema, GeneratedWorkoutValidated } from '../schemas/workout.schema'
import { ZodError } from 'zod'

/**
 * Type pour la structure du workout généré par l'IA
 * Inféré automatiquement depuis le schéma Zod
 */
export type GeneratedWorkout = GeneratedWorkoutValidated

@Injectable()
export class AIWorkoutGeneratorService {
  private openai: OpenAI

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY environment variable is not set')
    }
    this.openai = new OpenAI({ apiKey })
  }

  /**
   * Génère un workout en utilisant l'IA GPT-4o
   * Détecte automatiquement le sport et utilise le prompt spécialisé approprié
   * @param params Paramètres de génération
   * @returns Le workout généré au format JSON
   */
  async generateWorkout(params: WorkoutGenerationParams): Promise<GeneratedWorkout> {
    try {
      // Normaliser le sport pour la détection
      const sportSlug = params.sport?.toLowerCase().trim()

      // Construire les prompts selon le sport
      let systemPrompt: string
      let userPrompt: string
      let temperature = 0.8

      // Router vers le prompt spécialisé selon le sport
      if (sportSlug === 'mobility' || sportSlug === 'mobilité') {
        // Mobilité
        systemPrompt = buildMobilitySystemPrompt(params.equipment)
        const mobilityDifficulty = params.difficulty === 'elite' ? 'advanced' : params.difficulty
        userPrompt = buildMobilityWorkoutPrompt({
          duration: params.duration,
          difficulty: mobilityDifficulty,
          focusAreas: params.focus,
          equipment: params.equipment,
          additionalInstructions: params.additionalInstructions
        })
        temperature = 0.7

      } else if (sportSlug === 'crossfit') {
        // CrossFit
        systemPrompt = buildCrossFitSystemPrompt(params.equipment)
        userPrompt = buildCrossFitWorkoutPrompt({
          workoutType: params.workoutType || 'mixed',
          duration: params.duration,
          difficulty: params.difficulty,
          equipment: params.equipment,
          focus: Array.isArray(params.focus) ? params.focus.join(', ') : params.focus,
          additionalInstructions: params.additionalInstructions
        })
        temperature = 0.8

      } else if (sportSlug === 'running' || sportSlug === 'course') {
        // Running
        systemPrompt = buildRunningSystemPrompt(params.equipment)
        userPrompt = buildRunningWorkoutPrompt({
          workoutType: params.workoutType || 'intervals',
          duration: params.duration,
          difficulty: params.difficulty,
          equipment: params.equipment,
          additionalInstructions: params.additionalInstructions
        })
        temperature = 0.75

      } else if (sportSlug === 'cycling' || sportSlug === 'cyclisme' || sportSlug === 'vélo') {
        // Cycling
        systemPrompt = buildCyclingSystemPrompt(params.equipment)
        userPrompt = buildCyclingWorkoutPrompt({
          workoutType: params.workoutType || 'ftp_work',
          duration: params.duration,
          difficulty: params.difficulty,
          equipment: params.equipment,
          indoor: true, // Par défaut indoor pour plus de contrôle
          additionalInstructions: params.additionalInstructions
        })
        temperature = 0.75

      } else if (sportSlug === 'musculation' || sportSlug === 'strength-training' || sportSlug === 'weightlifting') {
        // Musculation
        systemPrompt = buildMusculationSystemPrompt(params.equipment)
        userPrompt = buildMusculationWorkoutPrompt({
          workoutType: params.workoutType || 'hypertrophy',
          duration: params.duration,
          difficulty: params.difficulty,
          equipment: params.equipment,
          focus: Array.isArray(params.focus) ? params.focus.join(', ') : params.focus,
          goal: 'hypertrophy',
          additionalInstructions: params.additionalInstructions
        })
        temperature = 0.75

      } else if (sportSlug === 'cross-training' || sportSlug === 'cardio') {
        // Cross-Training
        systemPrompt = buildCrossTrainingSystemPrompt(params.equipment)
        userPrompt = buildCrossTrainingWorkoutPrompt({
          workoutType: params.workoutType || 'circuit',
          duration: params.duration,
          difficulty: params.difficulty,
          equipment: params.equipment,
          lowImpact: false,
          goal: 'conditioning',
          additionalInstructions: params.additionalInstructions
        })
        temperature = 0.8

      } else {
        // Fallback: Utiliser le prompt générique
        systemPrompt = buildGenericSystemPrompt(params.equipment)
        userPrompt = buildGenericWorkoutPrompt(params)
        temperature = 0.8
      }

      // Appeler l'API OpenAI
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature,
        max_tokens: 4096,
        response_format: { type: 'json_object' } // Force la réponse en JSON
      })

      // Extraire le contenu de la réponse
      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new BadRequestException('No response from AI')
      }

      // Parser le JSON
      const workoutData = JSON.parse(content)

      // Valider avec Zod (le schéma standard est assez flexible pour la mobilité)
      const validatedWorkout = GeneratedWorkoutSchema.parse(workoutData)

      return validatedWorkout
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
