import { AdminStats, CreateUserDTO, UpdateUserDTO, User, UserQueryParams } from '../types/auth'
import { CreateEquipmentDTO, Equipment, UpdateEquipmentDTO } from '../types/equipment'
import { CreateExerciseDTO, Exercise, UpdateExerciseDTO } from '../types/exercice'
import { AdminWorkout, CreateWorkoutDTO, UpdateWorkoutDTO, WorkoutQueryParams } from '../types/workout'
import { WorkoutBlocks } from '../types/workout-structure'
import { apiClient } from './apiClient'
import { ResourceApi } from './resourceApi'

// Type pour les workouts générés par l'IA (nouvelle structure modulaire)
export interface GeneratedWorkout {
  name: string
  description: string
  workout_type: string
  estimated_duration: number
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  intensity: 'low' | 'moderate' | 'high' | 'very_high'
  blocks: WorkoutBlocks
  equipment_required?: string[]
  focus_areas?: string[]
  tags?: string[]
  coach_notes?: string
}



// ============================================================================
// Exercices API
// ============================================================================
export const exercisesApi = new ResourceApi<Exercise, CreateExerciseDTO, UpdateExerciseDTO>(
  '/admin/exercises'
)

export async function getExercises(params?: {
  limit?: number
  offset?: number
  search?: string
}) {
  return exercisesApi.getAll(params)
}

export async function getExercise(id: string): Promise<Exercise> {
  return exercisesApi.getOne(id)
}

export async function createExercise(data: CreateExerciseDTO): Promise<Exercise> {
  return exercisesApi.create(data)
}

export async function updateExercise(id: string, data: UpdateExerciseDTO): Promise<Exercise> {
  return exercisesApi.update(id, data)
}

export async function deleteExercise(id: string): Promise<void> {
  return exercisesApi.delete(id)
}



// ============================================================================
// Equipments API
// ============================================================================
export const equipmentsApi = new ResourceApi<Equipment, CreateEquipmentDTO, UpdateEquipmentDTO>(
  '/admin/equipments'
)

export async function getEquipments(params?: {
  limit?: number
  offset?: number
  search?: string
}) {
  return equipmentsApi.getAll(params)
}

export async function getEquipment(id: string): Promise<Equipment> {
  return equipmentsApi.getOne(id)
}

export async function createEquipment(data: CreateEquipmentDTO): Promise<Equipment> {
  return equipmentsApi.create(data)
}

export async function updateEquipment(id: string, data: UpdateEquipmentDTO): Promise<Equipment> {
  return equipmentsApi.update(id, data)
}

export async function deleteEquipment(id: string): Promise<void> {
  return equipmentsApi.delete(id)
}


// ============================================================================
// Workout API
// ============================================================================
export const workoutsApi = new ResourceApi<AdminWorkout, CreateWorkoutDTO, UpdateWorkoutDTO>(
  '/admin/workouts'
)
export async function getWorkouts(params?: WorkoutQueryParams) {
  return workoutsApi.getAll(params)
}

export async function getWorkout(id: string): Promise<AdminWorkout> {
  return workoutsApi.getOne(id)
}

export async function createWorkout(data: CreateWorkoutDTO): Promise<AdminWorkout> {
  return workoutsApi.create(data)
}

/**
 * Génère un workout avec l'IA en fonction des paramètres
 * Retourne uniquement le JSON du workout sans le sauvegarder
 */
export async function generateWorkoutWithAI(data: {
  sport: string
  workoutType: string
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite'
  duration: number
  focus?: string[]
  equipment?: string[]
  constraints?: string[]
  additionalInstructions?: string
}): Promise<GeneratedWorkout> {
  const token = localStorage.getItem('access_token')
  return apiClient.post<GeneratedWorkout>('/admin/workouts/generate-ai', data, {
    headers: { Authorization: `Bearer ${token}` }
  })
}

export async function updateWorkout(id: string, data: UpdateWorkoutDTO): Promise<AdminWorkout> {
  return workoutsApi.update(id, data)
}

export async function deleteWorkout(id: string): Promise<void> {
  return workoutsApi.delete(id)
}


// ============================================================================
// Users API
// ============================================================================
export const usersApi = new ResourceApi<User, CreateUserDTO, UpdateUserDTO>('/admin/users')

export async function getUsers(params?: UserQueryParams) {
  return usersApi.getAll(params)
}

export async function getUser(id: string): Promise<User> {
  return usersApi.getOne(id)
}

export async function updateUser(id: string, data: UpdateUserDTO): Promise<User> {
  return usersApi.update(id, data)
}

export async function deleteUser(id: string): Promise<void> {
  return usersApi.delete(id)
}


/**
 * Admin Stats API
 */
export async function getAdminStats(): Promise<AdminStats> {
  return apiClient.get<AdminStats>('/admin/stats')
}





