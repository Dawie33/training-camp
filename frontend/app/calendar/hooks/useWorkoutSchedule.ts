import { scheduleApi, ScheduleQueryParams, WorkoutSchedule, CreateScheduleDto, UpdateScheduleDto } from '@/lib/api/schedule'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

export function useWorkoutSchedule(params?: ScheduleQueryParams) {
  const [schedules, setSchedules] = useState<WorkoutSchedule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const [count, setCount] = useState(0)

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await scheduleApi.getAll(params)
      setSchedules(data.rows)
      setCount(data.count)
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching schedules:', err)
      // Don't show error toast on initial load
      setSchedules([])
      setCount(0)
    } finally {
      setLoading(false)
    }
  }, [params?.start_date, params?.end_date, params?.status, params?.workout_id, params?.limit, params?.offset])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const createSchedule = async (data: CreateScheduleDto) => {
    try {
      const newSchedule = await scheduleApi.create(data)
      setSchedules((prev) => [...prev, newSchedule])
      setCount((prev) => prev + 1)
      toast.success('Workout planifié avec succès')
      return newSchedule
    } catch (err) {
      const error = err as any
      const message = error.response?.data?.message || 'Erreur lors de la planification'
      toast.error(message)
      throw err
    }
  }

  const updateSchedule = async (id: string, data: UpdateScheduleDto) => {
    try {
      const updated = await scheduleApi.update(id, data)
      setSchedules((prev) => prev.map((s) => (s.id === id ? updated : s)))
      toast.success('Planification mise à jour')
      return updated
    } catch (err) {
      toast.error('Erreur lors de la mise à jour')
      throw err
    }
  }

  const deleteSchedule = async (id: string) => {
    try {
      await scheduleApi.delete(id)
      setSchedules((prev) => prev.filter((s) => s.id !== id))
      setCount((prev) => prev - 1)
      toast.success('Planification supprimée')
    } catch (err) {
      toast.error('Erreur lors de la suppression')
      throw err
    }
  }

  const markAsCompleted = async (id: string, sessionId?: string) => {
    try {
      const updated = await scheduleApi.markAsCompleted(id, sessionId)
      setSchedules((prev) => prev.map((s) => (s.id === id ? updated : s)))
      toast.success('Workout marqué comme complété')
      return updated
    } catch (err) {
      toast.error('Erreur lors de la mise à jour')
      throw err
    }
  }

  const markAsSkipped = async (id: string) => {
    try {
      const updated = await scheduleApi.markAsSkipped(id)
      setSchedules((prev) => prev.map((s) => (s.id === id ? updated : s)))
      toast.success('Workout marqué comme sauté')
      return updated
    } catch (err) {
      toast.error('Erreur lors de la mise à jour')
      throw err
    }
  }

  const getScheduleForDate = (date: Date): WorkoutSchedule | null => {
    const dateStr = date.toISOString().split('T')[0]
    return schedules.find((s) => s.scheduled_date === dateStr) || null
  }

  return {
    schedules,
    loading,
    error,
    count,
    refetch: fetchSchedules,
    createSchedule,
    updateSchedule,
    deleteSchedule,
    markAsCompleted,
    markAsSkipped,
    getScheduleForDate,
  }
}
