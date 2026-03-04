'use client'

import type { ProgramEnrollment, ProgramSession } from '@/domain/entities/training-program'
import { trainingProgramsService } from '@/services/training-programs'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

export function useActiveProgram() {
  const [enrollment, setEnrollment] = useState<ProgramEnrollment | null>(null)
  const [loading, setLoading] = useState(true)
  const [weekSessions, setWeekSessions] = useState<ProgramSession[]>([])
  const [weekPhase, setWeekPhase] = useState<{ phase_number: number; name: string; description: string } | null>(null)
  const [weekLoading, setWeekLoading] = useState(false)
  const [viewedWeek, setViewedWeek] = useState(1)

  const fetchEnrollment = useCallback(async () => {
    try {
      setLoading(true)
      const data = await trainingProgramsService.getActive()
      setEnrollment(data)
      if (data) {
        setViewedWeek(data.current_week)
      }
    } catch {
      toast.error('Impossible de charger le programme')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEnrollment()
  }, [fetchEnrollment])

  const fetchWeekSessions = useCallback(async (enrollmentId: string, week: number) => {
    try {
      setWeekLoading(true)
      const data = await trainingProgramsService.getWeekSessions(enrollmentId, week)
      setWeekSessions(data.sessions as ProgramSession[])
      setWeekPhase(data.phase)
    } catch {
      toast.error(`Impossible de charger les sessions de la semaine ${week}`)
    } finally {
      setWeekLoading(false)
    }
  }, [])

  useEffect(() => {
    if (enrollment) {
      fetchWeekSessions(enrollment.id, viewedWeek)
    }
  }, [enrollment, viewedWeek, fetchWeekSessions])

  const startProgram = async () => {
    if (!enrollment) return
    try {
      const updated = await trainingProgramsService.startProgram(enrollment.id)
      setEnrollment(updated)
      toast.success('Programme démarré !')
    } catch {
      toast.error('Impossible de démarrer le programme')
    }
  }

  const pauseProgram = async () => {
    if (!enrollment) return
    try {
      const updated = await trainingProgramsService.pauseProgram(enrollment.id)
      setEnrollment(updated)
      toast.success('Programme mis en pause')
    } catch {
      toast.error('Impossible de mettre en pause')
    }
  }

  const abandonProgram = async () => {
    if (!enrollment) return
    if (!confirm('Abandonner ce programme ? Cette action est irréversible.')) return
    try {
      const updated = await trainingProgramsService.abandonProgram(enrollment.id)
      setEnrollment(updated)
      toast.success('Programme abandonné')
    } catch {
      toast.error("Impossible d'abandonner le programme")
    }
  }

  const advanceToNextWeek = async () => {
    if (!enrollment) return
    const nextWeek = enrollment.current_week + 1
    if (nextWeek > enrollment.duration_weeks) {
      toast.info('Vous êtes à la dernière semaine du programme')
      return
    }
    try {
      const updated = await trainingProgramsService.updateEnrollment(enrollment.id, {
        current_week: nextWeek,
      })
      setEnrollment(updated)
      setViewedWeek(nextWeek)
      toast.success(`Passage à la semaine ${nextWeek}`)
    } catch {
      toast.error('Impossible de passer à la semaine suivante')
    }
  }

  const checkWeekProgress = async () => {
    if (!enrollment) return null
    const result = await trainingProgramsService.checkWeekProgress(enrollment.id)
    if (result.auto_advanced && result.next_week) {
      toast.success(`Semaine ${result.week_completed} terminée ! Passage à la semaine ${result.next_week}`)
      await advanceToNextWeek()
    }
    return result
  }

  const scheduleCurrentWeek = async (startDate: string, boxDates: string[]) => {
    if (!enrollment) return
    try {
      const result = await trainingProgramsService.scheduleWeek(enrollment.id, {
        week_num: viewedWeek,
        start_date: startDate,
        box_dates: boxDates,
      })
      toast.success(`${result.scheduled.length} séance(s) planifiée(s) dans le calendrier`)
      return result
    } catch (e: unknown) {
      toast.error((e as { message?: string })?.message || 'Impossible de planifier la semaine')
    }
  }

  const swapSession = async (
    sessionInWeek: number,
    swapData: { swap_type: 'workout' | 'ai_regenerate' | 'exercise'; week: number; workout_id?: string; movement_name?: string; replacement_exercise?: unknown; instructions?: string }
  ) => {
    if (!enrollment) return
    try {
      await trainingProgramsService.swapSession(enrollment.id, sessionInWeek, swapData as Parameters<typeof trainingProgramsService.swapSession>[2])
      toast.success('Session modifiée')
      await fetchWeekSessions(enrollment.id, viewedWeek)
    } catch {
      toast.error('Impossible de modifier la session')
    }
  }

  return {
    enrollment,
    loading,
    weekSessions,
    weekPhase,
    weekLoading,
    viewedWeek,
    setViewedWeek,
    startProgram,
    pauseProgram,
    abandonProgram,
    advanceToNextWeek,
    checkWeekProgress,
    scheduleCurrentWeek,
    swapSession,
    refetch: fetchEnrollment,
  }
}
