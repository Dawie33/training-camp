'use client'

import { GeneratedRunningPlan, RUN_TYPE_LABELS } from '@/services/running'
import { BookOpen, CheckCircle, MapPin, Timer } from 'lucide-react'

const PHASE_LABELS: Record<string, string> = {
  warmup: 'Échauffement',
  main: 'Bloc principal',
  cooldown: 'Retour au calme',
  recovery: 'Récupération',
}

const PHASE_COLORS: Record<string, string> = {
  warmup: 'border-l-emerald-400 bg-emerald-50/50',
  main: 'border-l-primary bg-primary/5',
  cooldown: 'border-l-blue-400 bg-blue-50/50',
  recovery: 'border-l-border bg-secondary/40',
}

const ZONE_COLORS: Record<string, string> = {
  zone_1: 'text-emerald-700',
  zone_1_2: 'text-emerald-700',
  zone_2: 'text-teal-700',
  zone_3: 'text-amber-700',
  zone_4: 'text-orange-700',
  zone_5: 'text-red-700',
}

interface Props {
  plan: GeneratedRunningPlan
  onSave: () => void
  saving: boolean
}

export function RunPlanPreview({ plan, onSave, saving }: Props) {
  return (
    <div className="space-y-5">
      {/* En-tête du plan */}
      <div className="bg-card border border-border rounded-lg p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
          <span className="text-xs px-2 py-1 bg-primary/10 text-primary border border-primary/20 rounded flex-shrink-0">
            {RUN_TYPE_LABELS[plan.run_type]}
          </span>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

        <div className="flex gap-6 text-sm">
          <div className="flex items-center gap-1.5 text-foreground">
            <MapPin className="w-4 h-4 text-primary" />
            <span>{plan.total_distance_km} km</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground">
            <Timer className="w-4 h-4 text-primary" />
            <span>{plan.estimated_duration_minutes} min</span>
          </div>
          <div className="flex items-center gap-1.5 text-foreground">
            <span className="text-xs text-muted-foreground">Niveau</span>
            <span className="capitalize">{plan.difficulty}</span>
          </div>
        </div>
      </div>

      {/* Structure de la séance */}
      <div className="space-y-3">
        <h4 className="eyebrow">Structure</h4>
        {plan.structure.map((phase, i) => (
          <div
            key={i}
            className={`border-l-4 rounded-r-lg p-4 ${PHASE_COLORS[phase.phase] || PHASE_COLORS.main}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-foreground text-sm">{phase.label || PHASE_LABELS[phase.phase]}</span>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {phase.distance_km && <span>{phase.distance_km} km</span>}
                <span>{phase.duration_minutes} min</span>
              </div>
            </div>
            <p className="text-sm text-foreground mb-1">{phase.pace_description}</p>
            <p className={`text-xs font-medium ${ZONE_COLORS[phase.target_zone] || 'text-muted-foreground'}`}>
              {phase.target_zone.replace(/_/g, ' ')}
            </p>

            {/* Intervalles */}
            {phase.intervals && phase.intervals.length > 0 && (
              <div className="mt-3 space-y-1">
                {phase.intervals.map((interval, j) => (
                  <div key={j} className="text-xs text-muted-foreground bg-card rounded px-2 py-1.5">
                    <span className="text-foreground font-medium">{interval.repetitions}×</span>{' '}
                    {interval.effort_duration} à{' '}
                    <span className="text-primary">{interval.pace_description}</span>
                    {' '}— récup. {interval.recovery_duration}
                  </div>
                ))}
              </div>
            )}

            {phase.notes && (
              <p className="text-xs text-muted-foreground mt-2 italic">{phase.notes}</p>
            )}
          </div>
        ))}
      </div>

      {/* Conseils */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Conseils coach</h4>
          </div>
          <p className="text-sm text-muted-foreground">{plan.coaching_tips}</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-primary" />
            <h4 className="text-sm font-semibold text-foreground">Récupération</h4>
          </div>
          <p className="text-sm text-muted-foreground">{plan.recovery_notes}</p>
        </div>
      </div>

      {/* Bouton sauvegarder */}
      <button
        onClick={onSave}
        disabled={saving}
        className="w-full py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold disabled:opacity-50"
      >
        {saving ? 'Sauvegarde...' : 'Sauvegarder cette séance'}
      </button>
    </div>
  )
}
