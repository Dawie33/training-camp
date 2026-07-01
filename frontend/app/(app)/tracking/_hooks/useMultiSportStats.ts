import { bikingService, BikingStats } from '@/services/biking'
import { runningService, RunningStats } from '@/services/running'
import { useEffect, useState } from 'react'

interface MultiSportStats {
  running: RunningStats | null
  biking: BikingStats | null
}

export function useMultiSportStats() {
  const [stats, setStats] = useState<MultiSportStats>({ running: null, biking: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      runningService.getStats(),
      bikingService.getStats(),
    ]).then(([runningResult, bikingResult]) => {
      setStats({
        running: runningResult.status === 'fulfilled' ? runningResult.value : null,
        biking: bikingResult.status === 'fulfilled' ? bikingResult.value : null,
      })
    }).finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}
