'use client'

import { useCallback, useEffect, useState } from 'react'
import { NextSessionRecommendation, recommendationsService } from '@/services/recommendations'

interface UseRecommendationResult {
  data: NextSessionRecommendation | null
  loading: boolean
  refreshing: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useRecommendation(): UseRecommendationResult {
  const [data, setData] = useState<NextSessionRecommendation | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    recommendationsService.getNextSession()
      .then(setData)
      .catch(() => setError('Impossible de charger la recommandation'))
      .finally(() => setLoading(false))
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const result = await recommendationsService.refresh()
      setData(result)
    } catch {
      setError('Impossible de rafraîchir la recommandation')
    } finally {
      setRefreshing(false)
    }
  }, [])

  return { data, loading, refreshing, error, refresh }
}
