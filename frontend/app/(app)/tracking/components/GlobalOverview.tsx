'use client'

import { WorkoutStats } from '@/domain/entities/workout-history'
import { BikingStats } from '@/services/biking'
import { RunningStats } from '@/services/running'

interface SportCardProps {
  href: string
  color: string
  icon: string
  label: string
  sessions: number
  stat: string
  statLabel: string
  onTabChange: () => void
}

function SportCard({ color, icon, label, sessions, stat, statLabel, onTabChange }: SportCardProps) {
  return (
    <button
      onClick={onTabChange}
      className={`w-full text-left p-5 bg-white/5 border ${color} rounded-2xl hover:bg-white/8 transition-all group`}
    >
      <div className="flex items-start justify-between mb-3">
        <span className="text-2xl">{icon}</span>
        <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">Voir détail →</span>
      </div>
      <p className="font-bold text-white text-lg mb-0.5">{label}</p>
      <p className="text-xs text-slate-500">{sessions} séance{sessions > 1 ? 's' : ''}</p>
      {stat !== '--' && (
        <div className="mt-3 pt-3 border-t border-white/5">
          <p className="text-sm font-semibold text-white">{stat}</p>
          <p className="text-[10px] text-slate-500">{statLabel}</p>
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
      <div className="p-5 bg-gradient-to-r from-orange-500/10 to-rose-500/10 border border-white/10 rounded-2xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">Total toutes disciplines</p>
            <p className="text-4xl font-black text-white mt-1">{totalSessions}</p>
            <p className="text-xs text-slate-500 mt-0.5">séances enregistrées</p>
          </div>
          <div className="text-5xl opacity-30">🏋️</div>
        </div>
      </div>

      {/* Mini-cartes par sport */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <SportCard
          href="/crossfit"
          color="border-orange-500/20"
          icon="🔥"
          label="CrossFit"
          sessions={workoutStats?.totalWorkouts ?? 0}
          stat={workoutStats?.currentStreak ? `${workoutStats.currentStreak}j` : '--'}
          statLabel="Streak actuel"
          onTabChange={() => onTabChange('crossfit')}
        />
        <SportCard
          href="/running"
          color="border-green-500/20"
          icon="🏃"
          label="Running"
          sessions={runningStats?.total_sessions ?? 0}
          stat={runningStats ? `${runningStats.total_km} km` : '--'}
          statLabel="Distance totale"
          onTabChange={() => onTabChange('running')}
        />
        <SportCard
          href="/biking"
          color="border-blue-500/20"
          icon="🚴"
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
