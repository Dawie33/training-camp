'use client'

import { Button } from '@/components/ui/button'
import { useWorkoutSession } from '@/app/tracking/hooks/useWorkoutSession'
import { useWorkoutSchedule } from '@/app/calendar/hooks/useWorkoutSchedule'
import { workoutsService } from '@/lib/api/workouts'
import { Workouts } from '@/lib/types/workout'
import { motion } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'

interface DayWorkout {
  id: string
  name: string
  type: 'scheduled' | 'completed' | 'rest'
  intensity?: 'low' | 'medium' | 'high'
  duration?: number
}

interface WeekDay {
  date: Date
  dayName: string
  dayNumber: number
  isToday: boolean
  workouts: DayWorkout[]
}

export function WeeklyCalendar() {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
  const { workoutSessions } = useWorkoutSession()
  const { schedules } = useWorkoutSchedule()
  const [workoutsDetails, setWorkoutsDetails] = useState<Map<string, Workouts>>(new Map())

  // Récupérer les détails des workouts
  useEffect(() => {
    const fetchWorkoutDetails = async () => {
      const allWorkoutIds = new Set<string>()

      // Ajouter les IDs des sessions
      if (workoutSessions && workoutSessions.length > 0) {
        workoutSessions.forEach(s => allWorkoutIds.add(s.workout_id))
      }

      // Ajouter les IDs des workouts planifiés
      if (schedules && schedules.length > 0) {
        schedules.forEach(s => allWorkoutIds.add(s.workout_id))
      }

      if (allWorkoutIds.size === 0) return

      const details = new Map<string, Workouts>()

      await Promise.all(
        Array.from(allWorkoutIds).map(async (workoutId) => {
          try {
            const workout = await workoutsService.getById(workoutId)
            details.set(workoutId, workout)
          } catch (error) {
            console.error(`Failed to fetch workout ${workoutId}:`, error)
          }
        })
      )

      setWorkoutsDetails(details)
    }

    fetchWorkoutDetails()
  }, [workoutSessions, schedules])

  // Génère les jours de la semaine avec les vraies données
  const weekDays = useMemo(() => {
    const today = new Date()
    const currentDay = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - currentDay + 1 + currentWeekOffset * 7)

    const days: WeekDay[] = []
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)

      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()

      // Récupérer les workouts pour ce jour
      const dateStr = date.toISOString().split('T')[0]
      const dayWorkouts: DayWorkout[] = []

      // 1. Ajouter les workouts depuis les sessions (complétés ou en cours)
      if (workoutSessions && workoutSessions.length > 0) {
        workoutSessions.forEach(session => {
          const sessionDate = new Date(session.started_at).toISOString().split('T')[0]

          if (sessionDate === dateStr) {
            const isCompleted = !!session.completed_at
            const duration = isCompleted && session.completed_at
              ? Math.floor((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 1000)
              : undefined

            // Récupérer le nom du workout depuis les détails
            const workoutDetail = workoutsDetails.get(session.workout_id)
            const workoutName = workoutDetail?.name || `Workout ${session.workout_id.substring(0, 8)}`

            // Récupérer l'intensité du workout
            let intensity: 'low' | 'medium' | 'high' | undefined
            if (workoutDetail?.intensity) {
              const intensityMap: { [key: string]: 'low' | 'medium' | 'high' } = {
                'low': 'low',
                'medium': 'medium',
                'high': 'high',
                'faible': 'low',
                'moyen': 'medium',
                'intense': 'high'
              }
              intensity = intensityMap[workoutDetail.intensity.toLowerCase()]
            }

            dayWorkouts.push({
              id: session.id,
              name: workoutName,
              type: isCompleted ? 'completed' : 'scheduled',
              duration,
              intensity
            })
          }
        })
      }

      // 2. Ajouter les workouts planifiés (qui n'ont pas encore de session)
      if (schedules && schedules.length > 0) {
        schedules.forEach(schedule => {
          // Convertir la date du schedule en heure locale puis extraire la partie date
          const scheduleDateObj = new Date(schedule.scheduled_date)
          const scheduleDate = new Date(scheduleDateObj.getTime() - scheduleDateObj.getTimezoneOffset() * 60000)
            .toISOString()
            .split('T')[0]

          if (scheduleDate === dateStr) {
            // Vérifier si ce workout planifié a déjà une session (pour éviter les doublons)
            const hasSession = workoutSessions?.some(
              session =>
                session.workout_id === schedule.workout_id &&
                new Date(session.started_at).toISOString().split('T')[0] === dateStr
            )

            // Si le schedule est marqué comme "completed" ou s'il a déjà une session, ne pas l'afficher
            if (!hasSession && schedule.status === 'scheduled') {
              // Utiliser les données du schedule qui incluent déjà workout_name
              const workoutName = schedule.workout_name || `Workout ${schedule.workout_id.substring(0, 8)}`

              // Récupérer l'intensité du workout
              let intensity: 'low' | 'medium' | 'high' | undefined
              if (schedule.intensity) {
                const intensityMap: { [key: string]: 'low' | 'medium' | 'high' } = {
                  'low': 'low',
                  'medium': 'medium',
                  'high': 'high',
                  'faible': 'low',
                  'moyen': 'medium',
                  'intense': 'high'
                }
                intensity = intensityMap[schedule.intensity.toLowerCase()]
              }

              dayWorkouts.push({
                id: schedule.id,
                name: workoutName,
                type: 'scheduled',
                duration: schedule.estimated_duration,
                intensity
              })
            }
          }
        })
      }

      days.push({
        date,
        dayName: dayNames[i],
        dayNumber: date.getDate(),
        isToday,
        workouts: dayWorkouts
      })
    }

    return days
  }, [currentWeekOffset, workoutSessions, schedules, workoutsDetails])

  const currentMonth = weekDays[3].date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const getWorkoutTypeStyle = (type: string) => {
    switch (type) {
      case 'completed':
        return 'bg-green-500/10 border-green-500/50'
      case 'scheduled':
        return 'bg-blue-500/10 border-blue-500/50'
      case 'rest':
        return 'bg-purple-500/10 border-purple-500/50'
      default:
        return 'bg-muted border-border'
    }
  }

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-base sm:text-lg font-semibold">Planning hebdomadaire</h3>
            <p className="text-xs sm:text-sm text-muted-foreground capitalize">{currentMonth}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentWeekOffset(prev => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8"
            onClick={() => setCurrentWeekOffset(0)}
          >
            Aujourd'hui
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentWeekOffset(prev => prev + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((day, index) => {
          const hasWorkouts = day.workouts.length > 0
          const firstWorkout = hasWorkouts ? day.workouts[0] : null

          return (
            <motion.div
              key={`${day.date.toISOString()}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                relative rounded-lg border p-2 sm:p-3 min-h-[80px] sm:min-h-[100px]
                transition-all cursor-pointer
                ${day.isToday ? 'ring-2 ring-primary bg-primary/5' : 'bg-card'}
                ${hasWorkouts && firstWorkout ? getWorkoutTypeStyle(firstWorkout.type) : 'hover:bg-accent'}
              `}
            >
              {/* Day Header */}
              <div className="flex flex-col items-center mb-2">
                <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                  {day.dayName}
                </span>
                <span className={`
                  text-sm sm:text-base font-bold mt-0.5
                  ${day.isToday ? 'text-primary' : 'text-foreground'}
                `}>
                  {day.dayNumber}
                </span>
              </div>

              {/* Workout Info */}
              {hasWorkouts ? (
                <div className="space-y-1">
                  {day.workouts.slice(0, 2).map((workout, idx) => (
                    <div key={workout.id} className="space-y-0.5">
                      <div className={`
                        text-[9px] sm:text-xs font-medium line-clamp-1 text-center
                        ${workout.type === 'completed' ? 'text-green-700 dark:text-green-400' : ''}
                        ${workout.type === 'scheduled' ? 'text-blue-700 dark:text-blue-400' : ''}
                        ${workout.type === 'rest' ? 'text-purple-700 dark:text-purple-400' : ''}
                      `}>
                        {workout.name}
                      </div>
                      <div className="flex items-center justify-center gap-1">
                        {workout.duration && (
                          <div className="text-[8px] sm:text-[10px] text-center text-muted-foreground">
                            {Math.floor(workout.duration / 60)}min
                          </div>
                        )}
                        {workout.intensity && (
                          <div className={`
                            text-[7px] sm:text-[9px] px-1 py-0.5 rounded font-medium
                            ${workout.intensity === 'low' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                            ${workout.intensity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                            ${workout.intensity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                          `}>
                            {workout.intensity === 'low' && '●'}
                            {workout.intensity === 'medium' && '●●'}
                            {workout.intensity === 'high' && '●●●'}
                          </div>
                        )}
                      </div>
                      {idx < Math.min(day.workouts.length - 1, 1) && (
                        <div className="h-px bg-border my-0.5" />
                      )}
                    </div>
                  ))}
                  {day.workouts.length > 2 && (
                    <div className="text-[8px] text-center text-muted-foreground mt-1">
                      +{day.workouts.length - 2} autre{day.workouts.length > 3 ? 's' : ''}
                    </div>
                  )}
                </div>
              ) : null}

              {/* Today Indicator */}
              {day.isToday && (
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t flex flex-wrap items-center justify-between gap-3 sm:gap-4">
        <div className="flex flex-wrap gap-3 sm:gap-4">
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded bg-blue-500/10 border border-blue-500/50" />
            <span className="text-muted-foreground">Programmé</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded bg-green-500/10 border border-green-500/50" />
            <span className="text-muted-foreground">Complété</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-3 h-3 rounded bg-purple-500/10 border border-purple-500/50" />
            <span className="text-muted-foreground">Repos</span>
          </div>
        </div>
        <Link href="/calendar">
          <Button variant="ghost" size="sm" className="text-xs">
            Voir le calendrier complet
          </Button>
        </Link>
      </div>
    </div>
  )
}
