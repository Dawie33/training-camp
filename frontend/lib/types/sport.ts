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

export interface QueryDto {
  page?: number
  limit?: number
  sort?: string
  order?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
