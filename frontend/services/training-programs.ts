import type { GeneratedProgram, ProgramEnrollment } from '@/domain/entities/training-program'
import { apiClient } from './index'

export interface GenerateProgramRequest {
  program_type: string
  duration_weeks: number
  sessions_per_week: number
  target_level: string
  focus?: string
  box_days_per_week?: number
}

export interface CreateProgramRequest extends GenerateProgramRequest {
  name: string
  description: string
  objectives?: string
  weekly_structure: GeneratedProgram
  progression_notes?: string
}

export interface SwapRequest {
  swap_type: 'workout' | 'ai_regenerate' | 'exercise'
  week: number
  workout_id?: string
  instructions?: string
  movement_name?: string
  replacement_exercise?: {
    name: string
    sets: number
    reps: string | number
    intensity?: string
    rest?: string
    notes?: string
  }
}

export interface ScheduleWeekRequest {
  week_num: number
  start_date: string
  box_dates: string[]
}

export const trainingProgramsService = {
  /**
   * Génère un programme avec l'IA (aperçu, sans sauvegarde)
   */
  async generateWithAI(data: GenerateProgramRequest): Promise<GeneratedProgram> {
    return apiClient.post<GeneratedProgram>('/training-programs/generate-ai', data)
  },

  /**
   * Sauvegarde le programme généré et inscrit l'utilisateur
   */
  async createAndEnroll(data: CreateProgramRequest): Promise<{ program: unknown; enrollment: ProgramEnrollment }> {
    return apiClient.post('/training-programs', data)
  },

  /**
   * Récupère le programme actif de l'utilisateur
   */
  async getActive(): Promise<ProgramEnrollment | null> {
    return apiClient.get<ProgramEnrollment | null>('/training-programs/active')
  },

  /**
   * Lance un programme (enrolled → active)
   */
  async startProgram(enrollmentId: string): Promise<ProgramEnrollment> {
    return apiClient.patch<ProgramEnrollment>(`/training-programs/enrollments/${enrollmentId}/start`)
  },

  /**
   * Met en pause un programme
   */
  async pauseProgram(enrollmentId: string): Promise<ProgramEnrollment> {
    return apiClient.patch<ProgramEnrollment>(`/training-programs/enrollments/${enrollmentId}/pause`)
  },

  /**
   * Abandonne un programme
   */
  async abandonProgram(enrollmentId: string): Promise<ProgramEnrollment> {
    return apiClient.patch<ProgramEnrollment>(`/training-programs/enrollments/${enrollmentId}/abandon`)
  },

  /**
   * Met à jour l'enrollment (semaine courante, statut)
   */
  async updateEnrollment(
    enrollmentId: string,
    data: { status?: string; current_week?: number },
  ): Promise<ProgramEnrollment> {
    return apiClient.patch<ProgramEnrollment>(`/training-programs/enrollments/${enrollmentId}`, data)
  },

  /**
   * Récupère les sessions d'une semaine avec customisations appliquées
   */
  async getWeekSessions(
    enrollmentId: string,
    weekNum: number,
  ): Promise<{ phase: { phase_number: number; name: string; description: string }; sessions: unknown[]; weekNum: number }> {
    return apiClient.get(`/training-programs/enrollments/${enrollmentId}/week/${weekNum}`)
  },

  /**
   * Planifie les sessions d'une semaine dans le calendrier
   */
  async scheduleWeek(
    enrollmentId: string,
    data: ScheduleWeekRequest,
  ): Promise<{ scheduled: Array<{ date: string; session_title: string; schedule_id: string }>; box_dates_skipped: string[]; week_num: number }> {
    return apiClient.post(`/training-programs/enrollments/${enrollmentId}/schedule-week`, data)
  },

  /**
   * Swap d'une session (workout ou exercice)
   */
  async swapSession(
    enrollmentId: string,
    sessionInWeek: number,
    data: SwapRequest,
  ): Promise<{ success: boolean; swap_applied: unknown }> {
    return apiClient.patch(
      `/training-programs/enrollments/${enrollmentId}/sessions/${sessionInWeek}/swap`,
      data,
    )
  },

  /**
   * Vérifie si toutes les sessions de la semaine courante sont complètes
   */
  async checkWeekProgress(
    enrollmentId: string,
  ): Promise<{ auto_advanced: boolean; week_completed?: number; next_week?: number; all_done?: boolean; completed?: number; total?: number }> {
    return apiClient.get(`/training-programs/enrollments/${enrollmentId}/check-week-progress`)
  },
}
