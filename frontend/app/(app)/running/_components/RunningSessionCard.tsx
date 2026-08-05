'use client'

import { formatDuration, formatPace, RUN_TYPE_LABELS, RunningSession } from '@/services/running'
import { Activity, Clock, MapPin, Trash2, X, Zap } from 'lucide-react'
import { useState } from 'react'

interface Props {
  session: RunningSession
  onDelete: (id: string) => void
}

const SOURCE_LABEL: Record<string, string> = {
  strava: 'Strava',
  ai_generated: 'IA',
  manual: 'Manuel',
}

export function RunningSessionCard({ session, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false)
  const typeLabel = RUN_TYPE_LABELS[session.run_type] || session.run_type

  const date = new Date(session.session_date)
  const formattedDate = date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })

  return (
    <div className="bg-card border border-border rounded-lg p-4 hover:bg-secondary/40 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="text-xs font-semibold px-2 py-0.5 rounded border bg-primary/10 text-primary border-primary/20">
              {typeLabel}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground border border-border">
              {SOURCE_LABEL[session.source]}
            </span>
            <span className="text-xs text-muted-foreground">{formattedDate}</span>
          </div>

          {/* Métriques */}
          <div className="flex flex-wrap gap-4 text-sm">
            {session.distance_km && (
              <div className="flex items-center gap-1.5 text-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span className="font-medium">{Number(session.distance_km).toFixed(2)} km</span>
              </div>
            )}
            {session.duration_seconds && (
              <div className="flex items-center gap-1.5 text-foreground">
                <Clock className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>{formatDuration(session.duration_seconds)}</span>
              </div>
            )}
            {session.avg_pace_seconds_per_km && (
              <div className="flex items-center gap-1.5 text-foreground">
                <Activity className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>{formatPace(session.avg_pace_seconds_per_km)}</span>
              </div>
            )}
            {session.avg_heart_rate && (
              <div className="flex items-center gap-1.5 text-foreground">
                <Zap className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                <span>{session.avg_heart_rate} bpm</span>
              </div>
            )}
          </div>

          {session.notes && (
            <p className="text-xs text-muted-foreground mt-2 truncate">{session.notes}</p>
          )}

          {/* Plan IA résumé */}
          {session.ai_plan && (
            <p className="text-xs text-primary mt-1.5 italic truncate">
              Plan IA : {session.ai_plan.name}
            </p>
          )}
        </div>

        {confirming ? (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => onDelete(session.id)}
              className="text-xs px-2 py-1 rounded bg-destructive/10 text-destructive border border-destructive/30 hover:bg-destructive/20 transition-colors"
            >
              Supprimer
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-muted-foreground hover:text-foreground transition-colors p-1"
              aria-label="Annuler"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="text-muted-foreground hover:text-destructive transition-colors flex-shrink-0 p-1"
            aria-label="Supprimer la séance"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
