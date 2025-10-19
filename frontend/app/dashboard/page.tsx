'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { SportCarousel } from '@/components/sport/SportCarousel'
import { SportDetails } from '@/components/sport/SportDetails'
import { useSport } from '@/contexts/SportContext'
import { useAllSports } from '@/hooks/useAllSports'
import { Sport } from '@/lib/types/sport'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { DailyWorkoutCard } from './components/DailyWorkoutCard'
import { PlanSelection } from './components/PlanSelection'
import { RecommendedWorkouts } from './components/RecommendedWorkouts'
import { Stats } from './components/Stats'

function DashboardContent() {
  const { activeSport, setActiveSport } = useSport()
  const { sports, loading, error } = useAllSports()


  const [selectedSportForDetails, setSelectedSportForDetails] = useState<Sport | null>(null)

  // Sélectionner automatiquement le sport actif ou le premier sport au chargement
  useEffect(() => {
    if (sports.length > 0 && !selectedSportForDetails) {
      // Si un sport actif existe, l'utiliser, sinon prendre le premier
      const sportToSelect = activeSport || sports[0]
      setSelectedSportForDetails(sportToSelect)

      // Si aucun sport n'était actif, définir le premier comme actif
      if (!activeSport) {
        setActiveSport(sports[0])
      }
    }
  }, [sports, selectedSportForDetails, activeSport, setActiveSport])

  // Gérer la sélection d'un sport
  const handleSportSelect = (sport: Sport) => {
    if (selectedSportForDetails?.id === sport.id) {
      // Si on clique sur le sport déjà sélectionné, on le désélectionne
      setSelectedSportForDetails(null)
    } else {
      // Sinon, on sélectionne le nouveau sport
      setSelectedSportForDetails(sport)
      // On le définit comme sport actif
      setActiveSport(sport)
    }
  }

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

  // Afficher un message si aucun sport n'est disponible
  if (!activeSport && sports.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Aucun sport disponible</h2>
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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-14">
        {/* Hero Section - Carousel de sports */}
        <section>
          <SportCarousel
            sports={sports}
            selectedSportId={selectedSportForDetails?.id || activeSport?.id}
            onSportSelect={handleSportSelect}
            title="Choisissez votre sport"
            description="Sélectionnez un sport pour voir plus de détails et accéder aux workouts"
            variant="default"
          />
        </section>

        {/* Sport Details - Section dépliable */}
        {selectedSportForDetails && (
          <section>
            <SportDetails sport={selectedSportForDetails} isExpanded={true} />
          </section>
        )}

        {/* Stats - Vue d'ensemble */}
        {activeSport && (
          <section>
            <Stats />
          </section>
        )}

        {/* Workout du jour */}
        {activeSport && (
          <section>
            <DailyWorkoutCard />
          </section>
        )}

        {/* Workouts recommandés */}
        {activeSport && (
          <section>
            <RecommendedWorkouts />
          </section>
        )}

        {/* Plan de l'utilisateur */}
        {activeSport && (
          <section className="bg-card rounded-lg border overflow-hidden">
            <PlanSelection />
          </section>
        )}
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
