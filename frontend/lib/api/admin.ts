const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'

// Admin Workout Interface (includes exercises)
export interface AdminWorkoutExercise {
  id: string
  workout_id: string
  exercise_id: string
  exercise_name: string
  category: string
  order_index: number
  sets?: string
  reps?: string
  weight?: string
  distance?: string
  time?: string
  specific_instructions?: string
  is_warmup: boolean
  is_cooldown: boolean
  is_main_workout: boolean
}

export interface AdminWorkout {
  id: string
  name?: string
  slug?: string
  description?: string
  workout_type?: string
  sport_id?: string
  sport_name?: string
  blocks?: Record<string, unknown>
  estimated_duration?: number
  intensity?: string
  difficulty?: string
  status: string
  isActive: boolean
  isFeatured: boolean
  isPublic: boolean
  ai_generated: boolean
  scheduled_date?: string
  tags?: string[]
  created_at: string
  updated_at: string
  exercises?: AdminWorkoutExercise[]
}

/**
 * Récupère les stats de l'admin, total des utilisateurs, des workouts et des exercices.
 */
export async function getAdminStats() {
  const res = await fetch(`${API_URL}/admin/stats`)
  if (!res.ok) throw new Error('Failed to fetch stats')
  return res.json()
}

/**
 * Récupère tous les exercices
 */
export async function getExercises(params?: { limit?: number; offset?: number; search?: string }) {
  const queryParams = new URLSearchParams()
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.offset) queryParams.append('offset', params.offset.toString())
  if (params?.search) queryParams.append('search', params.search)

  const res = await fetch(`${API_URL}/admin/exercises?${queryParams}`)
  if (!res.ok) throw new Error('Failed to fetch exercises')
  return res.json()
}


/**
 * Récupère un exercice par son ID.
 * @param id ID de l'exercice.
 * @returns L'exercice avec l'ID donné.
 * @throws {Error} Si l'exercice n'existe pas.
 */
export async function getExercise(id: string) {
  const res = await fetch(`${API_URL}/admin/exercises/${id}`)
  if (!res.ok) throw new Error('Failed to fetch exercise')
  return res.json()
}

/**
 * Crée un nouvel exercice.
 * @param data Informations de l'exercice à créer.
 * @returns L'exercice créé.
 * @throws {Error} Si l'exercice n'a pas pu être créé.
 */
