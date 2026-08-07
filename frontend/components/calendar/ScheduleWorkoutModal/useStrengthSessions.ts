import { StrengthSession, strengthService } from '@/services/strength'
import { useEffect, useState } from 'react'

export function useStrengthSessions(open: boolean, active: boolean) {
  const [sessions, setSessions] = useState<StrengthSession[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [goalFilter, setGoalFilter] = useState('')
  const [selectedId, setSelectedId] = useState('')

  useEffect(() => {
    if (open && active && sessions.length === 0) {
      setLoading(true)
      strengthService
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
    setGoalFilter('')
    setSelectedId('')
  }

  return { sessions, loading, search, setSearch, goalFilter, setGoalFilter, selectedId, setSelectedId, reset }
}
