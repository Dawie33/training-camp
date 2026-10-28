'use client'

import { analyticsService, PerformanceOverview } from '@/services/analytics'
import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Charge le diagnostic de performance calculé pour la période demandée.
 *
 * Au changement de période, le résultat précédent est conservé pendant le
 * rechargement (`refreshing`) : les graphes gardent leur rendu au lieu de
 * repasser par un squelette, ce qui éviterait un saut de mise en page.
 *
 * Seule la dernière requête lancée met à jour l'état : si l'utilisateur change
 * vite de période, une réponse plus lente pour l'ancienne période est ignorée.
 *
 * @param months Profondeur d'analyse en mois
 */
export function usePerformanceOverview(months = 3) {
  const [overview, setOverview] = useState<PerformanceOverview | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // Numéro de la dernière requête lancée, incrémenté à chaque chargement
  const lastRequestId = useRef(0)

  const load = useCallback(async () => {
    const requestId = ++lastRequestId.current
    const isLatest = () => requestId === lastRequestId.current

    try {
      setLoading(true)
      setError(null)
      const data = await analyticsService.getOverview(months)
      if (isLatest()) setOverview(data)
    } catch {
      if (isLatest()) setError('Impossible de charger le diagnostic')
    } finally {
      // Une requête dépassée ne clôt pas le chargement : la plus récente est encore en cours
      if (isLatest()) setLoading(false)
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
