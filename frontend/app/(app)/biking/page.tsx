'use client'

import { Bike, Clock, Flame, Plus, Zap } from 'lucide-react'
import Link from 'next/link'
import { BikingSessionCard } from './_components/BikingSessionCard'
import { useBikingDashboard } from './_hook/useBikingDashboard'

export default function BikingPage() {
    const { sessions, stats, loading, error } = useBikingDashboard()

    if (loading) {
        return (
            <div className="space-y-3">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 rounded-xl bg-white/5 animate-pulse" />
                ))}
            </div>
        )
    }

    if (error) {
        return <p className="text-red-400 text-sm">{error}</p>
    }

    return (
        <div className="space-y-6">
            {/* Stats */}
            {stats && stats.total_sessions > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <p className="text-xs text-slate-500 mb-1">Séances</p>
                        <p className="text-2xl font-bold text-white">{stats.total_sessions}</p>
                    </div>
                    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                        <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                            <Clock className="w-3.5 h-3.5" />
                            <p className="text-xs">Heures</p>
                        </div>
                        <p className="text-2xl font-bold text-white">{stats.total_hours}h</p>
                    </div>
                    {stats.avg_power_watts && (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                                <Zap className="w-3.5 h-3.5" />
                                <p className="text-xs">Puissance moy.</p>
                            </div>
                            <p className="text-2xl font-bold text-white">{stats.avg_power_watts}W</p>
                        </div>
                    )}
                    {stats.total_km > 0 && (
                        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                            <div className="flex items-center gap-1.5 text-slate-500 mb-1">
                                <Flame className="w-3.5 h-3.5" />
                                <p className="text-xs">Distance totale</p>
                            </div>
                            <p className="text-2xl font-bold text-white">{stats.total_km} km</p>
                        </div>
                    )}
                </div>
            )}

            {/* Actions rapides */}
            <div className="flex gap-2">
                <Link href="/biking/log"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-400 text-sm font-medium hover:bg-blue-500/30 transition-colors">
                    <Plus className="w-4 h-4" />
                    Enregistrer une séance
                </Link>
                <Link href="/biking/generate"
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 text-sm font-medium hover:bg-white/10 transition-colors">
                    <Zap className="w-4 h-4" />
                    Générer avec l'IA
                </Link>
            </div>

            {/* Liste des séances */}
            {sessions.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                    <Bike className="w-12 h-12 text-slate-600 mx-auto" />
                    <p className="text-slate-400 font-medium">Aucune séance pour l'instant</p>
                    <p className="text-slate-500 text-sm">Enregistre ta première sortie ou génère un plan IA</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Séances récentes</h2>
                    {sessions.map(session => (
                        <BikingSessionCard key={session.id} session={session} />
                    ))}
                    <Link href="/biking/library"
                        className="block text-center text-sm text-slate-500 hover:text-slate-300 transition-colors py-2">
                        Voir toutes les séances →
                    </Link>
                </div>
            )}
        </div>
    )
}
