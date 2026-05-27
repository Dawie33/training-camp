import { sessionService, RunningSegment } from '@/services/sessions'
import { useEffect, useState } from 'react'

export function useWodRunningSegments() {
  const [segments, setSegments] = useState<RunningSegment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    sessionService
      .getRunningSegments()
      .then(setSegments)
      .catch(() => setSegments([]))
      .finally(() => setLoading(false))
  }, [])

  return { segments, loading }
}
