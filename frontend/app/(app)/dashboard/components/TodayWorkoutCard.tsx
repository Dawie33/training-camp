'use client'

import { useWorkoutSchedule } from '@/app/(app)/calendar/_hooks/useWorkoutSchedule'
import { useWorkoutSession } from '@/app/(app)/tracking/_hooks/useWorkoutSession'
import { CheckCircle2, Clock } from 'lucide-react'
import Link from 'next/link'
import { useMemo } from 'react'

interface TodayWorkout {
  id: string
  workoutId?: string
  name: string
  completed: boolean
  duration?: number
}

export function TodayWorkoutCard() {
  const { workoutSessions } = useWorkoutSession()
  const { schedules } = useWorkoutSchedule()

  const todayWorkout = useMemo<TodayWorkout | null>(() => {
    const todayStr = new Date().toISOString().split('T')[0]

    const sessionToday = workoutSessions?.find(
      session => new Date(session.started_at).toISOString().split('T')[0] === todayStr
    )

    if (sessionToday) {
      const isCompleted = !!sessionToday.completed_at
      const duration =
        isCompleted && sessionToday.completed_at
          ? Math.floor(
              (new Date(sessionToday.completed_at).getTime() - new Date(sessionToday.started_at).getTime()) / 1000
            )
          : undefined

      return {
        id: sessionToday.id,
        workoutId: sessionToday.workout_id ?? undefined,
        name: sessionToday.workout_name || `Workout ${(sessionToday.workout_id ?? sessionToday.id).substring(0, 8)}`,
        completed: isCompleted,
        duration
      }
    }

    const scheduleToday = schedules?.find(schedule => {
      const scheduleDateObj = new Date(schedule.scheduled_date)
      const scheduleDate = new Date(scheduleDateObj.getTime() - scheduleDateObj.getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0]

      return scheduleDate === todayStr && schedule.status === 'scheduled'
    })

    if (scheduleToday) {
      return {
        id: scheduleToday.id,
        workoutId: scheduleToday.workout_id ?? undefined,
        name: scheduleToday.workout_name || `Workout ${scheduleToday.workout_id?.substring(0, 8) ?? 'inconnu'}`,
        completed: false,
        duration: scheduleToday.estimated_duration
      }
    }

    return null
  }, [workoutSessions, schedules])

  return (
    <div>
      <div className="flex items-baseline justify-between mb-3">
        <span className="eyebrow">Aujourd&apos;hui</span>
        <Link href="/calendar" className="text-sm text-primary hover:opacity-80 transition-opacity">
          Calendrier complet →
        </Link>
      </div>
      <div className="rule-strong mb-5" />

      {todayWorkout ? (
        <div className="flex items-center justify-between gap-4 p-4 rounded-lg border border-border bg-card">
          <div className="flex items-center gap-3 min-w-0">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                todayWorkout.completed ? 'bg-secondary text-foreground' : 'bg-primary/10 text-primary'
              }`}
            >
              {todayWorkout.completed ? <CheckCircle2 className="h-5 w-5" /> : <Clock className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <p className="font-medium truncate">{todayWorkout.name}</p>
              <p className="text-xs text-muted-foreground">
                {todayWorkout.completed ? 'Séance complétée' : 'Séance prévue'}
              </p>
            </div>
          </div>
          {todayWorkout.workoutId && (
            <Link
              href={`/workout/${todayWorkout.workoutId}`}
              className="shrink-0 text-sm text-primary hover:opacity-80 transition-opacity"
            >
              Voir →
            </Link>
          )}
        </div>
      ) : (
        <div className="p-4 rounded-lg border border-border bg-secondary text-center">
          <p className="text-sm text-muted-foreground">Aucune séance prévue aujourd&apos;hui</p>
        </div>
      )}
    </div>
  )
}
