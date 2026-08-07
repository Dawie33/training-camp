import { Workouts } from '@/domain/entities/workout'
import { workoutsApi } from '@/services/workouts'
import { useCallback, useEffect, useState } from 'react'

const LIMIT = 20

export function useWorkoutLibrary(open: boolean, active: boolean) {
  const [workouts, setWorkouts] = useState<Workouts[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const load = useCallback(async (reset: boolean) => {
    try {
      setLoading(true)
      const offset = reset ? 0 : workouts.length
      const data = await workoutsApi.getAll({
        limit: LIMIT,
        offset,
        status: 'published',
        search: searchQuery || undefined,
        difficulty: selectedDifficulty || undefined,
        workout_type: selectedType || undefined,
      })
      setWorkouts(prev => (reset ? data.rows : [...prev, ...data.rows]))
      setTotalCount(data.count)
      setHasMore(offset + data.rows.length < data.count)
    } catch (error) {
      console.error('Error loading workouts:', error)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, selectedDifficulty, selectedType])

  useEffect(() => {
    if (open && active) load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active, searchQuery, selectedDifficulty, selectedType])

  const reset = useCallback(() => {
    setWorkouts([])
    setSearchQuery('')
    setSelectedDifficulty('')
    setSelectedType('')
    setHasMore(true)
    setShowFilters(false)
  }, [])

  return {
    workouts,
    loading,
    searchQuery,
    setSearchQuery,
    selectedDifficulty,
    setSelectedDifficulty,
    selectedType,
    setSelectedType,
    totalCount,
    hasMore,
    showFilters,
    setShowFilters,
    loadMore: () => load(false),
    reset,
  }
}
