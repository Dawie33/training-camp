'use client'

import { analyticsService, PerformanceOverview } from '@/services/analytics'
import { useCallback, useEffect, useState } from 'react'

/**
 * Charge le diagnostic de performance calculé pour la période demandée.
 * @param months Profondeur d'analyse en mois
 */
export function usePerformanceOverview(months = 3) {
  const [overview, setOverview] = useState<PerformanceOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setOverview(await analyticsService.getOverview(months))
    } catch {
      setError('Impossible de charger le diagnostic')
    } finally {
      setLoading(false)
    }
  }, [months])

  useEffect(() => {
    load()
  }, [load])

  return { overview, loading, error, reload: load }
}
