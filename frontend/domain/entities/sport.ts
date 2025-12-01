export type SportCategory =
  | 'endurance'
  | 'strength'
  | 'mixed'
  | 'team'
  | 'individual'
  | 'water'
  | 'combat'

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
