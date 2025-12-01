'use client'

/* eslint-disable react-refresh/only-export-components */
import { FloatingTimer } from '@/components/workout/timers/floatingTimer'
import { WorkoutTimerProvider } from '@/contexts/WorkoutTimerContext'
import type { Sport } from '@/domain/entities/sport'
import { usePathname } from 'next/navigation'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'

interface SportContextType {
  activeSport: Sport | null
  setActiveSport: (sport: Sport | null) => void
  loading: boolean
}

const SportContext = createContext<SportContextType | undefined>(undefined)

/**
* Fournit le contexte sportif aux composants enfants.
* Ce composant est responsable de la gestion de l'état du contexte sportif,
* incluant le sport actif, les sports de l'utilisateur et l'état de chargement.
* Il fournit également des fonctions pour mettre à jour le sport actif et les sports de l'utilisateur.
*/
export function SportProvider({ children }: { children: ReactNode }) {
  const [activeSport, setActiveSportState] = useState<Sport | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()

  // Pages où le timer ne doit pas être affiché
  const hideTimerOnPages = ['/login', '/onboarding']
  const shouldShowTimer = !hideTimerOnPages.includes(pathname)

  // Charger le sport actif depuis localStorage au montage
  useEffect(() => {
    try {
      const savedSport = localStorage.getItem('active_sport')
      if (savedSport) {
        const parsed = JSON.parse(savedSport)
        // Vérifier que c'est bien un objet Sport valide
        if (parsed && typeof parsed === 'object' && 'id' in parsed) {
          setActiveSportState(parsed)
        } else {
          // Format invalide, nettoyer le localStorage
          localStorage.removeItem('active_sport')
        }
      }
    } catch (error) {
      // Erreur de parsing, nettoyer le localStorage
      console.error('Erreur lors du chargement du sport actif:', error)
      localStorage.removeItem('active_sport')
    } finally {
      setLoading(false)
    }
  }, [])

  // Fonction pour changer de sport actif
  const setActiveSport = (sport: Sport | null) => {
    setActiveSportState(sport)
    if (sport) {
      localStorage.setItem('active_sport', JSON.stringify(sport))
    } else {
      localStorage.removeItem('active_sport')
    }
  }

  return (
    <SportContext.Provider
      value={{
        activeSport,
        setActiveSport,
        loading,
      }}
    >
      <WorkoutTimerProvider>
        {children}
        {shouldShowTimer && <FloatingTimer />}
      </WorkoutTimerProvider>
    </SportContext.Provider>
  )
}

/**
 * Récupère le context des sports.
 * @throws {Error} - Si le context n'est pas défini.
 * @returns {SportContextType} - Le context des sports.
 */
export function useSport() {
  const context = useContext(SportContext)
  if (context === undefined) {
    throw new Error('useSport must be used within a SportProvider')
  }
  return context
}
