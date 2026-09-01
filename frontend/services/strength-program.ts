import apiClient from './apiClient'
import type { ActiveEnrollment, GeneratedProgram, ProgramSession, WeekSessions } from './training-programs'

// --- Types ---

export interface GenerateStrengthProgramDto {
  duration_weeks: 4 | 6 | 8 | 12
  sessions_per_week: 1 | 2 | 3 | 4 | 5
  target_level?: 'beginner' | 'intermediate' | 'advanced'
  training_style?: 'force_max' | 'hypertrophy' | 'powerlifting_peak' | 'strongman_prep'
  focus?: string
}

// --- Service ---

export const strengthProgramApi = {
  generatePreview: (dto: GenerateStrengthProgramDto): Promise<GeneratedProgram> =>
    apiClient.post('/strength/program/generate-ai', dto),

  createAndEnroll: (program: GeneratedProgram & { duration_weeks: number; sessions_per_week: number }) =>
    apiClient.post('/strength/program', {
      name: program.name,
      description: program.description,
      objectives: program.objectives,
      program_type: 'strength_building',
      duration_weeks: program.duration_weeks,
      sessions_per_week: program.sessions_per_week,
      target_level: program.target_level,
      weekly_structure: { phases: program.phases },
      progression_notes: program.progression_notes,
    }),

  getActive: (): Promise<ActiveEnrollment | null> =>
    apiClient.get('/strength/program/active'),

  getWeekSessions: (enrollmentId: string, weekNum: number): Promise<WeekSessions> =>
    apiClient.get(`/strength/program/enrollments/${enrollmentId}/week/${weekNum}`),

  start: (enrollmentId: string) =>
    apiClient.patch(`/strength/program/enrollments/${enrollmentId}/start`, {}),

  pause: (enrollmentId: string) =>
    apiClient.patch(`/strength/program/enrollments/${enrollmentId}/pause`, {}),

  abandon: (enrollmentId: string) =>
    apiClient.patch(`/strength/program/enrollments/${enrollmentId}/abandon`, {}),

  scheduleWeek: (
    enrollmentId: string,
    dto: { week_num: number; start_date?: string; box_dates?: string[]; assignments?: { session_index: number; date: string }[] }
  ): Promise<{ scheduled: { date: string; session_title: string; schedule_id: string }[]; week_num: number }> =>
    apiClient.post(`/strength/program/enrollments/${enrollmentId}/schedule-week`, dto),
}

export type { GeneratedProgram, ProgramSession }
