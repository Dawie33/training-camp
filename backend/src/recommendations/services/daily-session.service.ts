import { Injectable, Logger } from '@nestjs/common'
import { AIWorkoutGeneratorService } from 'src/workouts/services/ai-workout-generator.service'
import { WorkoutScheduleService } from 'src/workouts/services/workout-schedule.service'
import { WorkoutsService } from 'src/workouts/services/workouts.service'
import { AIRecommendation } from '../schemas/recommendation.schema'
import { RecommendationsService } from './recommendations.service'

/** Ce que le coach a retenu pour la séance — conservé sur le créneau pour rester fidèle à la séance générée. */
export type CoachRecommendationSnapshot = Pick<
  AIRecommendation,
  'recommended_type' | 'urgency' | 'reason' | 'coaching_insight' | 'suggested_duration'
>

export interface DailySessionResult {
  generated: boolean
  /** Pourquoi rien n'a été généré, quand c'est le cas. */
  reason?: 'already_scheduled' | 'rest_recommended' | 'failed'
  /** Le créneau du jour (avec `coach_recommendation` s'il a été généré automatiquement), ou null. */
  schedule: Record<string, unknown> | null
  /** Renseignée les jours de repos, pour expliquer pourquoi aucune séance n'est prévue. */
  recommendation?: CoachRecommendationSnapshot
}

function toSnapshot(recommendation: AIRecommendation): CoachRecommendationSnapshot {
  const { recommended_type, urgency, reason, coaching_insight, suggested_duration } = recommendation
  return {
    recommended_type,
    urgency,
    reason,
    coaching_insight,
    suggested_duration,
  }
}

/**
 * Crée automatiquement la séance du jour à partir de la recommandation.
 *
 * Le module ne couvrant plus que le CrossFit, choisir un sport est devenu trivial :
 * la recommandation sert désormais à décider *quoi* faire, et ce service la transforme
 * directement en séance planifiée pour que l'athlète n'ait rien à créer lui-même.
 *
 * Même motif que `checkAndGenerateMonthlyReport` et `checkAndScheduleMonthlyBenchmark` :
 * appelé silencieusement à la connexion, sans dépendre d'un cron serveur.
 */
@Injectable()
export class DailySessionService {
  private readonly logger = new Logger(DailySessionService.name)

  constructor(
    private readonly recommendationsService: RecommendationsService,
    private readonly generator: AIWorkoutGeneratorService,
    private readonly workoutsService: WorkoutsService,
    private readonly scheduleService: WorkoutScheduleService
  ) {}

  /**
   * Génère et planifie la séance du jour si elle n'existe pas déjà.
   *
   * Au plus un appel OpenAI par jour : dès qu'un créneau existe pour aujourd'hui,
   * la méthode sort sans rien générer. Un jour de repos recommandé ne produit
   * aucune séance — c'est une décision de programmation, pas un échec.
   *
   * @param userId ID de l'utilisateur
   */
  async checkAndGenerateDailySession(userId: string): Promise<DailySessionResult> {
    const today = new Date().toISOString().slice(0, 10)

    const existing = await this.scheduleService.findByDate(userId, today)
    if (existing) {
      return {
        generated: false,
        reason: 'already_scheduled',
        schedule: existing,
      }
    }

    try {
      const { recommendation } = await this.recommendationsService.getNextSessionRecommendation(userId)

      if (recommendation.recommended_sport === 'rest') {
        return {
          generated: false,
          reason: 'rest_recommended',
          schedule: null,
          recommendation: toSnapshot(recommendation),
        }
      }

      const wod = await this.generator.generatePersonalizedWorkout(userId, {
        workoutType: recommendation.recommended_type,
        duration: recommendation.suggested_duration,
        focus: recommendation.suggested_focus ?? undefined,
        additionalInstructions: recommendation.suggested_instructions ?? undefined,
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

      const schedule = await this.scheduleService.create(userId, {
        workout_id: saved.id,
        scheduled_date: today,
      })

      await this.scheduleService.setCoachRecommendation(schedule.id, userId, toSnapshot(recommendation))

      return {
        generated: true,
        schedule: await this.scheduleService.findByDate(userId, today),
      }
    } catch (error) {
      // Une génération ratée ne doit jamais bloquer la connexion : on journalise et on passe.
      this.logger.warn(`Séance du jour non générée pour ${userId} : ${(error as Error).message}`)

      // Un appel concurrent a pu planifier la séance entre-temps (conflit sur la date) : on la renvoie.
      const concurrent = await this.scheduleService.findByDate(userId, today).catch(() => null)
      if (concurrent) return { generated: false, reason: 'already_scheduled', schedule: concurrent }

      return { generated: false, reason: 'failed', schedule: null }
    }
  }
}
