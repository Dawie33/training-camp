import type { Injury } from './injury'
import type { GlobalGoals, TrainingPreferences, SchedulePreferences } from './athlete-profile'

export interface SignupDto {
  email: string
  password: string
  firstName: string
  lastName: string
}

export interface LoginDto {
  email: string
  password: string
}

export interface AuthResponse {
  access_token?: string  // plus envoyé dans le body, token stocké en cookie httpOnly
  user: User
}

// User Types
export interface User {
  id: string
  email: string
  username: string
  firstName?: string
  lastName?: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
  workouts_count?: number
  sport_level?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  height?: number
  weight?: number
  body_fat_percentage?: number
  max_heart_rate?: number
  dateOfBirth?: string | null
  gender?: 'male' | 'female' | 'other' | null
  resting_heart_rate?: number | null
  global_goals?: GlobalGoals | null
  training_preferences?: TrainingPreferences | null
  physical_limitations?: string[] | Record<string, unknown> | null
  schedule_preferences?: SchedulePreferences | null
  equipment_available?: string[]
  injuries?: Injury[]
  stats?: {
    workouts: number
    sessions: number
    total_time_minutes: number
  }
}

// Champs modifiables via PATCH /users/me (voir UpdateUserDto côté backend)
export interface UpdateUserDTO {
  dateOfBirth?: string | null
  gender?: 'male' | 'female' | 'other' | null
  resting_heart_rate?: number | null
  global_goals?: GlobalGoals
  training_preferences?: TrainingPreferences
  physical_limitations?: string[]
  schedule_preferences?: SchedulePreferences
  firstName?: string
  lastName?: string
  sport_level?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  height?: number
  weight?: number
  body_fat_percentage?: number
  max_heart_rate?: number
  equipment_available?: string[]
  injuries?: Injury[]
}

// Admin Stats
export interface AdminStats {
  users: number
  workouts: number
  exercises: number
  equipments?: number
  activeUsers?: number
  workoutExercises?: number
  publishedWorkouts?: number
}
