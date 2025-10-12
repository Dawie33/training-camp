'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useSport } from '@/contexts/SportContext'
import Link from 'next/link'
import { DailyWorkoutCard } from './components/DailyWorkoutCard'
import { PlanSelection } from './components/PlanSelection'
import { RecommendedWorkouts } from './components/RecommendedWorkouts'
import { Stats } from './components/Stats'
import { useUserSports } from './hooks/useUserSports'

function DashboardContent() {
  const { activeSport } = useSport()
  const { loading, error } = useUserSports()

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
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-12">
        <section>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <DailyWorkoutCard />
            <Stats />
          </div>
        </section>
        <section>
          <RecommendedWorkouts />
        </section>
        <section className="bg-card rounded-lg border overflow-hidden">
          <PlanSelection />
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
