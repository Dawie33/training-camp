export interface SignupDto {
  email: string
  password: string
  firstName: string
  lastName: string
  dateOfBirth?: string
  gender?: 'male' | 'female' | 'other'
}

export interface LoginDto {
  email: string
  password: string
}

export interface AuthResponse {
  access_token: string
  user: User
}

// User Types
export interface User {
  id: string
  email: string
  username: string
  primary_sport?: string
  sports_practiced?: string | string[]
  firstName?: string
  lastName?: string
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
  stats?: {
    workouts: number
    sessions: number
  }
}

export interface CreateUserDTO {
  email: string
  username: string
  password: string
  firstName?: string
  lastName?: string
  role?: string
}

export interface UpdateUserDTO {
  email?: string
  username?: string
  password?: string
  firstName?: string
  lastName?: string
  role?: string
  is_active?: boolean
}

export interface UserQueryParams {
  limit?: number
  offset?: number
  search?: string
  role?: string
  [key: string]: string | number | boolean | undefined
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

export interface UserProfile {
  primary_sport?: string
  sports_practiced?: string | string[]
}