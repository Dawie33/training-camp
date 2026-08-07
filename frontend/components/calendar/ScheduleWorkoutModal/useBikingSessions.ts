import { BikingSession, bikingService } from '@/services/biking'
import { useEffect, useState } from 'react'

export function useBikingSessions(open: boolean, active: boolean) {
  const [sessions, setSessions] = useState<BikingSession[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    if (open && active && sessions.length === 0) {
      setLoading(true)
      bikingService
        .getSessions({ limit: 30 })
        .then(data => setSessions(data.rows))
        .catch(() => {})
        .finally(() => setLoading(false))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active])

  const reset = () => {
    setSessions([])
    setSearch('')
    setSelectedId('')
  }

  return { sessions, loading, search, setSearch, selectedId, setSelectedId, reset }
}
