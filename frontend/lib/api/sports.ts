import { ResourceApi } from './resourceApi'
import type { CreateSportDTO, Sport, SportCategory, SportQueryParams, UpdateSportDTO } from '../types/sport'


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
   * Récupère les sports par catégorie
   * @param category Catégorie du sport
   * @param query Paramètres de requête optionnels
   * @returns { rows: Sport[], count: number }
   */
  async getByCategory(category: SportCategory, query?: SportQueryParams) {
    return sportsApi.getAll({ ...query, category })
  }

  /**
   * Récupère uniquement les sports actifs
   * @param query Paramètres de requête optionnels
   * @returns { rows: Sport[], count: number }
   */
  async getActive(query?: SportQueryParams) {
    return sportsApi.getAll({ ...query, isActive: true })
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
