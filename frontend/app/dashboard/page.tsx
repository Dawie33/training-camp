'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useSport } from '@/contexts/SportContext'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, sportsService } from '@/lib/api'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface UserProfile {
  primary_sport?: string
  sports_practiced?: string | string[]
}

function DashboardContent() {
  const { user } = useAuth()
  const { activeSport, setUserSports } = useSport()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchUserSports = async () => {
      try {
        setLoading(true)

        // Récupérer le profil complet de l'utilisateur
        const token = localStorage.getItem('access_token')
        const profile = await apiClient.get<UserProfile>('/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` }
        })

        // Récupérer tous les sports disponibles
        const { rows: allSports } = await sportsService.getAll()

        // Filtrer les sports de l'utilisateur basé sur son primary_sport et sports_practiced
        const userSportSlugs: string[] = []
        if (profile.primary_sport) {
          userSportSlugs.push(profile.primary_sport)
        }
        if (profile.sports_practiced) {
          const practiced = typeof profile.sports_practiced === 'string'
            ? JSON.parse(profile.sports_practiced)
            : profile.sports_practiced
          userSportSlugs.push(...practiced)
        }

        // Filtrer les doublons
        const uniqueSlugs = Array.from(new Set(userSportSlugs))

        // Trouver les sports correspondants
        const userSportsList = allSports.filter(sport =>
          uniqueSlugs.includes(sport.slug)
        )

        setUserSports(userSportsList)
      } catch (err) {
        console.error('Error fetching user sports:', err)
        setError(err instanceof Error ? err.message : 'Erreur dans la récupération des sports')
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      fetchUserSports()
    }
  }, [user, setUserSports])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Chargement...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">Error: {error}</div>
      </div>
    )
  }

  if (!activeSport) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Aucun sport sélectionné</h2>
          <p className="text-muted-foreground">Complète ton profil pour commencer</p>
          <Link
            href="/onboarding"
            className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
          >
            Compléter mon profil
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <span className="text-4xl">{activeSport.icon}</span>
          Dashboard {activeSport.name}
        </h1>
        <p className="text-muted-foreground mt-2">{activeSport.description}</p>
      </div>

      {/* Section Workouts du jour */}
      <div className="grid gap-6">
        <div className="border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Workout du jour</h2>
          <p className="text-muted-foreground">Aucun workout disponible pour le moment</p>
        </div>

        {/* Section Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Workouts complétés</h3>
            <p className="text-2xl font-bold mt-2">0</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Progression</h3>
            <p className="text-2xl font-bold mt-2">0%</p>
          </div>
          <div className="border rounded-lg p-4">
            <h3 className="text-sm font-medium text-muted-foreground">Niveau</h3>
            <p className="text-2xl font-bold mt-2">Débutant</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
