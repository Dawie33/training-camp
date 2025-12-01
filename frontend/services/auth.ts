import type { AuthResponse, LoginDto, SignupDto, User } from '@/domain/entities/auth'
import apiClient from './apiClient'

export class AuthService {
  private endpoint = '/auth'

  /**
   * Inscrire un nouvel utilisateur.
   * @param data Les données de l'utilisateur
   * @returns Le token JWT et les données de l'utilisateur
   * @throws ConflictException si l'utilisateur existe déjà
   */
  async signup(data: SignupDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(`${this.endpoint}/signup`, data)
    if (response.access_token) {
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    return response
  }

  /**
   * Authentifier un utilisateur.
   * @param data Les données de connexion de l'utilisateur
   * @returns Le token JWT et les données de l'utilisateur
   */
  async login(data: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>(`${this.endpoint}/login`, data)
    if (response.access_token) {
      localStorage.setItem('access_token', response.access_token)
      localStorage.setItem('user', JSON.stringify(response.user))
    }
    return response
  }

  /**
   * Récupère le profil de l'utilisateur connecté.
   * @returns Le profil de l'utilisateur
   * @throws UnauthorizedException si l'utilisateur n'est pas connecté
   */
  async getMe(): Promise<User> {
    return apiClient.get<User>(`${this.endpoint}/me`)
  }

  /**
   * Récupère le profil complet de l'utilisateur connecté.
   * @returns Le profil complet de l'utilisateur
   */
  async getFullProfile(): Promise<User> {
    return apiClient.get<User>(`${this.endpoint}/profile`)
  }

  /**
   * Déconnecter l'utilisateur en supprimant le token JWT et les données de l'utilisateur stockées localement.
   */
  logout(): void {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  }

  /**
   * Récupère le token JWT stocké localement.
   * @returns Le token JWT si existant, null sinon
   */
  getToken(): string | null {
    return localStorage.getItem('access_token')
  }

  /**
   * Récupère l'utilisateur stocké localement.
   * @returns L'utilisateur si existant, null sinon
   */
  getUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }

  /**
   * Vérifie si l'utilisateur est connecté.
   * @returns true si l'utilisateur est connecté, false sinon
   */
  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

export const authService = new AuthService()
