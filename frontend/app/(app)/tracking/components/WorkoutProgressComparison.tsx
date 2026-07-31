'use client'

import { motion } from 'framer-motion'
import { fadeInUp } from '@/lib/animations'
import { BarChart3, Minus, TrendingDown, TrendingUp, Zap } from 'lucide-react'
import { WorkoutProgress } from '../_hooks/useWorkoutProgress'

interface WorkoutProgressComparisonProps {
  progressData: WorkoutProgress[]
  loading: boolean
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  if (mins >= 60) {
    const hours = Math.floor(mins / 60)
    const remainingMins = mins % 60
    return `${hours}h${remainingMins > 0 ? `${remainingMins}m` : ''}`
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  })
}

function TrendIndicator({ trend, percent }: { trend: 'improving' | 'declining' | 'stable'; percent: number }) {
  if (trend === 'improving') {
    return (
      <span className="flex items-center gap-1 text-emerald-600 text-sm font-semibold">
        <TrendingUp className="w-3.5 h-3.5" /> +{Math.abs(percent)}%
      </span>
    )
  }
  if (trend === 'declining') {
    return (
      <span className="flex items-center gap-1 text-destructive text-sm font-semibold">
        <TrendingDown className="w-3.5 h-3.5" /> -{Math.abs(percent)}%
      </span>
    )
  }
  return (
    <span className="flex items-center gap-1 text-muted-foreground text-sm font-semibold">
      <Minus className="w-3.5 h-3.5" /> Stable
    </span>
  )
}

function MiniProgressBar({ sessions, isRounds }: { sessions: WorkoutProgress['sessions']; isRounds: boolean }) {
  const values = isRounds
    ? sessions.map(s => s.rounds || 0)
    : sessions.map(s => s.elapsedSeconds)

  const maxVal = Math.max(...values, 1)
  // Pour les temps, on inverse la logique (plus petit = mieux)
  const displayValues = isRounds ? values : values

  return (
    <div className="flex items-end gap-1 h-12">
      {displayValues.map((val, idx) => {
        const heightPercent = (val / maxVal) * 100
        const isLast = idx === displayValues.length - 1
        const isBest = isRounds
          ? val === Math.max(...values)
          : val === Math.min(...values.filter(v => v > 0))

        return (
          <div key={idx} className="flex flex-col items-center gap-1 flex-1">
            <div
              className={`w-full rounded-t transition-all ${
                isBest
                  ? 'bg-orange-600'
                  : isLast
                    ? 'bg-orange-600/50'
                    : 'bg-border'
              }`}
              style={{ height: `${Math.max(heightPercent, 8)}%` }}
              title={`${formatDate(sessions[idx].date)}: ${isRounds ? `${val} rounds` : formatTime(val)}`}
            />
            <span className="text-[9px] text-muted-foreground truncate w-full text-center">
              {formatDate(sessions[idx].date)}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function WorkoutProgressCard({ progress }: { progress: WorkoutProgress }) {
  const hasRounds = progress.bestRounds !== undefined && progress.bestRounds > 0
  const isAmrap = progress.workoutType?.toLowerCase().includes('amrap') || hasRounds

  return (
    <div className="bg-card border border-border rounded-lg p-5 hover:border-foreground/25 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-1 h-6 bg-orange-600 rounded-full flex-shrink-0" />
            <h3 className="font-display font-semibold truncate">{progress.workoutName}</h3>
          </div>
          <div className="flex items-center gap-2 ml-3">
            {progress.workoutType && (
              <span className="px-2 py-0.5 bg-orange-600/10 text-orange-600 rounded text-xs font-medium">
                {progress.workoutType.replace(/_/g, ' ')}
              </span>
            )}
            <span className="text-xs text-muted-foreground">
              {progress.sessionCount} session{progress.sessionCount > 1 ? 's' : ''}
            </span>
          </div>
        </div>
        <TrendIndicator trend={progress.trend} percent={progress.improvementPercent} />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {/* Best */}
        <div className="bg-secondary rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Meilleur</p>
          {isAmrap && progress.bestRounds ? (
            <p className="text-lg font-semibold text-orange-600">{progress.bestRounds} <span className="text-xs text-muted-foreground font-normal">rounds</span></p>
          ) : (
            <p className="text-lg font-semibold text-orange-600 font-mono">{formatTime(progress.bestTime)}</p>
          )}
        </div>
        {/* Last */}
        <div className="bg-secondary rounded-lg p-3">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Dernier</p>
          {isAmrap && progress.lastRounds ? (
            <p className="text-lg font-semibold text-foreground">{progress.lastRounds} <span className="text-xs text-muted-foreground font-normal">rounds</span></p>
          ) : (
            <p className="text-lg font-semibold text-foreground font-mono">{formatTime(progress.lastTime)}</p>
          )}
        </div>
      </div>

      {/* Mini progress chart */}
      {progress.sessions.length > 1 && (
        <MiniProgressBar sessions={progress.sessions} isRounds={isAmrap} />
      )}
    </div>
  )
}

export function WorkoutProgressComparison({ progressData, loading }: WorkoutProgressComparisonProps) {
  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <h2 className="font-display text-2xl font-semibold mb-6">Comparaison WOD</h2>
        <div className="flex items-center gap-3 py-3">
          <div className="w-5 h-5 rounded bg-orange-600/40 animate-pulse shrink-0" />
          <p className="text-muted-foreground text-sm">Chargement des progressions...</p>
        </div>
      </div>
    )
  }

  return (
    <motion.div
      variants={fadeInUp}
      className="bg-card border border-border rounded-lg p-6"
    >
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-5 h-5 text-muted-foreground" />
        <div>
          <h2 className="font-display text-2xl font-semibold">Comparaison WOD</h2>
          <p className="text-sm text-muted-foreground">Compare tes performances sur les mêmes workouts</p>
        </div>
      </div>

      {progressData.length === 0 ? (
        <div className="flex items-center gap-4 py-4 px-5 bg-secondary border border-border rounded-lg text-left">
          <BarChart3 className="w-6 h-6 text-muted-foreground shrink-0" />
          <div>
            <p className="text-foreground font-medium text-sm">Pas encore de comparaison disponible</p>
            <p className="text-xs text-muted-foreground mt-0.5">Fais le même WOD au moins 2 fois pour voir ta progression</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {progressData.map((progress) => (
            <WorkoutProgressCard key={progress.workoutId} progress={progress} />
          ))}
        </div>
      )}
    </motion.div>
  )
}
