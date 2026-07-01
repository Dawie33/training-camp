'use client'

import { BIKE_TYPE_LABELS, BikingStats } from '@/services/biking'
import Link from 'next/link'

interface BikingStatsPanelProps {
  stats: BikingStats | null
  loading: boolean
}

export function BikingStatsPanel({ stats, loading }: BikingStatsPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400" />
      </div>
    )
  }

  if (!stats || stats.total_sessions === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <span className="text-5xl mb-4">🚴</span>
        <p className="text-slate-400 mb-4">Aucune séance vélo enregistrée</p>
        <Link
          href="/biking"
          className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors text-sm"
        >
          Créer une séance vélo
        </Link>
      </div>
    )
  }

  const totalHoursFormatted = stats.total_hours >= 1
    ? `${Math.floor(stats.total_hours)}h${Math.round((stats.total_hours % 1) * 60).toString().padStart(2, '0')}`
    : `${Math.round(stats.total_hours * 60)}min`

  return (
    <div className="space-y-6">
      {/* Chiffres clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Séances</p>
          <p className="text-2xl font-bold text-white">{stats.total_sessions}</p>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Distance totale</p>
          <p className="text-2xl font-bold text-white">{stats.total_km} km</p>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Temps total</p>
          <p className="text-2xl font-bold text-white">{totalHoursFormatted}</p>
        </div>
        <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
          <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Puissance moy.</p>
          <p className="text-2xl font-bold text-blue-400">
            {stats.avg_power_watts !== null ? `${stats.avg_power_watts} W` : '--'}
          </p>
        </div>
      </div>

      {/* Breakdown par type */}
      {Object.keys(stats.type_breakdown).length > 0 && (
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📊</span>
            <h3 className="font-semibold text-white">Séances par type</h3>
          </div>
          <div className="space-y-2.5">
            {Object.entries(stats.type_breakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const pct = Math.round((count / stats.total_sessions) * 100)
                const label = BIKE_TYPE_LABELS[type as keyof typeof BIKE_TYPE_LABELS] ?? type
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-xs text-slate-300 w-36 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Link
          href="/biking"
          className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
        >
          Voir toutes les séances →
        </Link>
      </div>
    </div>
  )
}
