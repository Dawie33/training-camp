import { trainingProgramsApi, ActiveEnrollment, WeekSessions } from '@/services/training-programs'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

// Lundi de la semaine courante au format YYYY-MM-DD
function mondayOfCurrentWeek(): string {
  const d = new Date()
  const day = d.getDay() // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

// Dates par défaut réparties sur la semaine, une par séance
function defaultSessionDates(startDate: string, count: number): string[] {
  const dates: string[] = []
  for (let i = 0; i < count; i++) {
    const offset = count > 1 ? Math.round((i * 6) / (count - 1)) : 0
    const d = new Date(startDate)
    d.setDate(d.getDate() + offset)
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const dd = String(d.getDate()).padStart(2, '0')
    dates.push(`${y}-${m}-${dd}`)
  }
  return dates
}

export function useTrainingProgram() {
  const [enrollment, setEnrollment] = useState<ActiveEnrollment | null>(null)
  const [weekData, setWeekData] = useState<WeekSessions | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingWeek, setLoadingWeek] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)
  const [viewWeek, setViewWeek] = useState<number>(1)
  const [showSchedule, setShowSchedule] = useState(false)
  const [scheduleDate, setScheduleDate] = useState<string>(mondayOfCurrentWeek())
  const [sessionDates, setSessionDates] = useState<string[]>([])
  const [scheduling, setScheduling] = useState(false)
  const [addingBonus, setAddingBonus] = useState(false)

  const fetchEnrollment = useCallback(async () => {
    try {
      const data = await trainingProgramsApi.getActive()
      setEnrollment(data)
      if (data) {
        setViewWeek(data.current_week)
      }
    } catch {
      toast.error('Erreur lors du chargement du programme')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchEnrollment()
  }, [fetchEnrollment])

  const fetchWeek = useCallback(async (enrollmentId: string, week: number) => {
    setLoadingWeek(true)
    try {
      const data = await trainingProgramsApi.getWeekSessions(enrollmentId, week)
      setWeekData(data)
    } catch {
      toast.error('Impossible de charger les sessions de cette semaine')
    } finally {
      setLoadingWeek(false)
    }
  }, [])

  useEffect(() => {
    if (enrollment) {
      fetchWeek(enrollment.id, viewWeek)
    }
  }, [enrollment, viewWeek, fetchWeek])

  useEffect(() => {
    const count = weekData?.sessions.length ?? 0
    if (showSchedule && count > 0) {
      setSessionDates(defaultSessionDates(scheduleDate, count))
    }
  }, [showSchedule, scheduleDate, weekData])

  const handleStart = async () => {
    if (!enrollment) return
    setActionLoading(true)
    try {
      await trainingProgramsApi.start(enrollment.id)
      toast.success('Programme démarré !')
      fetchEnrollment()
    } catch {
      toast.error('Erreur')
    } finally {
      setActionLoading(false)
    }
  }

  const handlePause = async () => {
    if (!enrollment) return
    setActionLoading(true)
    try {
      await trainingProgramsApi.pause(enrollment.id)
      toast.success('Programme mis en pause')
      fetchEnrollment()
    } catch {
      toast.error('Erreur')
    } finally {
      setActionLoading(false)
    }
  }

  const handleAbandon = async () => {
    if (!enrollment) return
    if (!confirm('Abandonner ce programme ? Cette action est irréversible.')) return
    setActionLoading(true)
    try {
      await trainingProgramsApi.abandon(enrollment.id)
      toast.success('Programme abandonné')
      setEnrollment(null)
      setWeekData(null)
    } catch {
      toast.error('Erreur')
    } finally {
      setActionLoading(false)
    }
  }

  const handleSchedule = async () => {
    if (!enrollment || !weekData) return
    const dates = sessionDates.slice(0, weekData.sessions.length)
    if (dates.some((d) => !d)) {
      toast.error('Choisis une date pour chaque séance')
      return
    }
    if (new Set(dates).size !== dates.length) {
      toast.error('Deux séances ne peuvent pas être le même jour')
      return
    }
    setScheduling(true)
    try {
      const res = await trainingProgramsApi.scheduleWeek(enrollment.id, {
        week_num: viewWeek,
        assignments: dates.map((date, i) => ({ session_index: i, date })),
      })
      const count = res?.scheduled?.length ?? 0
      toast.success(`${count} séance${count > 1 ? 's' : ''} planifiée${count > 1 ? 's' : ''} dans le calendrier`)
      setShowSchedule(false)
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      toast.error(msg && msg.length < 120 ? msg : 'Impossible de planifier cette semaine')
    } finally {
      setScheduling(false)
    }
  }

  const handleAddBonus = async () => {
    if (!enrollment) return
    setAddingBonus(true)
    try {
      await trainingProgramsApi.addBonusSession(enrollment.id, viewWeek)
      toast.success('Séance bonus ajoutée à la semaine')
      await fetchWeek(enrollment.id, viewWeek)
    } catch {
      toast.error("Impossible d'ajouter une séance bonus")
    } finally {
      setAddingBonus(false)
    }
  }

  return {
    enrollment,
    weekData,
    loading,
    loadingWeek,
    actionLoading,
    viewWeek,
    setViewWeek,
    showSchedule,
    setShowSchedule,
    scheduleDate,
    setScheduleDate,
    sessionDates,
    setSessionDates,
    scheduling,
    addingBonus,
    handleStart,
    handlePause,
    handleAbandon,
    handleSchedule,
    handleAddBonus,
  }
}
