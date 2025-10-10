'use client'

import { authService } from '@/lib/api'
import type { LoginDto, SignupDto, User } from '@/lib/types/auth'
import { AuthContext } from '@/hooks/useAuth'
import { ReactNode, useEffect, useState } from 'react'

/**
* Contexte qui fournit l'état et les fonctions liés à l'authentification.
*
* Il utilise `authService` pour vérifier si l'utilisateur est authentifié au montage, et
* pour se connecter, s'inscrire et se déconnecter.
*
* Il expose les propriétés suivantes à ses enfants :
* - `user` : L'utilisateur actuellement authentifié.
* - `loading` : Un booléen indiquant si la vérification d'authentification est en cours.
* - `login` : Une fonction qui connecte l'utilisateur.
* - `signup` : Une fonction qui inscrit l'utilisateur.
* - `logout` : Une fonction qui déconnecte l'utilisateur.
* - `isAuthenticated` : Un booléen indiquant si l'utilisateur est authentifié.
*/
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté au chargement
    const checkAuth = async () => {
      try {
        const token = authService.getToken()
        if (token) {
          const currentUser = await authService.getMe()
          setUser(currentUser)
        }
      } catch (error) {
        console.error('Error checking authentication:', error)
        authService.logout()
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  /**
   * Connecte l'utilisateur.
   * @param {LoginDto} data - les données de connexion de l'utilisateur.
   * @returns {Promise<void>} - La promesse qui se résout quand l'utilisateur est connecté.
   */
  const login = async (data: LoginDto) => {
    const response = await authService.login(data)
    setUser(response.user)
  }

  /**
   * Inscrire un nouvel utilisateur.
   * @param {SignupDto} data - les données de l'utilisateur.
   * @returns {Promise<void>} - La promesse qui se résout quand l'utilisateur est inscrit.
   */
  const signup = async (data: SignupDto) => {
    const response = await authService.signup(data)
    setUser(response.user)
  }

  /**
   * Déconnecte l'utilisateur en supprimant le token JWT et les données de l'utilisateur stockées localement.
   * @returns {void}
   */
  const logout = () => {
    authService.logout()
    setUser(null)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {loading ? (
        <div className="flex min-h-screen items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}
