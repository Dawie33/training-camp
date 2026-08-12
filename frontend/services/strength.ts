import { apiClient } from './index'

export type MuscleGroup = 'chest' | 'back' | 'shoulders' | 'arms' | 'forearms' | 'legs' | 'glutes' | 'core'
export type SessionGoal = 'strength' | 'hypertrophy' | 'endurance' | 'power'
export type BlockType = 'push' | 'pull' | 'hinge' | 'squat' | 'carry' | 'rotation' | 'isolation' | 'core' | 'isometric'
export type BodyFocus = 'upper_body' | 'lower_body' | 'full_body'
export type TrainingStyle = 'traditional' | 'strongman'

export const BODY_FOCUS_LABELS: Record<BodyFocus, string> = {
  upper_body: 'Haut du corps',
  lower_body: 'Bas du corps',
  full_body: 'Full body',
}

export const BODY_FOCUS_COLORS: Record<BodyFocus, string> = {
  upper_body: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  lower_body: 'bg-lime-500/20 text-lime-400 border-lime-500/30',
  full_body: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
}

export const TRAINING_STYLE_LABELS: Record<TrainingStyle, string> = {
  traditional: 'Traditionnel',
  strongman: 'Strongman',
}

export const MUSCLE_GROUPS: MuscleGroup[] = [
  'chest', 'back', 'shoulders', 'arms', 'forearms', 'legs', 'glutes', 'core',
]

export const UPPER_BODY_MUSCLES: MuscleGroup[] = ['chest', 'back', 'shoulders', 'arms', 'forearms']
export const LOWER_BODY_MUSCLES: MuscleGroup[] = ['legs', 'glutes', 'core']

export function deriveBodyFocus(muscles: MuscleGroup[]): BodyFocus {
  const hasUpper = muscles.some(m => UPPER_BODY_MUSCLES.includes(m))
  const hasLower = muscles.some(m => LOWER_BODY_MUSCLES.includes(m))
  if (hasUpper && hasLower) return 'full_body'
  if (hasLower) return 'lower_body'
  if (hasUpper) return 'upper_body'
  return 'full_body'
}

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Pectoraux',
  back: 'Dos',
  shoulders: 'Épaules',
  arms: 'Bras',
  forearms: 'Avant-bras',
  legs: 'Jambes',
  glutes: 'Fessiers',
  core: 'Abdos / Core',
}

export const MUSCLE_COLORS: Record<MuscleGroup, string> = {
  chest: 'bg-red-500/20 text-red-400 border-red-500/30',
  back: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  shoulders: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  arms: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  forearms: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  legs: 'bg-green-500/20 text-green-400 border-green-500/30',
  glutes: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  core: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
}

export const SESSION_GOAL_LABELS: Record<SessionGoal, string> = {
  strength: 'Force',
  hypertrophy: 'Hypertrophie',
  endurance: 'Endurance musculaire',
  power: 'Puissance',
}

export const SESSION_GOAL_COLORS: Record<SessionGoal, string> = {
  strength: 'bg-red-500/20 text-red-400 border-red-500/30',
  hypertrophy: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  endurance: 'bg-green-500/20 text-green-400 border-green-500/30',
  power: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
}

export const BLOCK_TYPE_COLORS: Record<BlockType, string> = {
  push: 'border-l-orange-500',
  pull: 'border-l-blue-500',
  hinge: 'border-l-green-500',
  squat: 'border-l-yellow-500',
  carry: 'border-l-purple-500',
  rotation: 'border-l-cyan-500',
  isolation: 'border-l-slate-400',
  core: 'border-l-emerald-500',
  isometric: 'border-l-red-600',
}

export const BLOCK_TYPE_LABELS: Record<BlockType, string> = {
  push: 'Poussée',
  pull: 'Tirage',
  hinge: 'Charnière',
  squat: 'Squat',
  carry: 'Porté',
  rotation: 'Rotation / Anti-rotation',
  isolation: 'Isolation',
  core: 'Core / Gainage',
  isometric: 'Isométrie / Tenue statique',
}

export interface StrengthExercise {
  name: string
  equipment?: string
  sets: number
  reps: number | string
  rest?: string
  intensity?: string
  coaching_notes?: string
  alternatives?: string[]
}

export interface StrengthBlock {
  block_name: string
  block_type: BlockType
  exercises: StrengthExercise[]
}

export interface WarmupExercise {
  name: string
  duration_or_reps: string
  notes?: string
}

export interface GeneratedStrengthSession {
  session_name: string
  target_muscles: string[]
  session_goal: SessionGoal
  estimated_duration_minutes: number
  coaching_notes?: string
  warmup: {
    duration: string
    exercises: WarmupExercise[]
  }
  blocks: StrengthBlock[]
  cooldown?: string
}

export interface StrengthSession {
  id: string
  user_id: string
  session_date: string
  target_muscles: string[]
  session_goal: SessionGoal
  body_focus?: BodyFocus
  training_style?: TrainingStyle
  equipment_used?: string[]
  source: 'manual' | 'ai_generated'
  ai_plan?: GeneratedStrengthSession
  sets_logged?: SetLogged[]
  perceived_effort?: number
  duration_minutes?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface SetLogged {
  exercise_name: string
  set_number: number
  reps: number
  weight_kg?: number
  rpe?: number
  notes?: string
}

export interface StrengthStats {
  total_sessions: string
  strength_sessions: string
  hypertrophy_sessions: string
  avg_rpe: string | null
  avg_duration: string | null
  muscle_frequency: Record<string, number>
}

export interface GenerateStrengthDto {
  targetMuscles: MuscleGroup[]
  sessionGoal: SessionGoal
  userLevel?: string
  availableEquipment?: string[]
  additionalContext?: string
  targetDurationMinutes?: number
  bodyFocus?: BodyFocus
  trainingStyle?: TrainingStyle
  personalized?: boolean
  existingPlan?: GeneratedStrengthSession
}

export const strengthService = {
  async getSessions(params?: Record<string, string | number | undefined>) {
    return apiClient.get<{ rows: StrengthSession[]; count: number }>('/strength', { params })
  },

  async getStats() {
    return apiClient.get<StrengthStats>('/strength/stats')
  },

  async getById(id: string) {
    return apiClient.get<StrengthSession>(`/strength/${id}`)
  },

  async generatePreview(data: GenerateStrengthDto) {
    return apiClient.post<GeneratedStrengthSession>('/strength/generate/preview', data)
  },

  async generateAndSave(data: GenerateStrengthDto) {
    return apiClient.post<StrengthSession>('/strength/generate/save', data)
  },

  async parseText(text: string) {
    return apiClient.post<GeneratedStrengthSession>('/strength/parse-text', { text })
  },

  async create(data: Partial<StrengthSession>) {
    return apiClient.post<StrengthSession>('/strength', data)
  },

  async update(id: string, data: Partial<StrengthSession>) {
    return apiClient.patch<StrengthSession>(`/strength/${id}`, data)
  },

  async delete(id: string) {
    return apiClient.delete<{ deleted: boolean }>(`/strength/${id}`)
  },
}
