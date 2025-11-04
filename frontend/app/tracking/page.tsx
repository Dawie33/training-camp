'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card } from '@/components/ui/card'
import { useSport } from '@/contexts/SportContext'
import { WorkoutHistoryService } from '@/lib/services/workout-history.service'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { motion } from 'framer-motion'
import {
  Activity,
  Calendar,
  Clock,
  Flame,
  TrendingUp,
  Trophy,
  Zap
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { WorkoutStats } from '@/lib/types/workout-history'
import { WorkoutHistoryList } from './components/WorkoutHistoryList'
import { ProgressChart } from './components/ProgressChart'
import { StatsCard } from './components/StatsCard'
import { PersonalRecords } from './components/PersonalRecords'

function TrackingContent() {
  const { activeSport } = useSport()
  const [stats, setStats] = useState<WorkoutStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (activeSport) {
      const workoutStats = WorkoutHistoryService.getWorkoutStats(activeSport.id)
      setStats(workoutStats)
      setLoading(false)
    }
  }, [activeSport])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
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

  if (!activeSport) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <h2 className="text-2xl font-bold">Aucun sport sélectionné</h2>
          <p className="text-muted-foreground">
            Sélectionnez un sport pour voir vos statistiques
          </p>
        </div>
      </div>
    )
  }

  if (!stats) return null

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div variants={fadeInUp} className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Suivi et Progression
          </h1>
          <p className="text-muted-foreground text-lg">
            {activeSport.name} - Analysez vos performances et suivez votre évolution
          </p>
        </motion.div>

        {/* Stats principales */}
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatsCard
            title="Total Workouts"
            value={stats.totalWorkouts}
            icon={Activity}
            color="blue"
          />
          <StatsCard
            title="Temps Total"
            value={formatDuration(stats.totalDuration)}
            icon={Clock}
            color="green"
          />
          <StatsCard
            title="Streak Actuel"
            value={`${stats.currentStreak} jours`}
            icon={Flame}
            color="orange"
            subtitle={`Record: ${stats.longestStreak} jours`}
          />
          <StatsCard
            title="Cette Semaine"
            value={formatDuration(stats.totalDurationThisWeek)}
            icon={Calendar}
            color="purple"
          />
        </motion.div>

        {/* Graphique de progression */}
        <motion.div variants={fadeInUp}>
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold">Progression (30 derniers jours)</h2>
            </div>
            <ProgressChart data={stats.workoutsByDay} />
          </Card>
        </motion.div>

        {/* Stats supplémentaires */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Timer favori */}
          <motion.div variants={fadeInUp}>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Workouts par Type</h2>
              </div>
              <div className="space-y-3">
                {Object.entries(stats.workoutsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="font-medium">{type}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${(count / stats.totalWorkouts) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Records personnels */}
          <motion.div variants={fadeInUp}>
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Trophy className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-bold">Records Personnels</h2>
              </div>
              <PersonalRecords records={stats.personalRecords} />
            </Card>
          </motion.div>
        </div>

        {/* Historique des workouts */}
        <motion.div variants={fadeInUp}>
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Historique Récent</h2>
            <WorkoutHistoryList sportId={activeSport.id} />
          </Card>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function TrackingPage() {
  return (
    <ProtectedRoute>
      <TrackingContent />
    </ProtectedRoute>
  )
}
