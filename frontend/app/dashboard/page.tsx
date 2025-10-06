'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { WorkoutCard } from '@/components/workout/WorkoutCard'
import { useSport } from '@/contexts/SportContext'
import { useAuth } from '@/hooks/useAuth'
import { apiClient, sportsService, workoutsService, type DailyWorkout } from '@/lib/api'
import { getSportImage } from '@/lib/utils/sport-images'
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
  const [dailyWorkout, setDailyWorkout] = useState<DailyWorkout | null>(null)
  const [workoutLoading, setWorkoutLoading] = useState(false)

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

  // Récupérer le workout du jour quand le sport actif change
  useEffect(() => {
    const fetchDailyWorkout = async () => {
      if (!activeSport) return

      try {
        setWorkoutLoading(true)
        const date = new Date().toISOString().split('T')[0]
        const workout = await workoutsService.getDailyWorkout(activeSport.id, date)
        setDailyWorkout(workout)
      } catch (err) {
        console.error('Error fetching daily workout:', err)
        setDailyWorkout(null) // Pas de workout disponible
      } finally {
        setWorkoutLoading(false)
      }
    }

    fetchDailyWorkout()
  }, [activeSport])

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

  // Données de workouts mockées (à remplacer par des vraies données)
  const recommendedWorkouts = [
    {
      id: 1,
      title: 'HIIT Training #24',
      duration: '30 min',
      image: 'https://images.unsplash.com/photo-1549576490-b0b4831ef60a?w=800&q=80',
      category: 'WORKOUT',
      isNew: false
    },
    {
      id: 2,
      title: 'Core Strength #45',
      duration: '30 min',
      image: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80',
      category: 'WORKOUT',
      isNew: false
    },
    {
      id: 3,
      title: 'Cardio Blast #128',
      duration: '45 min',
      image: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80',
      category: 'NEW',
      isNew: true
    },
    {
      id: 4,
      title: 'Strength & Power',
      duration: '40 min',
      image: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80',
      category: 'WORKOUT',
      isNew: false
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        {/* Workout du jour + Stats */}
        <section>


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Workout principal du jour */}
            <div className="lg:col-span-2">
              {workoutLoading ? (
                <div className="aspect-[4/3] bg-card rounded-lg border border-border flex items-center justify-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : dailyWorkout ? (
                <Link href={`/workout/${dailyWorkout.id}`} className="block group">
                  <div className="relative aspect-[4/3] bg-card rounded-lg border border-border overflow-hidden cursor-pointer">
                    {/* Image de fond */}
                    <div
                      className="absolute inset-0 bg-cover bg-center transition-transform duration-300 group-hover:scale-105"
                      style={{
                        backgroundImage: `url(${getSportImage(activeSport?.slug || 'default', dailyWorkout.id)})`,
                      }}
                    />
                    {/* Overlay gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                    {/* Contenu */}
                    <div className="absolute inset-0 p-6 flex flex-col justify-between">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold px-2 py-1 bg-primary/90 text-primary-foreground rounded">
                            WORKOUT DU JOUR
                          </span>
                          <span className="text-sm text-white/90">{new Date(dailyWorkout.wod_date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        {dailyWorkout.blocks.duration_min && (
                          <span className="text-sm font-semibold px-2 py-1 bg-black/50 text-white rounded">
                            {dailyWorkout.blocks.duration_min} min
                          </span>
                        )}
                      </div>

                      <div>
                        <h2 className="text-3xl font-bold text-white mb-2">{activeSport?.name} Workout</h2>
                        {dailyWorkout.blocks.stimulus && (
                          <p className="text-white/90 text-sm mb-3">{dailyWorkout.blocks.stimulus}</p>
                        )}
                        {dailyWorkout.tags && dailyWorkout.tags.length > 0 && (
                          <div className="flex gap-2 flex-wrap">
                            {dailyWorkout.tags.map((tag, idx) => (
                              <span key={idx} className="text-xs px-2 py-1 bg-white/20 backdrop-blur-sm text-white rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ) : (
                <div className="aspect-[4/3] bg-card rounded-lg border border-border flex items-center justify-center text-center p-6">
                  <div>
                    <p className="text-lg font-semibold mb-2">Aucun workout disponible</p>
                    <p className="text-sm text-muted-foreground">Le workout du jour n'a pas encore été publié</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="space-y-4">
              <div
                className="bg-card rounded-lg p-6 border"

              >
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Workouts complétés</h3>
                <p className="text-4xl font-bold" >0</p>
              </div>
              <div
                className="bg-card rounded-lg p-6 border"

              >
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Temps total</h3>
                <p className="text-4xl font-bold" >0h</p>
              </div>
              <div
                className="bg-card rounded-lg p-6 border"

              >
                <h3 className="text-sm font-medium text-muted-foreground mb-2">Niveau</h3>
                <p className="text-4xl font-bold" >Débutant</p>
              </div>
            </div>
          </div>
        </section>

        {/* Workouts recommandés */}
        <section>
          <h2 className="text-3xl font-bold mb-6">Recommandé pour toi</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendedWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                title={workout.title}
                duration={workout.duration}
                image={workout.image}
                category={workout.category}
                isNew={workout.isNew}
              />
            ))}
          </div>
        </section>

        {/* Sélection du plan */}
        <section className="bg-card rounded-lg border overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* Image avec gradient du sport */}
            <div className="relative h-64 md:h-auto">
              <div
                className="absolute inset-0"

              />
              <div
                className="absolute inset-0 bg-cover bg-center opacity-40"
                style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=800&q=80)' }}
              />
            </div>

            {/* Contenu */}
            <div className="p-8 md:p-12 flex flex-col justify-center">
              <h2 className="text-3xl font-bold mb-4">Besoin d&apos;un plan ?</h2>
              <p className="text-muted-foreground mb-6">
                Choisis le programme optimal qui combine force, cardio et équilibre mental pour atteindre tes objectifs.
              </p>
              <Link
                href="/plans"
                className="inline-block px-6 py-3 rounded-full font-semibold transition-all w-fit"

              >
                Découvrir les plans
              </Link>
            </div>
          </div>
        </section>
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
