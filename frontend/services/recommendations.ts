import { apiClient } from './apiClient'
import type { WorkoutSchedule } from './schedule'

/** Ce que le coach IA a retenu pour la séance du jour. */
export interface CoachRecommendation {
  recommended_type: string
  urgency: 'low' | 'medium' | 'high'
  reason: string
  coaching_insight: string
  suggested_duration: number
}

export interface DailySessionResult {
  generated: boolean
  reason?: 'already_scheduled' | 'rest_recommended' | 'failed'
  /** Le créneau du jour, ou null (jour de repos, génération ratée). */
  schedule: WorkoutSchedule | null
  /** Renseignée les jours de repos. */
  recommendation?: CoachRecommendation
}

export const recommendationsService = {
  /** Renvoie la séance du jour, en la générant d'abord si elle n'existe pas encore. */
  checkDailySession: (): Promise<DailySessionResult> => apiClient.get('/recommendations/daily-session/check'),
}
