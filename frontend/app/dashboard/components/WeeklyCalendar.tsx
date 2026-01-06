'use client'

import { useWorkoutSchedule } from '@/app/calendar/hooks/useWorkoutSchedule'
import { useWorkoutSession } from '@/app/tracking/hooks/useWorkoutSession'
import { Workouts } from '@/domain/entities/workout'
import { workoutsService } from '@/services/workouts'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { DayWorkout, WeekDay } from './types'



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

  return (
    <div className="h-full rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold">Planning hebdomadaire</h3>
          <p className="text-sm text-slate-400 capitalize">{currentMonth}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            onClick={() => setCurrentWeekOffset(prev => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span
            className="px-4 py-2 rounded-lg bg-white/5 text-sm cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => setCurrentWeekOffset(0)}
          >
            Aujourd'hui
          </span>
          <button
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            onClick={() => setCurrentWeekOffset(prev => prev + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-3">
        {weekDays.map((day, index) => {
          const hasWorkouts = day.workouts.length > 0
          const firstWorkout = hasWorkouts ? day.workouts[0] : null
          const isRest = hasWorkouts && firstWorkout?.type === 'rest'

          return (
            <motion.div
              key={`${day.date.toISOString()}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`
                relative p-4 rounded-2xl text-center transition-all duration-300 cursor-pointer min-h-[100px]
                ${day.isToday
                  ? 'bg-gradient-to-br from-orange-500/20 to-rose-500/20 border-2 border-orange-500/50 shadow-lg shadow-orange-500/20'
                  : isRest
                    ? 'bg-emerald-500/10 border border-emerald-500/20'
                    : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20'}
              `}
            >
              {/* Today indicator */}
              {day.isToday && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
              )}

              {/* Day Header */}
              <div className="flex flex-col items-center mb-2">
                <p className="text-xs text-slate-400 mb-1">{day.dayName}</p>
                <p className={`text-2xl font-bold ${day.isToday ? 'text-orange-400' : ''}`}>
                  {day.dayNumber}
                </p>
              </div>

              {/* Workout Info */}
              {isRest && (
                <span className="inline-block mt-2 px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 rounded-full">
                  Repos
                </span>
              )}
              {hasWorkouts && !isRest && (
                <div className="space-y-1 mt-2">
                  {day.workouts.slice(0, 1).map((workout) => (
                    <div key={workout.id} className="text-xs text-slate-300 font-medium line-clamp-2">
                      {workout.name}
                    </div>
                  ))}
                  {day.workouts.length > 1 && (
                    <div className="text-xs text-slate-500">
                      +{day.workouts.length - 1} autre{day.workouts.length > 2 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-white/20" />
          <span className="text-sm text-slate-400">Programmé</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400" />
          <span className="text-sm text-slate-400">Complété</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-emerald-400/30" />
          <span className="text-sm text-slate-400">Repos</span>
        </div>
        <Link href="/calendar" className="ml-auto text-sm text-orange-400 hover:text-orange-300 transition-colors">
          Voir le calendrier complet →
        </Link>
      </div>
    </div>
  )
}
