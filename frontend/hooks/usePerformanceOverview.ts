'use client'

import { analyticsService, PerformanceOverview } from '@/services/analytics'
import { useCallback, useEffect, useState } from 'react'

/**
 * Charge le diagnostic de performance calculé pour la période demandée.
 *
 * Au changement de période, le résultat précédent est conservé pendant le
 * rechargement (`refreshing`) : les graphes gardent leur rendu au lieu de
 * repasser par un squelette, ce qui éviterait un saut de mise en page.
 *
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

  return {
    overview,
    loading,
    /** true uniquement quand on recharge par-dessus un résultat déjà affiché. */
    refreshing: loading && overview !== null,
    error,
    reload: load,
  }
}
