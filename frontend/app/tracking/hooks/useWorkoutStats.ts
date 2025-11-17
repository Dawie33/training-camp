import { WorkoutStats } from '@/lib/types/workout-history'
import { useEffect, useState } from 'react'
import { useWorkoutSession } from './useWorkoutSession'

/**
 * Hook personnalisé pour récupérer et calculer les statistiques des workouts
 * Utilisable dans le dashboard et la page tracking
 */
export function useWorkoutStats() {
  const [workoutStats, setWorkoutStats] = useState<WorkoutStats | null>(null)
  const { workoutSessions, loading } = useWorkoutSession()

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

    // Calculer le streak (série de jours consécutifs)
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

    // Calculer le nombre de workouts ce mois
    const workoutsThisMonth = completedSessions.filter(s => {
      const sessionDate = new Date(s.started_at)
      return sessionDate >= oneMonthAgo
    }).length

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
      favoriteTimerType: 'FOR_TIME',
      workoutsThisMonth
    })
  }, [workoutSessions])

  /**
   * Formate une durée en secondes en format lisible
   */
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  return {
    workoutStats,
    loading,
    formatDuration
  }
}
