'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { GenerateProgramDto } from '@/services/training-programs'
import { Loader2, Sparkles } from 'lucide-react'

const PROGRAM_TYPES = [
  { value: 'strength_building', label: 'Force', description: 'Développer la force et les maxes' },
  { value: 'endurance_base', label: 'Endurance', description: 'Construire la base cardio et aérobie' },
  { value: 'competition_prep', label: 'Compétition', description: 'Préparer une compétition CrossFit' },
  { value: 'off_season', label: 'Off-season', description: 'Développement général hors saison' },
] as const

const DURATIONS = [4, 6, 8, 12] as const
const SESSIONS = [2, 3, 4, 5] as const
const LEVELS = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
] as const

function OptionButton({
  selected,
  onClick,
  children,
  className,
}: {
  selected: boolean
  onClick: () => void
  children: React.ReactNode
  className?: string
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'rounded-md border text-left transition-colors',
        selected
          ? 'bg-secondary border-primary text-foreground'
          : 'bg-card border-border text-muted-foreground hover:border-foreground/25',
        className
      )}
    >
      {children}
    </button>
  )
}

interface ProgramFormProps {
  programType: GenerateProgramDto['program_type']
  onProgramTypeChange: (v: GenerateProgramDto['program_type']) => void
  duration: GenerateProgramDto['duration_weeks']
  onDurationChange: (v: GenerateProgramDto['duration_weeks']) => void
  sessions: GenerateProgramDto['sessions_per_week']
  onSessionsChange: (v: GenerateProgramDto['sessions_per_week']) => void
  level: GenerateProgramDto['target_level']
  onLevelChange: (v: GenerateProgramDto['target_level']) => void
  focus: string
  onFocusChange: (v: string) => void
  generating: boolean
  onGenerate: () => void
}

export function ProgramForm({
  programType,
  onProgramTypeChange,
  duration,
  onDurationChange,
  sessions,
  onSessionsChange,
  level,
  onLevelChange,
  focus,
  onFocusChange,
  generating,
  onGenerate,
}: ProgramFormProps) {
  return (
    <div className="space-y-6">
      {/* Objectif */}
      <div className="border border-border bg-card rounded-lg p-5 space-y-3">
        <h2 className="eyebrow">Objectif</h2>
        <div className="grid grid-cols-2 gap-3">
          {PROGRAM_TYPES.map((pt) => (
            <OptionButton key={pt.value} selected={programType === pt.value} onClick={() => onProgramTypeChange(pt.value)} className="p-4">
              <p className="font-display font-semibold text-sm text-foreground">{pt.label}</p>
              <p className="text-xs mt-0.5 text-muted-foreground">{pt.description}</p>
            </OptionButton>
          ))}
        </div>
        <div className="mt-2">
          <label className="eyebrow mb-1.5 block">Objectif spécifique (optionnel)</label>
          <Input
            type="text"
            value={focus}
            onChange={(e) => onFocusChange(e.target.value)}
            placeholder="ex: 10km dans 6 mois, améliorer mon deadlift..."
          />
        </div>
      </div>

      {/* Durée + Séances */}
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-border bg-card rounded-lg p-5 space-y-3">
          <h2 className="eyebrow">Durée</h2>
          <div className="grid grid-cols-2 gap-2">
            {DURATIONS.map((d) => (
              <OptionButton
                key={d}
                selected={duration === d}
                onClick={() => onDurationChange(d)}
                className="py-2.5 text-center text-sm font-semibold font-display"
              >
                {d} sem.
              </OptionButton>
            ))}
          </div>
        </div>

        <div className="border border-border bg-card rounded-lg p-5 space-y-3">
          <h2 className="eyebrow">Séances/sem.</h2>
          <div className="grid grid-cols-2 gap-2">
            {SESSIONS.map((s) => (
              <OptionButton
                key={s}
                selected={sessions === s}
                onClick={() => onSessionsChange(s)}
                className="py-2.5 text-center text-sm font-semibold font-display"
              >
                {s}×
              </OptionButton>
            ))}
          </div>
        </div>
      </div>

      {/* Niveau */}
      <div className="border border-border bg-card rounded-lg p-5 space-y-3">
        <h2 className="eyebrow">Niveau</h2>
        <div className="flex gap-3">
          {LEVELS.map((l) => (
            <OptionButton
              key={l.value}
              selected={level === l.value}
              onClick={() => onLevelChange(l.value)}
              className="flex-1 py-3 text-center text-sm font-semibold font-display"
            >
              {l.label}
            </OptionButton>
          ))}
        </div>
      </div>

      {/* Résumé + CTA */}
      <div className="flex items-center justify-between gap-4 border border-border bg-secondary/40 rounded-lg px-5 py-4">
        <div className="text-sm text-muted-foreground">
          <span className="text-foreground font-semibold">{duration} semaines</span> ·{' '}
          <span className="text-foreground font-semibold">{sessions}×/sem.</span> · {duration * sessions} séances au
          total
        </div>
        <Button onClick={onGenerate} disabled={generating} className="rounded-full font-display font-semibold shrink-0">
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />Génération...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 mr-2" />Générer
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
