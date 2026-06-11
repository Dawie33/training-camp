'use client'

import { BIKE_TYPE_LABELS, BikeType, bikingService, BikingSession } from '@/services/biking'
import { Bike } from 'lucide-react'
import { useEffect, useState } from 'react'
import { BikingSessionCard } from '../_components/BikingSessionCard'

const BIKE_TYPES: BikeType[] = ['endurance', 'sweet_spot', 'intervals', 'ftp_test', 'recovery', 'race']

export default function BikingLibraryPage() {
    const [sessions, setSessions] = useState<BikingSession[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<BikeType | ''>('')
    const [count, setCount] = useState(0)

    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const data = await bikingService.getSessions({
                    limit: 50,
                    ...(filter ? { bike_type: filter } : {}),
                })
                setSessions(data.rows)
                setCount(data.count)
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [filter])

    return (
        <div className="space-y-4">
            {/* Filtres */}
            <div className="flex flex-wrap gap-1.5">
                <button
                    onClick={() => setFilter('')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filter === '' ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                        }`}
                >
                    Tous
                </button>
                {BIKE_TYPES.map(type => (
                    <button
                        key={type}
                        onClick={() => setFilter(type)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${filter === type ? 'bg-blue-500/20 border-blue-500/40 text-blue-400' : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                            }`}
                    >
                        {BIKE_TYPE_LABELS[type]}
                    </button>
                ))}
            </div>

            <p className="text-xs text-slate-500">{count} séance{count > 1 ? 's' : ''}</p>

            {loading ? (
                <div className="space-y-3">
                    {[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />)}
                </div>
            ) : sessions.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                    <Bike className="w-10 h-10 text-slate-600 mx-auto" />
                    <p className="text-slate-400">Aucune séance trouvée</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {sessions.map(session => (
                        <BikingSessionCard key={session.id} session={session} />
                    ))}
                </div>
            )}
        </div>
    )
}
