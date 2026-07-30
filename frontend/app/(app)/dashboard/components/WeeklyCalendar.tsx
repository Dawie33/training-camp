'use client'

import { useWorkoutSchedule } from '@/app/(app)/calendar/_hooks/useWorkoutSchedule'
import { useWorkoutSession } from '@/app/(app)/tracking/_hooks/useWorkoutSession'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMemo, useState } from 'react'
import { DayWorkout, WeekDay } from './types'



export function WeeklyCalendar() {
  const router = useRouter()
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)
  const { workoutSessions } = useWorkoutSession()
  const { schedules } = useWorkoutSchedule()

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

      const dateStr = date.toISOString().split('T')[0]
      const dayWorkouts: DayWorkout[] = []

      // Sessions complétées
      if (workoutSessions && workoutSessions.length > 0) {
        workoutSessions.forEach(session => {
          const sessionDate = new Date(session.started_at).toISOString().split('T')[0]

          if (sessionDate === dateStr) {
            const isCompleted = !!session.completed_at
            const duration = isCompleted && session.completed_at
              ? Math.floor((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 1000)
              : undefined

            const workoutName = session.workout_name || `Workout ${(session.workout_id ?? session.id).substring(0, 8)}`
            const intensity: 'low' | 'medium' | 'high' | undefined = undefined

            dayWorkouts.push({
              id: session.id,
              workoutId: session.workout_id ?? undefined,
              name: workoutName,
              type: isCompleted ? 'completed' : 'scheduled',
              duration,
              intensity
            })
          }
        })
      }

      // Workouts planifiés sans session
      if (schedules && schedules.length > 0) {
        schedules.forEach(schedule => {
          const scheduleDateObj = new Date(schedule.scheduled_date)
          const scheduleDate = new Date(scheduleDateObj.getTime() - scheduleDateObj.getTimezoneOffset() * 60000)
            .toISOString()
            .split('T')[0]

          if (scheduleDate === dateStr) {
            const hasSession = workoutSessions?.some(
              session =>
                session.workout_id === schedule.workout_id &&
                new Date(session.started_at).toISOString().split('T')[0] === dateStr
            )

            if (!hasSession && schedule.status === 'scheduled') {
              const workoutName = schedule.workout_name || `Workout ${schedule.workout_id?.substring(0, 8) ?? 'unknown'}`

              let intensity: 'low' | 'medium' | 'high' | undefined
              if (schedule.intensity) {
                const intensityMap: { [key: string]: 'low' | 'medium' | 'high' } = {
                  'low': 'low', 'medium': 'medium', 'high': 'high',
                  'faible': 'low', 'moyen': 'medium', 'intense': 'high'
                }
                intensity = intensityMap[schedule.intensity.toLowerCase()]
              }

              dayWorkouts.push({
                id: schedule.id,
                workoutId: schedule.workout_id ?? undefined,
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
  }, [currentWeekOffset, workoutSessions, schedules])

  const currentMonth = weekDays[3].date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const handleDayClick = () => {
    router.push('/calendar')
  }

  return (
    <div className="h-full">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-3">
        <span className="eyebrow">Planning hebdomadaire</span>
        <span className="eyebrow capitalize">{currentMonth}</span>
      </div>
      <div className="rule-strong mb-5" />
      <div className="flex items-center justify-end gap-2 mb-5">
        <button
          className="p-2 rounded-md border border-border hover:bg-secondary transition-colors"
          onClick={() => setCurrentWeekOffset(prev => prev - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span
          className="px-4 py-2 rounded-md border border-border text-sm cursor-pointer hover:bg-secondary transition-colors"
          onClick={() => setCurrentWeekOffset(0)}
        >
          Aujourd&apos;hui
        </span>
        <button
          className="p-2 rounded-md border border-border hover:bg-secondary transition-colors"
          onClick={() => setCurrentWeekOffset(prev => prev + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day, index) => {
          const hasWorkouts = day.workouts.length > 0
          const isRest = hasWorkouts && day.workouts[0]?.type === 'rest'
          const hasCompleted = day.workouts.some(w => w.type === 'completed')
          const hasScheduled = day.workouts.some(w => w.type === 'scheduled')

          return (
            <motion.div
              key={`${day.date.toISOString()}-${index}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleDayClick()}
              className={`
                relative p-3 rounded-lg text-center transition-all duration-300 cursor-pointer min-h-[100px]
                ${day.isToday
                  ? 'bg-primary/10 border-2 border-primary'
                  : isRest
                    ? 'bg-secondary border border-border'
                    : 'bg-card border border-border hover:border-foreground/25'}
              `}
            >
              {/* Today indicator */}
              {day.isToday && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-pulse" />
              )}

              {/* Day Header */}
              <div className="flex flex-col items-center mb-2">
                <p className="eyebrow mb-1">{day.dayName}</p>
                <p className={`font-display text-xl font-semibold ${day.isToday ? 'text-primary' : ''}`}>
                  {day.dayNumber}
                </p>
              </div>

              {/* Workout badges */}
              {isRest && (
                <span className="inline-block mt-1 px-1.5 py-0.5 text-xs bg-secondary text-muted-foreground rounded-md">
                  Repos
                </span>
              )}
              {hasWorkouts && !isRest && (
                <div className="space-y-1 mt-1">
                  {day.workouts.slice(0, 2).map((workout) => (
                    workout.workoutId ? (
                      <Link
                        key={workout.id}
                        href={`/workout/${workout.workoutId}`}
                        onClick={e => e.stopPropagation()}
                        className={`
                          block text-xs font-medium px-1.5 py-1 rounded-md text-left leading-tight
                          ${workout.type === 'completed'
                            ? 'bg-secondary text-foreground hover:bg-border'
                            : 'bg-primary/10 text-primary hover:bg-primary/20'}
                        `}
                      >
                        <span className="line-clamp-2">{workout.name}</span>
                      </Link>
                    ) : (
                      <div
                        key={workout.id}
                        className={`
                          text-xs font-medium px-1.5 py-1 rounded-md text-left leading-tight
                          ${workout.type === 'completed'
                            ? 'bg-secondary text-foreground'
                            : 'bg-primary/10 text-primary'}
                        `}
                      >
                        <span className="line-clamp-2">{workout.name}</span>
                      </div>
                    )
                  ))}
                  {day.workouts.length > 2 && (
                    <div className="text-xs text-muted-foreground mt-0.5">
                      +{day.workouts.length - 2}
                    </div>
                  )}
                </div>
              )}

              {/* Status dots */}
              {hasWorkouts && !isRest && (
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
                  {hasCompleted && <div className="w-1.5 h-1.5 rounded-full bg-foreground" />}
                  {hasScheduled && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                </div>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-6 mt-5 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
          <span className="text-xs text-muted-foreground">Planifié</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-foreground" />
          <span className="text-xs text-muted-foreground">Complété</span>
        </div>
        <Link href="/calendar" className="ml-auto text-sm text-primary hover:opacity-80 transition-opacity">
          Calendrier complet →
        </Link>
      </div>
    </div>
  )
}
