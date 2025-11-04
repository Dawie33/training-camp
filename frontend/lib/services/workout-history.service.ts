import { TimerType } from "@/hooks/useWorkoutTimer"
import { WorkoutResult, WorkoutStats } from "../types/workout-history"

const STORAGE_KEY = 'workout_history'

/**
 * Service pour gérer l'historique des workouts
 */
export class WorkoutHistoryService {
  /**
   * Sauvegarder un résultat de workout
   */
  static saveWorkoutResult(result: Omit<WorkoutResult, 'id' | 'createdAt' | 'updatedAt'>): WorkoutResult {
    const workoutResult: WorkoutResult = {
      ...result,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const history = this.getAllWorkouts()
    history.push(workoutResult)

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    }

    return workoutResult
  }

  /**
   * Récupérer tous les workouts
   */
  static getAllWorkouts(): WorkoutResult[] {
    if (typeof window === 'undefined') return []

    const data = localStorage.getItem(STORAGE_KEY)
    if (!data) return []

    try {
      return JSON.parse(data)
    } catch {
      return []
    }
  }

  /**
   * Récupérer les workouts par sport
   */
  static getWorkoutsBySport(sportId: string): WorkoutResult[] {
    return this.getAllWorkouts().filter(w => w.sportId === sportId)
  }

  /**
   * Récupérer les workouts par période
   */
  static getWorkoutsByDateRange(startDate: Date, endDate: Date): WorkoutResult[] {
    return this.getAllWorkouts().filter(w => {
      const workoutDate = new Date(w.date)
      return workoutDate >= startDate && workoutDate <= endDate
    })
  }

  /**
   * Récupérer les derniers N workouts
   */
  static getRecentWorkouts(limit: number = 10): WorkoutResult[] {
    return this.getAllWorkouts()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit)
  }

  /**
   * Calculer les statistiques globales
   */
  static getWorkoutStats(sportId?: string): WorkoutStats {
    const workouts = sportId
      ? this.getWorkoutsBySport(sportId)
      : this.getAllWorkouts()

    const now = new Date()
    const startOfWeek = new Date(now)
    startOfWeek.setDate(now.getDate() - now.getDay())
    startOfWeek.setHours(0, 0, 0, 0)

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const workoutsThisWeek = workouts.filter(w => new Date(w.date) >= startOfWeek)
    const workoutsThisMonth = workouts.filter(w => new Date(w.date) >= startOfMonth)

    // Calculer le streak actuel
    const sortedWorkouts = [...workouts].sort((a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    let currentStreak = 0
    let longestStreak = 0
    let tempStreak = 0
    let lastDate: Date | null = null

    sortedWorkouts.forEach(workout => {
      const workoutDate = new Date(workout.date)
      workoutDate.setHours(0, 0, 0, 0)

      if (!lastDate) {
        tempStreak = 1
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        if (workoutDate.getTime() === today.getTime() ||
            workoutDate.getTime() === today.getTime() - 86400000) {
          currentStreak = 1
        }
      } else {
        const diffDays = Math.floor((lastDate.getTime() - workoutDate.getTime()) / 86400000)

        if (diffDays === 1) {
          tempStreak++
          if (currentStreak > 0) currentStreak++
        } else {
          longestStreak = Math.max(longestStreak, tempStreak)
          tempStreak = 1
          currentStreak = 0
        }
      }

      lastDate = workoutDate
    })

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak)

    // Workouts par type
    const workoutsByType: Record<string, number> = {}
    workouts.forEach(w => {
      workoutsByType[w.timerType] = (workoutsByType[w.timerType] || 0) + 1
    })

    // Type favori
    const favoriteType = Object.entries(workoutsByType)
      .sort(([, a], [, b]) => b - a)[0]?.[0] as TimerType | undefined

    // Workouts par jour (30 derniers jours)
    const last30Days = new Date(now)
    last30Days.setDate(now.getDate() - 30)

    const workoutsByDay = Array.from({ length: 30 }, (_, i) => {
      const date = new Date(last30Days)
      date.setDate(last30Days.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]

      const dayWorkouts = workouts.filter(w =>
        w.date.startsWith(dateStr)
      )

      return {
        date: dateStr,
        count: dayWorkouts.length,
        duration: dayWorkouts.reduce((sum, w) => sum + w.duration, 0)
      }
    })

    // Records personnels
    const allPRs = workouts.flatMap(w => w.personalRecords || [])
    const prMap = new Map<string, { value: number, date: string }>()

    allPRs.forEach(pr => {
      const existing = prMap.get(pr.type)
      if (!existing || pr.value > existing.value) {
        prMap.set(pr.type, { value: pr.value, date: pr.type })
      }
    })

    const personalRecords = Array.from(prMap.entries()).map(([type, data]) => ({
      type,
      value: data.value,
      unit: allPRs.find(pr => pr.type === type)?.unit || '',
      date: data.date
    }))

    return {
      totalWorkouts: workouts.length,
      totalDuration: workouts.reduce((sum, w) => sum + w.duration, 0),
      totalDurationThisWeek: workoutsThisWeek.reduce((sum, w) => sum + w.duration, 0),
      totalDurationThisMonth: workoutsThisMonth.reduce((sum, w) => sum + w.duration, 0),
      currentStreak,
      longestStreak,
      averageDifficulty: workouts.length > 0
        ? workouts.reduce((sum, w) => {
            const diff = { easy: 1, medium: 2, hard: 3 }[w.difficulty]
            return sum + diff
          }, 0) / workouts.length
        : 0,
      favoriteTimerType: favoriteType || null,
      workoutsByType: workoutsByType as Record<TimerType, number>,
      workoutsByDay,
      personalRecords
    }
  }

  /**
   * Supprimer un workout
   */
  static deleteWorkout(id: string): boolean {
    const history = this.getAllWorkouts().filter(w => w.id !== id)

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
      return true
    }

    return false
  }

  /**
   * Mettre à jour un workout
   */
  static updateWorkout(id: string, updates: Partial<WorkoutResult>): WorkoutResult | null {
    const history = this.getAllWorkouts()
    const index = history.findIndex(w => w.id === id)

    if (index === -1) return null

    history[index] = {
      ...history[index],
      ...updates,
      updatedAt: new Date().toISOString()
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history))
    }

    return history[index]
  }
}
