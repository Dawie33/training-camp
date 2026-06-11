'use client'

import { bikingService, BikingSession, BikingStats } from '@/services/biking'
import { useEffect, useState } from 'react'

export function useBikingDashboard() {
    const [sessions, setSessions] = useState<BikingSession[]>([])
    const [stats, setStats] = useState<BikingStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        async function load() {
            try {
                setLoading(true)
                const [sessionsData, statsData] = await Promise.all([
                    bikingService.getSessions({ limit: 10 }),
                    bikingService.getStats(),
                ])
                setSessions(sessionsData.rows)
                setStats(statsData)
            } catch {
                setError('Impossible de charger les séances vélo')
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    return { sessions, stats, loading, error }
}