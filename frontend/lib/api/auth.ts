import type { AuthResponse, LoginDto, SignupDto, User } from '../types/auth'
import { apiClient } from './apiClient'

export class AuthService {
  private endpoint = '/auth'

  /**
   * Inscrire un nouvel utilisateur.
   * @param {SignupDto} data - les données de l'utilisateur.
   * @returns {Promise<AuthResponse>} - le token JWT et les données de l'utilisateur.
   * @throws {ConflictException} - si l'utilisateur existe deja.
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
   * @param {LoginDto} data - les données de connexion de l'utilisateur.
   * @returns {Promise<AuthResponse>} - le token JWT et les données de l'utilisateur.
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
   * @returns {Promise<User>} - le profil de l'utilisateur.
   * @throws {UnauthorizedException} - si l'utilisateur n'est pas connecté.
   */
  async getMe(): Promise<User> {
    const token = this.getToken()
    return apiClient.get<User>(`${this.endpoint}/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
  }

  async getFullProfile(): Promise<User> {
    const token = this.getToken()
    return apiClient.get<User>(`${this.endpoint}/profile`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
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
   * @returns {string | null} - le token JWT si existant, null sinon.
   */
  getToken(): string | null {
    return localStorage.getItem('access_token')
  }

  /**
   * Récupère l'utilisateur stocké localement.
   * @returns {User | null} - l'utilisateur si existant, null sinon.
   */
  getUser(): User | null {
    const userStr = localStorage.getItem('user')
    return userStr ? JSON.parse(userStr) : null
  }

  /**
   * Vérifie si l'utilisateur est connecté.
   * @returns {boolean} - true si l'utilisateur est connecté, false sinon.
   */
  isAuthenticated(): boolean {
    return !!this.getToken()
  }
}

export const authService = new AuthService()
