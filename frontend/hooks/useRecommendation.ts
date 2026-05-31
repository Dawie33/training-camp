'use client'

import { useCallback, useEffect, useState } from 'react'
import { NextSessionRecommendation, recommendationsService } from '@/services/recommendations'

// Cache en mémoire — persiste entre les navigations, se réinitialise au refresh
const CACHE_TTL_MS = 30 * 60 * 1000 // 30 minutes
let _cachedData: NextSessionRecommendation | null = null
let _cacheExpiry = 0

function getCached(): NextSessionRecommendation | null {
  if (_cachedData && Date.now() < _cacheExpiry) return _cachedData
  return null
}

function setCache(data: NextSessionRecommendation) {
  _cachedData = data
  _cacheExpiry = Date.now() + CACHE_TTL_MS
}

function clearCache() {
  _cachedData = null
  _cacheExpiry = 0
}

interface UseRecommendationResult {
  data: NextSessionRecommendation | null
  loading: boolean
  refreshing: boolean
  error: string | null
  refresh: () => Promise<void>
}

export function useRecommendation(): UseRecommendationResult {
  const cached = getCached()
  const [data, setData] = useState<NextSessionRecommendation | null>(cached)
  const [loading, setLoading] = useState(cached === null)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Si on a déjà des données fraîches en cache, pas besoin d'appeler l'API
    if (getCached()) return

    recommendationsService.getNextSession()
      .then(result => {
        setCache(result)
        setData(result)
      })
      .catch(() => setError('Impossible de charger la recommandation'))
      .finally(() => setLoading(false))
  }, [])

  const refresh = useCallback(async () => {
    setRefreshing(true)
    setError(null)
    try {
      const result = await recommendationsService.refresh()
      setCache(result)
      setData(result)
    } catch {
      setError('Impossible de rafraîchir la recommandation')
    } finally {
      setRefreshing(false)
    }
  }, [])

  return { data, loading, refreshing, error, refresh }
}
