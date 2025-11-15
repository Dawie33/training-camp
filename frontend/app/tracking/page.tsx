'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Card } from '@/components/ui/card'

import { fadeInUp, staggerContainer } from '@/lib/animations'
import { WorkoutStats } from '@/lib/types/workout-history'
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
import { PersonalRecords } from './components/PersonalRecords'
import { ProgressChart } from './components/ProgressChart'
import { StatsCard } from './components/StatsCard'
import { WorkoutHistoryList } from './components/WorkoutHistoryList'
import { useWorkoutSession } from './hooks/useWorkoutSession'

function TrackingContent() {
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null)
  const { workoutSessions } = useWorkoutSession()

  // Calculer les stats à partir des sessions
  useEffect(() => {
    if (!workoutSessions || workoutSessions.length === 0) {
      setWorkoutStats(null)
      return
    }

    const completedSessions = workoutSessions.filter(s => s.completed_at)

    // Total workouts
    const totalWorkouts = completedSessions.length

    // Durée totale (en secondes)
    const totalDuration = completedSessions.reduce((acc, session) => {
      const duration = (new Date(session.completed_at!).getTime() - new Date(session.started_at).getTime()) / 1000
      return acc + duration
    }, 0)

    // Durée cette semaine
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const totalDurationThisWeek = completedSessions
      .filter(s => new Date(s.started_at) >= oneWeekAgo)
      .reduce((acc, session) => {
        const duration = (new Date(session.completed_at!).getTime() - new Date(session.started_at).getTime()) / 1000
        return acc + duration
      }, 0)

    // Calculer les workouts par jour (30 derniers jours)
    const workoutsByDay = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const nextDay = new Date(date)
      nextDay.setDate(nextDay.getDate() + 1)

      const dayWorkouts = completedSessions.filter(s => {
        const sessionDate = new Date(s.started_at)
        return sessionDate >= date && sessionDate < nextDay
      })

      const count = dayWorkouts.length
      const duration = dayWorkouts.reduce((acc, session) => {
        return acc + Math.floor((new Date(session.completed_at!).getTime() - new Date(session.started_at).getTime()) / 1000)
      }, 0)

      workoutsByDay.push({
        date: date.toISOString().split('T')[0],
        count,
        duration
      })
    }

    // Calculer le streak
    const sortedDates = [...new Set(completedSessions.map(s => new Date(s.started_at).toISOString().split('T')[0]))].sort().reverse()

    let currentStreak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (let i = 0; i <= 365; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(checkDate.getDate() - i)
      const dateStr = checkDate.toISOString().split('T')[0]

      if (sortedDates.includes(dateStr)) {
        currentStreak++
      } else if (i > 0) {
        break
      }
    }

    const longestStreak = currentStreak

    // Durée ce mois
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    const totalDurationThisMonth = completedSessions
      .filter(s => new Date(s.started_at) >= oneMonthAgo)
      .reduce((acc, session) => {
        const duration = (new Date(session.completed_at!).getTime() - new Date(session.started_at).getTime()) / 1000
        return acc + duration
      }, 0)

    setWorkoutStats({
      totalWorkouts,
      totalDuration,
      totalDurationThisWeek,
      totalDurationThisMonth,
      currentStreak,
      longestStreak,
      workoutsByDay,
      workoutsByType: {
        FOR_TIME: 0,
        AMRAP: 0,
        EMOM: 0,
        TABATA: 0
      },
      personalRecords: [],
      averageDifficulty: 0,
      favoriteTimerType: 'FOR_TIME'
    })
  }, [workoutSessions])

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }
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
