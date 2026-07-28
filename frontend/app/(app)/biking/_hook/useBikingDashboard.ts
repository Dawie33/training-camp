'use client'

import { bikingService, BikingSession, BikingStats } from '@/services/biking'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

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

    const handleDelete = async (id: string) => {
        try {
            await bikingService.delete(id)
            setSessions(prev => prev.filter(s => s.id !== id))
            toast.success('Séance supprimée')
        } catch {
            toast.error('Erreur lors de la suppression')
        }
    }

    return { sessions, stats, loading, error, handleDelete }
}