'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { useSport } from '@/contexts/SportContext'
import { useAllSports } from '@/hooks/useAllSports'
import { useAuth } from '@/hooks/useAuth'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useEffect } from 'react'
import { DailyWorkoutCard } from './components/DailyWorkoutCard'
import { GoalsWidget } from './components/GoalsWidget'
import { PerformanceChart } from './components/PerformanceChart'
import { QuickActions } from './components/QuickActions'
import { QuickTips } from './components/QuickTips'
import { StatsCards } from './components/StatsCards'
import { WeeklyCalendar } from './components/WeeklyCalendar'

function DashboardContent() {
  const { activeSport, setActiveSport } = useSport()
  const { sports, loading, error } = useAllSports()
  const user = useAuth()

  // Sélectionner automatiquement le premier sport au chargement si aucun sport n'est actif
  useEffect(() => {
    if (sports.length > 0 && !activeSport) {
      setActiveSport(sports[0])
    }
  }, [sports, activeSport, setActiveSport])


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

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6">
        {/* Header - design Freeletics */}
        <motion.div variants={fadeInUp} className="pt-2 sm:pt-0">
          <h1 className="text-2xl sm:text-3xl font-black">Salut, {user?.user?.firstName || 'Champion'}</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Prêt à t'entraîner aujourd'hui ?</p>
        </motion.div>

        {/* Workout du jour */}
        <motion.div variants={fadeInUp}>
          <DailyWorkoutCard />
        </motion.div>

        {/* Stats Cards */}
        <motion.div variants={fadeInUp}>
          <StatsCards />
        </motion.div>

        {/* Performance Chart & Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <motion.div variants={fadeInUp}>
            <PerformanceChart />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <QuickActions />
          </motion.div>
        </div>

        {/* Weekly Calendar */}
        <motion.div variants={fadeInUp}>
          <WeeklyCalendar />
        </motion.div>

        {/* Goals & Tips */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          <motion.div variants={fadeInUp}>
            <GoalsWidget />
          </motion.div>
          <motion.div variants={fadeInUp}>
            <QuickTips />
          </motion.div>
        </div>
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
