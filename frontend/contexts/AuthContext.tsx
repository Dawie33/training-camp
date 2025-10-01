'use client'

import { authService } from '@/lib/api'
import type { LoginDto, SignupDto, User } from '@/lib/types/auth'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (data: LoginDto) => Promise<void>
  signup: (data: SignupDto) => Promise<void>
  logout: () => void
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

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

  const login = async (data: LoginDto) => {
    const response = await authService.login(data)
    setUser(response.user)
  }

  const signup = async (data: SignupDto) => {
    const response = await authService.signup(data)
    setUser(response.user)
  }

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
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
