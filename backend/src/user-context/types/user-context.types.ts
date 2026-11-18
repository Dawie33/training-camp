import type { PerformanceDiagnosticSummary } from 'src/common/ai/diagnostic.types'
import type { Injury } from 'src/common/injuries/injury.constants'

/**
 * Résumé d'une analyse IA post-workout récente, utilisé comme contexte pour la génération.
 */
export interface RecentAnalysis {
  date: string
  workout_name: string
  performance_level: 'pr' | 'above_average' | 'average' | 'below_average' | 'first_time'
  strengths: string[]
  improvements: string[]
  next_steps: string
}

/**
 * Étape en cours d'un programme de compétence actif, avec ses exercices recommandés
 * et la date de dernière pratique — injectée dans les prompts de génération IA.
 */
export interface ActiveSkillContext {
  program_id: string
  skill_name: string
  skill_category: string
  step_id: string
  step_title: string
  step_description?: string
  recommended_exercises: Array<{
    name: string
    sets?: number
    reps?: string | number
    rest?: string
    intensity?: string
    notes?: string
  }>
  coaching_tips?: string
  last_trained: string | null // ISO date ou null si jamais travaillé
}

/**
 * Résumé d'un rapport de progression généré par sport (tendance, points forts/faibles, recommandations).
 */
export interface ProgressionReportSummary {
  sport: string
  period_months: number
  overall_trend: 'improving' | 'stable' | 'declining'
  period_summary: string
  strengths: string[]
  weak_points: string[]
  recommendations: string[]
  overall_fitness_level?: string
  generated_at: string
}

export type RecentSessionSport = 'crossfit'

/**
 * Séance récente tous sports confondus (CrossFit, force), utilisée comme
 * contexte pour la génération IA et les suggestions de type de séance.
 */
export interface RecentSession {
  date: string
  sport: RecentSessionSport
  workout_type?: string
  duration_minutes: number
  perceived_effort?: number
}

/**
 * Contexte complet d'un utilisateur (1RMs, équipements, historique, compétences actives,
 * rapports de progression, diagnostic calculé) fourni aux services de génération IA.
 * Voir `UserContextService`.
 */
export interface UserAIContext {
  sport_level: string
  height?: number
  weight?: number
  oneRepMaxes: { lift: string; value: number }[]
  benchmarkResults: Record<string, { result: Record<string, number | string>; date: string }>
  global_goals: Record<string, boolean>
  injuries: Injury[]
  physical_limitations: Record<string, unknown>
  equipment_available: string[]
  training_preferences: { preferred_duration?: number; sessions_per_week?: number }
  recentSessions: RecentSession[]
  recentAnalyses: RecentAnalysis[]
  activeSkills: ActiveSkillContext[]
  completedSkillNames: string[]
  progressionReports: ProgressionReportSummary[]
  /** Métriques calculées par le module analytics — jamais estimées par l'IA. */
  diagnostic: PerformanceDiagnosticSummary
}
