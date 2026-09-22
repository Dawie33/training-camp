export type ActivityModule = 'crossfit' | 'skill' | 'wod' | 'conditioning'
export type ActivityStatus = 'scheduled' | 'completed' | 'skipped' | 'rescheduled'

/**
 * Vue unifiée d'une activité planifiée, quelle que soit sa source
 * (user_workout_schedule pour CrossFit, scheduled_activities pour les autres modules).
 *
 * Le travail de force n'a pas de source propre : c'est une section de type `strength`
 * dans une séance CrossFit.
 */
export interface UnifiedActivity {
  id: string
  user_id: string
  scheduled_date: string
  module: ActivityModule
  status: ActivityStatus
  title: string
  notes?: string
  location?: 'home' | 'box'
  created_at: string
  updated_at: string

  // Champs CrossFit (source: user_workout_schedule)
  workout_id?: string
  personalized_workout_id?: string
  session_type?: 'workout' | 'box_session' | 'program_session'
  workout_name?: string
  workout_type?: string
  difficulty?: string
  intensity?: string
  estimated_duration?: number
  completed_session_id?: string
  program_enrollment_id?: string
  session_data?: unknown

  // Champs nouveaux modules (source: scheduled_activities)
  activity_type?: 'skill' | 'wod' | 'conditioning'
  activity_id?: string

  // Champs Skill (source: scheduled_activities + skill_programs)
  skill_program_id?: string
  skill_name?: string
  skill_category?: string
  skill_step_title?: string
  skill_progress?: number

  // Identifie la table source pour les actions CRUD
  _source: 'workout_schedule' | 'scheduled_activities'
}
