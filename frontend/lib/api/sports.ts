import type { PaginatedResponse, QueryDto, Sport } from '../types/sport'
import { apiClient } from './client'

export class SportsService {
  private endpoint = '/api/sports'

  /**
   * Get all sports with optional pagination and filtering
   */
  async getAll(query?: QueryDto): Promise<PaginatedResponse<Sport>> {
    const params = new URLSearchParams()

    if (query?.offset) params.append('offset', query.offset.toString())
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.orderBy) params.append('orderBy', query.orderBy)
    if (query?.orderDir) params.append('orderDir', query.orderDir)

    const queryString = params.toString()
    const url = queryString ? `${this.endpoint}?${queryString}` : this.endpoint

    return apiClient.get<PaginatedResponse<Sport>>(url)
  }

  /**
   * Get a single sport by ID
   */
  async getById(id: string): Promise<Sport> {
    return apiClient.get<Sport>(`${this.endpoint}/${id}`)
  }

  /**
   * Get sports by category
   */
  async getByCategory(category: string, query?: QueryDto): Promise<PaginatedResponse<Sport>> {
    const params = new URLSearchParams({ category })

    if (query?.offset) params.append('offset', query.offset.toString())
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.orderBy) params.append('orderBy', query.orderBy)
    if (query?.orderDir) params.append('orderDir', query.orderDir)

    return apiClient.get<PaginatedResponse<Sport>>(`${this.endpoint}?${params.toString()}`)
  }

  /**
   * Get only active sports
   */
  async getActive(query?: QueryDto): Promise<PaginatedResponse<Sport>> {
    const params = new URLSearchParams({ isActive: 'true' })

    if (query?.offset) params.append('offset', query.offset.toString())
    if (query?.limit) params.append('limit', query.limit.toString())
    if (query?.orderBy) params.append('orderBy', query.orderBy)
    if (query?.orderDir) params.append('orderDir', query.orderDir)
    return apiClient.get<PaginatedResponse<Sport>>(`${this.endpoint}?${params.toString()}`)
  }
}

export const sportsService = new SportsService()