export async function createExercise(data: object) {
  const res = await fetch(`${API_URL}/admin/exercises`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create exercise')
  return res.json()
}

/**
 * Met à jour un exercice.
 * @param id ID de l'exercice à mettre à jour.
 * @param data Informations de l'exercice à mettre à jour.
 * @returns L'exercice mis à jour.
 * @throws {Error} Si l'exercice n'a pas pu être mis à jour.
 */
export async function updateExercise(id: string, data: object) {
  const res = await fetch(`${API_URL}/admin/exercises/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update exercise')
  return res.json()
}

/**
 * Supprime un exercice.
 * @param id ID de l'exercice à supprimer.
 * @returns Le résultat de la suppression.
 * @throws {Error} Si l'exercice n'a pas pu être supprimé.
 */
export async function deleteExercise(id: string) {
  const res = await fetch(`${API_URL}/admin/exercises/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete exercise')
  return res.json()
}

/**
 * Récupère tous les equipements
 */
export async function getEquipments(params?: { limit?: number; offset?: number; search?: string }) {
  const queryParams = new URLSearchParams()
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.offset) queryParams.append('offset', params.offset.toString())
  if (params?.search) queryParams.append('search', params.search)

  const res = await fetch(`${API_URL}/admin/equipments?${queryParams}`)
  if (!res.ok) throw new Error('Failed to fetch equipments')
  return res.json()
}

/**
 * Récupère un équipement par son ID.
 * @param id ID de l'équipement à récupérer.
 * @returns L'équipement avec l'ID donné.
 * @throws {Error} Si l'équipement n'existe pas.
 */
export async function getEquipment(id: string) {
  const res = await fetch(`${API_URL}/admin/equipments/${id}`)
  if (!res.ok) throw new Error('Failed to fetch equipment')
  return res.json()
}

/**
 * Crée un nouvel équipement.
 * @param data Informations de l'équipement à créer.
 * @returns L'équipement créé.
 * @throws {Error} Si l'équipement n'a pas pu être créé.
 */
export async function createEquipment(data: object) {
  const res = await fetch(`${API_URL}/admin/equipments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to create equipment')
  return res.json()
}

/**
 * Met à jour un équipement.
 * @param id ID de l'équipement à mettre à jour.
 * @param data Informations de l'équipement à mettre à jour.
 * @returns L'équipement mis à jour.
 * @throws {Error} Si l'équipement n'a pas pu être mis à jour.
 */
export async function updateEquipment(id: string, data: object) {
  const res = await fetch(`${API_URL}/admin/equipments/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update equipment')
  return res.json()
}

/**
 * Supprime un équipement.
 * @param id ID de l'équipement à supprimer.
 * @returns Le résultat de la suppression.
 * @throws {Error} Si l'équipement n'a pas pu быть supprimé.
 */
export async function deleteEquipment(id: string) {
  const res = await fetch(`${API_URL}/admin/equipments/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete equipment')
  return res.json()
}

/**
 * Récupère tous les workouts
 */
export async function getWorkouts(params?: { limit?: number; offset?: number; search?: string; status?: string }) {
  const queryParams = new URLSearchParams()
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.offset) queryParams.append('offset', params.offset.toString())
  if (params?.search) queryParams.append('search', params.search)
  if (params?.status) queryParams.append('status', params.status)

  const res = await fetch(`${API_URL}/admin/workouts?${queryParams}`)
  if (!res.ok) throw new Error('Failed to fetch workouts')
  return res.json()
}

/**
 * Récupère un workout par son ID.
 * @param id ID du workout à récupérer.
 * @returns Le workout avec l'ID donné.
 * @throws {Error} Si le workout n'existe pas.
 */
export async function getWorkout(id: string) {
  const res = await fetch(`${API_URL}/admin/workouts/${id}`)
  if (!res.ok) throw new Error('Failed to fetch workout')
  return res.json()
}

/**
 * Met à jour un workout.
 * @param id ID du workout à mettre à jour.
 * @param data Informations du workout à mettre à jour.
 * @returns Le workout mis à jour.
 * @throws {Error} Si le workout n'a pas pu être mis à jour.
 */

export async function updateWorkout(id: string, data: object) {
  const res = await fetch(`${API_URL}/admin/workouts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update workout')
  return res.json()
}

/**
 * Supprime un workout.
 * @param id ID du workout à supprimer.
 * @returns Le résultat de la suppression.
 * @throws {Error} Si le workout n'a pas pu être supprimé.
 */
export async function deleteWorkout(id: string) {
  const res = await fetch(`${API_URL}/admin/workouts/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete workout')
  return res.json()
}

// Users
export async function getUsers(params?: { limit?: number; offset?: number; search?: string; role?: string }) {
  const queryParams = new URLSearchParams()
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.offset) queryParams.append('offset', params.offset.toString())
  if (params?.search) queryParams.append('search', params.search)
  if (params?.role) queryParams.append('role', params.role)

  const res = await fetch(`${API_URL}/admin/users?${queryParams}`)
  if (!res.ok) throw new Error('Failed to fetch users')
  return res.json()
}

export async function getUser(id: string) {
  const res = await fetch(`${API_URL}/admin/users/${id}`)
  if (!res.ok) throw new Error('Failed to fetch user')
  return res.json()
}

export async function updateUser(id: string, data: object) {
  const res = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error('Failed to update user')
  return res.json()
}

export async function deleteUser(id: string) {
  const res = await fetch(`${API_URL}/admin/users/${id}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error('Failed to delete user')
  return res.json()
}
