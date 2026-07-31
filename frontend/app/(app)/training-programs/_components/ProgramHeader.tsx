'use client'

import { Button } from '@/components/ui/button'
import type { ActiveEnrollment } from '@/services/training-programs'
import { Pause, Play, XCircle } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  strength_building: 'Force',
  endurance_base: 'Endurance',
  competition_prep: 'Compétition',
  off_season: 'Off-season',
}

const STATUS_LABELS: Record<string, string> = {
  enrolled: 'Inscrit',
  active: 'En cours',
  paused: 'En pause',
}

interface ProgramHeaderProps {
  enrollment: ActiveEnrollment
  actionLoading: boolean
  onStart: () => void
  onPause: () => void
  onAbandon: () => void
}

export function ProgramHeader({ enrollment, actionLoading, onStart, onPause, onAbandon }: ProgramHeaderProps) {
  const progressPct = enrollment.total_sessions
    ? Math.round((enrollment.completed_sessions / enrollment.total_sessions) * 100)
    : 0
  const isActive = enrollment.status === 'active'

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-2">
        <span className="eyebrow">
          {TYPE_LABELS[enrollment.program_type] ?? enrollment.program_type} ·{' '}
          <span className={isActive ? 'text-primary' : ''}>
            {STATUS_LABELS[enrollment.status] ?? enrollment.status}
          </span>
        </span>
        <div className="text-right shrink-0">
          <div className="font-display text-4xl sm:text-5xl font-semibold leading-none">
            {enrollment.completed_sessions}
            <span className="text-2xl text-muted-foreground">/{enrollment.total_sessions}</span>
          </div>
          <div className="eyebrow mt-1">séances</div>
        </div>
      </div>

      <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-none tracking-tight">
        {enrollment.program_name}
      </h1>
      {enrollment.program_description && (
        <p className="text-muted-foreground max-w-2xl mt-4">{enrollment.program_description}</p>
      )}

      {/* Progression en segments */}
      <div className="mt-8 flex gap-1.5">
        {Array.from({ length: enrollment.total_sessions || 1 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 ${i < enrollment.completed_sessions ? 'bg-foreground' : 'bg-border'}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 eyebrow">
        <span>Semaine {enrollment.current_week} / {enrollment.duration_weeks}</span>
        <span>{progressPct} % complété</span>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        {enrollment.status === 'enrolled' && (
          <Button
            variant="outline"
            onClick={onStart}
            disabled={actionLoading}
            className="rounded-full border-border text-foreground hover:border-primary hover:text-primary"
          >
            <Play className="w-4 h-4 mr-2" /> Démarrer
          </Button>
        )}
        {enrollment.status === 'active' && (
          <Button
            variant="outline"
            onClick={onPause}
            disabled={actionLoading}
            className="rounded-full border-border text-foreground hover:border-primary hover:text-primary"
          >
            <Pause className="w-4 h-4 mr-2" /> Pause
          </Button>
        )}
        {enrollment.status === 'paused' && (
          <Button
            variant="outline"
            onClick={onStart}
            disabled={actionLoading}
            className="rounded-full border-border text-foreground hover:border-primary hover:text-primary"
          >
            <Play className="w-4 h-4 mr-2" /> Reprendre
          </Button>
        )}
        <Button
          variant="ghost"
          onClick={onAbandon}
          disabled={actionLoading}
          className="ml-auto text-muted-foreground hover:text-primary"
        >
          <XCircle className="w-4 h-4 mr-2" /> Abandonner
        </Button>
      </div>
    </div>
  )
}
