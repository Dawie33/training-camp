import { bikingService, BikingStats } from '@/services/biking'
import { useEffect, useState } from 'react'

interface MultiSportStats {
  biking: BikingStats | null
}

export function useMultiSportStats() {
  const [stats, setStats] = useState<MultiSportStats>({ biking: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      bikingService.getStats(),
    ]).then(([bikingResult]) => {
      setStats({
        biking: bikingResult.status === 'fulfilled' ? bikingResult.value : null,
      })
    }).finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}
