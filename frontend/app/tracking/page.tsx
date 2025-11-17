'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card } from '@/components/ui/card'

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
import { PersonalRecords } from './components/PersonalRecords'
import { ProgressChart } from './components/ProgressChart'
import { StatsCard } from './components/StatsCard'
import { WorkoutHistoryList } from './components/WorkoutHistoryList'
import { useWorkoutStats } from './hooks/useWorkoutStats'

function TrackingContent() {
  const { workoutStats, formatDuration } = useWorkoutStats()
  return (
    <motion.div
      className="min-h-screen bg-background"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <motion.section variants={fadeInUp} className="space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">
            Suivi des performances
          </h1>
          <p className="text-muted-foreground text-lg">
            Analyse tes progrès et ton historique d'entraînement
          </p>
        </motion.section>

        {/* Stats Cards */}
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatsCard
            title="Total Workouts"
            value={workoutStats?.totalWorkouts ?? 0}
            icon={Activity}
            color="blue"
          />
          <StatsCard
            title="Temps Total"
            value={workoutStats ? formatDuration(workoutStats.totalDuration) : '0m'}
            icon={Clock}
            color="green"
          />
          <StatsCard
            title="Série Actuelle"
            value={workoutStats ? `${workoutStats.currentStreak} jours` : '0 jours'}
            icon={Flame}
            color="orange"
            subtitle={workoutStats ? `Record: ${workoutStats.longestStreak} jours` : undefined}
          />
          <StatsCard
            title="Cette Semaine"
            value={workoutStats ? formatDuration(workoutStats.totalDurationThisWeek) : '0m'}
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
            {workoutStats && workoutStats.workoutsByDay.length > 0 ? (
              <ProgressChart data={workoutStats.workoutsByDay} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <TrendingUp className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Complète tes premiers workouts pour voir ta progression
                </p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Statistiques détaillées */}
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Workouts par type */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Workouts par Type</h2>
            </div>
            {workoutStats && workoutStats.totalWorkouts > 0 ? (
              <div className="space-y-3">
                {Object.entries(workoutStats.workoutsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="font-medium">{type}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${(count / workoutStats.totalWorkouts) * 100}%`
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
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Zap className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Aucun workout complété pour le moment
                </p>
              </div>
            )}
          </Card>

          {/* Records personnels */}
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold">Records Personnels</h2>
            </div>
            {workoutStats && workoutStats.personalRecords.length > 0 ? (
              <PersonalRecords records={workoutStats.personalRecords} />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Trophy className="w-12 h-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Complète des workouts pour établir tes records
                </p>
              </div>
            )}
          </Card>
        </motion.div>

        {/* Historique complet */}
        <motion.div variants={fadeInUp}>
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-6">Historique Complet</h2>
            <WorkoutHistoryList />
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
