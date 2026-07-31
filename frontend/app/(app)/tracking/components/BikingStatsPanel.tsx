'use client'

import { BIKE_TYPE_LABELS, BikingStats } from '@/services/biking'
import { BarChart3, Bike, Calendar, Clock, Gauge, Route } from 'lucide-react'
import Link from 'next/link'
import { StatsCard } from './StatsCard'

interface BikingStatsPanelProps {
  stats: BikingStats | null
  loading: boolean
}

export function BikingStatsPanel({ stats, loading }: BikingStatsPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    )
  }

  if (!stats || stats.total_sessions === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <Bike className="w-10 h-10 text-muted-foreground mb-4" />
        <p className="text-muted-foreground mb-4">Aucune séance vélo enregistrée</p>
        <Link
          href="/biking"
          className="px-4 py-2 bg-orange-600/10 text-orange-600 border border-orange-600/20 rounded-lg hover:bg-orange-600/15 transition-colors text-sm"
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
        <StatsCard title="Séances" value={stats.total_sessions} icon={Calendar} color="orange" />
        <StatsCard title="Distance totale" value={`${stats.total_km} km`} icon={Route} color="orange" />
        <StatsCard title="Temps total" value={totalHoursFormatted} icon={Clock} color="orange" />
        <StatsCard
          title="Puissance moy."
          value={stats.avg_power_watts !== null ? `${stats.avg_power_watts} W` : '--'}
          icon={Gauge}
          color="orange"
        />
      </div>

      {/* Breakdown par type */}
      {Object.keys(stats.type_breakdown).length > 0 && (
        <div className="p-5 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-display font-semibold">Séances par type</h3>
          </div>
          <div className="space-y-2.5">
            {Object.entries(stats.type_breakdown)
              .sort((a, b) => b[1] - a[1])
              .map(([type, count]) => {
                const pct = Math.round((count / stats.total_sessions) * 100)
                const label = BIKE_TYPE_LABELS[type as keyof typeof BIKE_TYPE_LABELS] ?? type
                return (
                  <div key={type} className="flex items-center gap-3">
                    <span className="text-xs text-foreground w-36 flex-shrink-0">{label}</span>
                    <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                      <div
                        className="h-full bg-orange-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Link
          href="/biking"
          className="text-xs text-orange-600 hover:text-orange-700 transition-colors"
        >
          Voir toutes les séances →
        </Link>
      </div>
    </div>
  )
}
