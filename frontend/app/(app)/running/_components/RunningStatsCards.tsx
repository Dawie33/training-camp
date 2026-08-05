'use client'

import { formatPace, RunningStats } from '@/services/running'
import { Activity, Clock, Gauge, TrendingUp } from 'lucide-react'

interface Props {
  stats: RunningStats
}

export function RunningStatsCards({ stats }: Props) {
  const cards = [
    {
      label: 'Total km',
      value: `${stats.total_km} km`,
      icon: TrendingUp,
    },
    {
      label: 'Séances',
      value: stats.total_sessions,
      icon: Activity,
    },
    {
      label: 'Allure moyenne',
      value: formatPace(stats.avg_pace_seconds_per_km),
      icon: Gauge,
    },
    {
      label: 'Temps total',
      value: `${stats.total_hours}h`,
      icon: Clock,
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon }) => (
        <div key={label} className="rounded-lg border border-border bg-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon className="w-4 h-4 text-primary" />
            <span className="text-xs text-muted-foreground">{label}</span>
          </div>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
      ))}
    </div>
  )
}
