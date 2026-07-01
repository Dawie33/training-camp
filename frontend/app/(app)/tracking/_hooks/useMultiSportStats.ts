import { athxService, AthxStats } from '@/services/athx'
import { bikingService, BikingStats } from '@/services/biking'
import { hyroxService, HyroxStats } from '@/services/hyrox'
import { runningService, RunningStats } from '@/services/running'
import { useEffect, useState } from 'react'

interface MultiSportStats {
  running: RunningStats | null
  hyrox: HyroxStats | null
  athx: AthxStats | null
  biking: BikingStats | null
}

export function useMultiSportStats() {
  const [stats, setStats] = useState<MultiSportStats>({ running: null, hyrox: null, athx: null, biking: null })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    Promise.allSettled([
      runningService.getStats(),
      hyroxService.getStats(),
      athxService.getStats(),
      bikingService.getStats(),
    ]).then(([runningResult, hyroxResult, athxResult, bikingResult]) => {
      setStats({
        running: runningResult.status === 'fulfilled' ? runningResult.value : null,
        hyrox: hyroxResult.status === 'fulfilled' ? hyroxResult.value : null,
        athx: athxResult.status === 'fulfilled' ? athxResult.value : null,
        biking: bikingResult.status === 'fulfilled' ? bikingResult.value : null,
      })
    }).finally(() => setLoading(false))
  }, [])

  return { stats, loading }
}
