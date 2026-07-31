'use client'

import { WorkoutStats } from '@/domain/entities/workout-history'
import { BikingStats } from '@/services/biking'
import { RunningStats } from '@/services/running'
import { Bike, Flame, Footprints, Trophy, type LucideIcon } from 'lucide-react'
import { StatsCard } from './StatsCard'

interface SportCardProps {
  icon: LucideIcon
  label: string
  sessions: number
  stat: string
  statLabel: string
  onTabChange: () => void
}

function SportCard({ icon: Icon, label, sessions, stat, statLabel, onTabChange }: SportCardProps) {
  return (
    <button
      onClick={onTabChange}
      className="w-full text-left p-5 bg-card border border-orange-600/20 rounded-lg hover:border-foreground/25 transition-colors group"
    >
      <div className="flex items-start justify-between mb-3">
        <Icon className="w-5 h-5 text-orange-600" />
        <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">Voir détail →</span>
      </div>
      <p className="font-display font-semibold text-lg mb-0.5">{label}</p>
      <p className="text-xs text-muted-foreground">{sessions} séance{sessions > 1 ? 's' : ''}</p>
      {stat !== '--' && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-sm font-semibold">{stat}</p>
          <p className="text-[10px] text-muted-foreground">{statLabel}</p>
        </div>
      )}
    </button>
  )
}

interface GlobalOverviewProps {
  workoutStats: WorkoutStats | null
  runningStats: RunningStats | null
  bikingStats: BikingStats | null
  onTabChange: (tab: string) => void
}

export function GlobalOverview({
  workoutStats,
  runningStats,
  bikingStats,
  onTabChange,
}: GlobalOverviewProps) {
  const totalSessions =
    (workoutStats?.totalWorkouts ?? 0) +
    (runningStats?.total_sessions ?? 0) +
    (bikingStats?.total_sessions ?? 0)

  return (
    <div className="space-y-6">
      {/* Total global */}
      <StatsCard
        title="Total toutes disciplines"
        value={totalSessions}
        subtitle="séances enregistrées"
        icon={Trophy}
      />

      {/* Mini-cartes par sport */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <SportCard
          icon={Flame}
          label="CrossFit"
          sessions={workoutStats?.totalWorkouts ?? 0}
          stat={workoutStats?.currentStreak ? `${workoutStats.currentStreak}j` : '--'}
          statLabel="Streak actuel"
          onTabChange={() => onTabChange('crossfit')}
        />
        <SportCard
          icon={Footprints}
          label="Running"
          sessions={runningStats?.total_sessions ?? 0}
          stat={runningStats ? `${runningStats.total_km} km` : '--'}
          statLabel="Distance totale"
          onTabChange={() => onTabChange('running')}
        />
        <SportCard
          icon={Bike}
          label="Vélo"
          sessions={bikingStats?.total_sessions ?? 0}
          stat={bikingStats ? `${bikingStats.total_km} km` : '--'}
          statLabel="Distance totale"
          onTabChange={() => onTabChange('biking')}
        />
      </div>
    </div>
  )
}
