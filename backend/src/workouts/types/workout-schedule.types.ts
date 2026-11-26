export interface ScheduleRow {
  id: string
  user_id: string
  workout_id: string | null
  personalized_workout_id: string | null
  scheduled_date: string | Date
  status: 'scheduled' | 'completed' | 'skipped' | 'rescheduled'
  session_type: 'workout' | 'box_session' | 'program_session' | 'rest'
  completed_session_id: string | null
  location: string | null
  notes: string | null
  google_event_id: string | null
  coach_recommendation: unknown
  coach_proposal: unknown
  created_at: string | Date
  updated_at: string | Date
  workout_name?: string | null
  workout_type?: string | null
  difficulty?: string | null
  intensity?: string | null
  estimated_duration?: number | null
}
