import type { CreateSportDTO, Sport, SportQueryParams, UpdateSportDTO } from '../types/sport'
import ResourceApi from './resourceApi'

/**
 * API Sports - Gestion des sports
 * Utilise ResourceApi pour les opérations CRUD standard
 */
export const sportsApi = new ResourceApi<Sport, CreateSportDTO, UpdateSportDTO>('/sports')

export class SportsService {
  /**
   * Récupère tous les sports avec pagination et filtres
   * @param query Paramètres de requête (limit, offset, orderBy, etc.)
   * @returns { rows: Sport[], count: number }
   */
  async getAll(query?: SportQueryParams) {
    return sportsApi.getAll(query)
  }

  /**
   * Récupère un sport par son ID
   * @param id Identifiant du sport
   * @returns Le sport correspondant
   */
  async getById(id: string): Promise<Sport> {
    return sportsApi.getOne(id)
  }

  /**
   * Crée un nouveau sport
   * @param data Données du sport à créer
   * @returns Le sport créé
   */
  async create(data: CreateSportDTO): Promise<Sport> {
    return sportsApi.create(data)
  }

  /**
   * Met à jour un sport
   * @param id Identifiant du sport
   * @param data Données à mettre à jour
   * @returns Le sport mis à jour
   */
  async update(id: string, data: UpdateSportDTO): Promise<Sport> {
    return sportsApi.update(id, data)
  }

  /**
   * Supprime un sport
   * @param id Identifiant du sport
   */
  async delete(id: string): Promise<void> {
    return sportsApi.delete(id)
  }
}

export const sportsService = new SportsService()
