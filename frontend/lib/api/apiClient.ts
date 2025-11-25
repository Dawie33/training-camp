/**
 * Client API - Simplifie les appels API avec gestion automatique des erreurs,
 * des paramètres de requête et du typage TypeScript
 */

import type { ApiClientConfig, RequestOptions } from './types'

// En production, utiliser l'URL de l'API déployée sur Render
// En développement, utiliser localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://training-camp-backend.onrender.com/api'
    : 'http://localhost:3001/api')

console.log('🔧 API_URL configured:', API_URL)
console.log('🔧 NODE_ENV:', process.env.NODE_ENV)
console.log('🔧 NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL)

/**
 * Erreur personnalisée pour les erreurs API
 * Contient le code HTTP, le message d'erreur et l'URL appelée
 *
 * @example
 * ```typescript
 * try {
 *   await apiClient.get('/users/123')
 * } catch (error) {
 *   if (error instanceof ApiError) {
 *     console.error(`Erreur ${error.status}: ${error.message}`)
 *     console.error(`URL: ${error.url}`)
 *   }
 * }
 * ```
 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public url: string,
    message?: string
  ) {
    super(message || `Erreur API ${status}: ${statusText}`)
    this.name = 'ApiError'
  }
}

/**
 * Client HTTP pour effectuer des requêtes vers l'API
 * Gère automatiquement les erreurs, les en-têtes et la sérialisation JSON
 *
 * @example
 * ```typescript
 * const client = new ApiClient({ baseURL: 'https://api.example.com' })
 * const users = await client.get<User[]>('/users')
 * ```
 */
class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  /**
   * Crée une nouvelle instance du client API
   * @param config Configuration optionnelle (baseURL, headers)
   */
  constructor(config: ApiClientConfig = {}) {
    this.baseURL = config.baseURL || API_URL
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      ...config.headers,
    }
  }

  /**
   * Construit une chaîne de requête (query string) à partir d'un objet de paramètres
   * Filtre automatiquement les valeurs undefined et null
   *
   * @param params Objet contenant les paramètres de requête
   * @returns Chaîne de requête formatée (ex: "?limit=10&offset=0") ou chaîne vide
   *
   * @example
   * ```typescript
   * buildQueryString({ limit: 10, offset: 0, search: 'test' })
   * // Retourne: "?limit=10&offset=0&search=test"
   * ```
   */
  private buildQueryString(params?: Record<string, string | number | boolean | undefined>): string {
    if (!params) return ''

    const queryParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value))
      }
    })

    const queryString = queryParams.toString()
    return queryString ? `?${queryString}` : ''
  }

  /**
   * Gère la réponse HTTP et extrait les données
   * Lance une ApiError en cas d'erreur HTTP (status !== 2xx)
   *
   * @param response Réponse HTTP de fetch()
   * @returns Les données parsées (JSON ou texte)
   * @throws {ApiError} Si la réponse contient une erreur HTTP
   *
   * @example
   * ```typescript
   * const response = await fetch('/api/users')
   * const users = await this.handleResponse<User[]>(response)
   * ```
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Si la réponse n'est pas OK (status >= 400), lancer une erreur
    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.statusText,
        response.url,
        await response.text().catch(() => response.statusText)
      )
    }

    // Vérifier le type de contenu de la réponse
    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
      return response.json()
    }

    // Si ce n'est pas du JSON, retourner le texte brut
    // Type assertion nécessaire car T pourrait être string
    return response.text() as T
  }

  /**
   * Récupère le token d'authentification depuis le localStorage
   * @returns Le token JWT ou null s'il n'existe pas
   */
  private getAuthToken(): string | null {
    if (typeof window === 'undefined') {
      return null
    }
    return localStorage.getItem('access_token')
  }

  /**
   * Crée les en-têtes avec le token d'authentification si disponible
   * @param customHeaders En-têtes personnalisés optionnels
   * @returns En-têtes complets avec token
   */
  private getHeaders(customHeaders?: Record<string, string>): Record<string, string> {
    const headers = { ...this.defaultHeaders, ...customHeaders }
    const token = this.getAuthToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
    return headers
  }

  /**
   * Effectue une requête GET
   * Utilisée pour récupérer des données depuis l'API
   *
   * @template T Type de la réponse attendue
   * @param endpoint Point de terminaison de l'API (ex: '/users', '/exercises/123')
   * @param options Options de requête (params, headers, signal)
   * @returns Promesse contenant les données typées
   *
   * @example
   * ```typescript
   * // Récupérer tous les exercices
   * const exercises = await apiClient.get<Exercise[]>('/exercises')
   *
   * // Avec des paramètres de requête
   * const exercises = await apiClient.get<Exercise[]>('/exercises', {
   *   params: { limit: 10, search: 'push' }
   * })
   * ```
   */
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = `${this.baseURL}${endpoint}${this.buildQueryString(options?.params)}`
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(options?.headers),
    })
    return this.handleResponse<T>(response)
  }

  /**
   * Effectue une requête POST
   * Utilisée pour créer de nouvelles ressources
   *
   * @template T Type de la réponse attendue
   * @param endpoint Point de terminaison de l'API
   * @param data Données à envoyer dans le corps de la requête
   * @param options Options de requête (params, headers, signal)
   * @returns Promesse contenant les données de la réponse typées
   *
   * @example
   * ```typescript
   * // Créer un nouvel exercice
   * const newExercise = await apiClient.post<Exercise>('/exercises', {
   *   name: 'Push-ups',
   *   category: 'Strength'
   * })
   * ```
   */
  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = `${this.baseURL}${endpoint}${this.buildQueryString(options?.params)}`
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  /**
   * Effectue une requête PATCH
   * Utilisée pour mettre à jour partiellement une ressource existante
   *
   * @template T Type de la réponse attendue
   * @param endpoint Point de terminaison de l'API
   * @param data Données partielles à mettre à jour
   * @param options Options de requête (params, headers, signal)
   * @returns Promesse contenant la ressource mise à jour
   *
   * @example
   * ```typescript
   * // Mettre à jour le nom d'un exercice
   * const updated = await apiClient.patch<Exercise>('/exercises/123', {
   *   name: 'Diamond Push-ups'
   * })
   * ```
   */
  async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = `${this.baseURL}${endpoint}${this.buildQueryString(options?.params)}`
    const response = await fetch(url, {
      method: 'PATCH',
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  /**
   * Effectue une requête PUT
   * Utilisée pour remplacer complètement une ressource existante
   *
   * @template T Type de la réponse attendue
   * @param endpoint Point de terminaison de l'API
   * @param data Données complètes de remplacement
   * @param options Options de requête (params, headers, signal)
   * @returns Promesse contenant la ressource remplacée
   *
   * @example
   * ```typescript
   * // Remplacer complètement un exercice
   * const replaced = await apiClient.put<Exercise>('/exercises/123', {
   *   name: 'New Exercise',
   *   category: 'Cardio',
   *   description: 'Full replacement'
   * })
   * ```
   */
  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    const url = `${this.baseURL}${endpoint}${this.buildQueryString(options?.params)}`
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
    })
    return this.handleResponse<T>(response)
  }

  /**
   * Effectue une requête DELETE
   * Utilisée pour supprimer une ressource
   *
   * @template T Type de la réponse attendue (généralement void)
   * @param endpoint Point de terminaison de l'API
   * @param options Options de requête (params, headers, signal)
   * @returns Promesse qui se résout quand la suppression est terminée
   *
   * @example
   * ```typescript
   * // Supprimer un exercice
   * await apiClient.delete<void>('/exercises/123')
   * ```
   */
  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    const url = `${this.baseURL}${endpoint}${this.buildQueryString(options?.params)}`
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(options?.headers),
    })
    return this.handleResponse<T>(response)
  }
}


export const apiClient = new ApiClient()

export default apiClient
