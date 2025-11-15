'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useSport } from '@/contexts/SportContext'
import { useAllSports } from '@/hooks/useAllSports'
import { useAuth } from '@/hooks/useAuth'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { WorkoutHistoryService } from '@/lib/services/workout-history.service'
import { WorkoutStats } from '@/lib/types/workout-history'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { PerformanceChart } from './components/PerformanceChart'
import { QuickActions } from './components/QuickActions'
import { RecommendedWorkouts } from './components/RecommendedWorkouts'
import { StatsCards } from './components/StatsCards'

function DashboardContent() {
  const { activeSport, setActiveSport } = useSport()
  const { sports, loading, error } = useAllSports()
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null)
  const user = useAuth()
  console.log('user', user)

  // Sélectionner automatiquement le premier sport au chargement si aucun sport n'est actif
  useEffect(() => {
    if (sports.length > 0 && !activeSport) {
      setActiveSport(sports[0])
    }
  }, [sports, activeSport, setActiveSport])

  // Charger les stats de workout
  useEffect(() => {
    if (activeSport) {
      const stats = WorkoutHistoryService.getWorkoutStats(activeSport.id)
      setWorkoutStats(stats)
    }
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

  // Afficher un message si aucun sport n'est disponible
  if (sports.length === 0) {
    return (
      <motion.div
        className="flex items-center justify-center min-h-screen"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="text-center space-y-4">
          <motion.h2 className="text-2xl font-bold" variants={fadeInUp}>
            Aucun sport disponible
          </motion.h2>
          <motion.p className="text-muted-foreground" variants={fadeInUp}>
            Complète ton profil pour commencer
          </motion.p>
          <motion.div variants={fadeInUp}>
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href="/onboarding"
                className="inline-block px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Compléter mon profil
              </Link>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  // Stats calculées depuis workoutStats
  const stats = {
    totalWorkouts: workoutStats?.totalWorkouts || 0,
    workoutsThisMonth: workoutStats?.workoutsByDay?.filter(w => {
      const date = new Date(w.date)
      const now = new Date()
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()
    }).length || 0,
    personalRecords: Array.isArray(workoutStats?.personalRecords) ? workoutStats.personalRecords.length : 0,
    totalHours: Math.round((workoutStats?.totalDuration || 0) / 60),
  }

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="p-8 space-y-8">
        {/* Header */}
        <motion.div variants={fadeInUp}>
          <h1 className="text-2xl font-bold">Salut, {user?.user?.firstName || 'Champion'}</h1>
          <p className="text-muted-foreground">Bienvenue sur ton tableau de bord</p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={fadeInUp}>
          <StatsCards stats={stats} />
        </motion.div>

        {/* Performance Chart & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <motion.div className="lg:col-span-2" variants={fadeInUp}>
            <PerformanceChart />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <QuickActions />
          </motion.div>
        </div>

        {/* Workouts recommandés */}
        {activeSport && (
          <motion.section variants={fadeInUp}>
            <RecommendedWorkouts />
          </motion.section>
        )}
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  )
}
