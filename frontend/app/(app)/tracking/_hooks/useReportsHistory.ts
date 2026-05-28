'use client'

import { apiClient } from '@/services/apiClient'
import { useEffect, useState } from 'react'
import { ProgressionReport } from './useProgressionReport'

export function useReportsHistory() {
  const [reports, setReports] = useState<ProgressionReport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await apiClient.get<ProgressionReport[]>('/tracking/reports')
        setReports(data ?? [])
      } catch {
        setReports([])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return { reports, loading }
}
