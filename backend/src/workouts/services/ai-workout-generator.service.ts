import { Injectable, BadRequestException, ConflictException } from '@nestjs/common'
import OpenAI from 'openai'
import {
  buildCrossFitSystemPrompt,
  buildCrossFitWorkoutPrompt
} from '../prompts/crossfit-generator.prompt'
import { GeneratedWorkoutSchema, GeneratedWorkoutValidated } from '../schemas/workout.schema'
import { ZodError } from 'zod'
import { UserContextService } from './user-context.service'
import { WorkoutsService } from './workouts.service'
import { WorkoutScheduleService } from './workout-schedule.service'

/**
 * Type pour la structure du workout généré par l'IA
 * Inféré automatiquement depuis le schéma Zod
 */
export type GeneratedWorkout = GeneratedWorkoutValidated

export interface WeeklyPlanDayInput {
  date: string // 'YYYY-MM-DD'
  type: string // 'perso' | 'box' | 'rest'
  focus?: string
}

export interface WeeklyPlanResult {
  scheduled: { date: string; workout_name: string; schedule_id: string }[]
  skipped: string[]
  box_days: string[]
}

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

  constructor(
    private readonly userContextService: UserContextService,
    private readonly workoutsService: WorkoutsService,
    private readonly workoutScheduleService: WorkoutScheduleService,
  ) {
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

  /**
   * Extrait et structure un WOD depuis du texte brut (ex: légende Instagram)
   * @param text Texte brut contenant la description du workout
   * @returns Le workout structuré au format JSON
   */
  async parseWorkoutText(text: string): Promise<GeneratedWorkout> {
    const systemPrompt = `Tu es un expert CrossFit spécialisé dans l'extraction et la structuration de WODs depuis du texte brut.

Ta mission est d'EXTRAIRE fidèlement le workout décrit dans le texte fourni, sans inventer d'exercices non mentionnés.
${buildCrossFitSystemPrompt()}`

    const userPrompt = `Extrait et structure ce WOD au format JSON :

---
${text}
---

IMPORTANT :
- Extrait fidèlement les informations présentes dans le texte
- Si une information manque (durée estimée, difficulté), infère-la de manière cohérente avec le contenu
- Structure les exercices en sections (warmup si mentionné, metcon, etc.) selon la logique CrossFit
- Retourne UNIQUEMENT le JSON structuré, sans texte avant ou après`

    try {
      return await this.callOpenAI(systemPrompt, userPrompt)
    } catch (error) {
      if (error instanceof BadRequestException) throw error
      throw new BadRequestException('Le texte ne semble pas contenir un workout valide')
    }
  }

  /**
   * Génère un plan d'entraînement hebdomadaire pour les jours Perso et retourne le résumé
   * @param userId ID de l'utilisateur
   * @param days Tableau des jours avec leur type (perso/box/rest)
   * @returns Résultat avec les workouts planifiés, les jours skippés et les jours Box
   */
  async generateWeeklyPlan(userId: string, days: WeeklyPlanDayInput[]): Promise<WeeklyPlanResult> {
    const persoDays = days.filter((d) => d.type === 'perso')
    const boxDays = days.filter((d) => d.type === 'box').map((d) => d.date)

    const scheduled: WeeklyPlanResult['scheduled'] = []
    const skipped: string[] = []

    await Promise.all(
      persoDays.map(async (day) => {
        try {
          const wod = await this.generatePersonalizedWorkout(userId, {
            workoutType: 'mixed',
            duration: 45,
            additionalInstructions: day.focus,
          })

          const saved = await this.workoutsService.create({
            name: wod.name,
            description: wod.description,
            workout_type: wod.workout_type,
            estimated_duration: wod.estimated_duration,
            difficulty: wod.difficulty,
            intensity: wod.intensity,
            blocks: wod.blocks as Record<string, unknown>,
            equipment_required: wod.equipment_required || [],
            focus_areas: wod.focus_areas || [],
            tags: wod.tags || [],
            coach_notes: wod.coach_notes || undefined,
            isPublic: false,
            status: 'published',
            ai_generated: true,
            created_by_user_id: userId,
          })

          try {
            const schedule = await this.workoutScheduleService.create(userId, {
              workout_id: saved.id,
              scheduled_date: day.date,
            })
            scheduled.push({ date: day.date, workout_name: wod.name, schedule_id: schedule.id })
          } catch (err) {
            if (err instanceof ConflictException) {
              skipped.push(day.date)
            } else {
              throw err
            }
          }
        } catch (err) {
          if (err instanceof ConflictException) {
            skipped.push(day.date)
          } else {
            throw err
          }
        }
      }),
    )

    return { scheduled, skipped, box_days: boxDays }
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
