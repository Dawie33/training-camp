export type SportCategory = 'mixed'

export interface Sport {
  id: string
  name: string
  slug: string
  icon: string | null
  description: string | null
  category: SportCategory
  common_metrics: string[] // JSON array
  equipment_categories: string[] | null // JSON array
  isActive: boolean
  requires_premium: boolean
  sort_order: number
  created_at: string
  updated_at: string
}

/**
 * Sport par défaut de l'application (Crossfit)
 * Ce sport est hardcodé car l'application est spécialisée dans un seul sport
 */
export const DEFAULT_SPORT: Sport = {
  id: '', // Sera récupéré dynamiquement via l'API au premier chargement
  name: 'Crossfit',
  slug: 'crossfit',
  icon: '💪',
  description: 'Entraînement de Crossfit',
  category: 'mixed',
  common_metrics: ['reps', 'sets', 'weight'],
  equipment_categories: ['barbell', 'dumbbells', 'machines', 'bench'],
  isActive: true,
  requires_premium: false,
  sort_order: 0,
  created_at: '',
  updated_at: '',
}

/**
 * Types pour l'API Sports
 */
export interface CreateSportDTO {
  name: string
  slug?: string
  icon?: string | null
  description?: string | null
  category: SportCategory
  common_metrics?: string[]
  equipment_categories?: string[] | null
  isActive?: boolean
  requires_premium?: boolean
  sort_order?: number
}

export type UpdateSportDTO = Partial<CreateSportDTO>

export interface SportQueryParams {
  limit?: number
  offset?: number
  orderBy?: string
  slug?: string
  orderDir?: 'asc' | 'desc'
  category?: SportCategory
  isActive?: boolean
  [key: string]: string | number | boolean | undefined
}
