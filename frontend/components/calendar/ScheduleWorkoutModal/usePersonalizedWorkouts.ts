import { PersonalizedWorkout } from '@/domain/entities/workout'
import { workoutsService } from '@/services/workouts'
import { useCallback, useEffect, useState } from 'react'

const LIMIT = 20

export function usePersonalizedWorkouts(open: boolean, active: boolean) {
  const [workouts, setWorkouts] = useState<PersonalizedWorkout[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const load = useCallback(async (reset: boolean) => {
    try {
      setLoading(true)
      const offset = reset ? 0 : workouts.length
      const data = await workoutsService.getPersonalizedWorkouts(LIMIT, offset, search || undefined)
      setWorkouts(prev => (reset ? data.rows : [...prev, ...data.rows]))
      setTotalCount(data.count)
      setHasMore(offset + data.rows.length < data.count)
    } catch (error) {
      console.error('Error loading personalized workouts:', error)
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  useEffect(() => {
    if (open && active) load(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active, search])

  const reset = useCallback(() => {
    setWorkouts([])
    setSearch('')
    setHasMore(true)
  }, [])

  return { workouts, loading, search, setSearch, totalCount, hasMore, loadMore: () => load(false), reset }
}
