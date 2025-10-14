import { Injectable, BadRequestException } from '@nestjs/common'
import OpenAI from 'openai'
import {
  buildSystemPrompt,
  buildWorkoutGenerationPrompt,
  WorkoutGenerationParams
} from '../prompts/workout-generator.prompt'
import { GeneratedWorkoutSchema, GeneratedWorkoutValidated } from '../prompts/workout-generator.schema'
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
   * @param params Paramètres de génération
   * @returns Le workout généré au format JSON
   */
  async generateWorkout(params: WorkoutGenerationParams): Promise<GeneratedWorkout> {
    try {
      // Construire les prompts système et utilisateur
      const systemPrompt = buildSystemPrompt(params.equipment)
      const userPrompt = buildWorkoutGenerationPrompt(params)

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
        temperature: 0.8, // Créativité pour varier les workouts
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

      // Valider avec Zod
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
