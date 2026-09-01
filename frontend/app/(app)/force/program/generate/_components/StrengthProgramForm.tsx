'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import type { GenerateStrengthProgramDto } from '@/services/strength-program'
import { Loader2, Sparkles } from 'lucide-react'

const TRAINING_STYLES = [
  { value: 'force_max', label: 'Force max', description: 'Squat, soulevé de terre, développés — priorité aux mouvements principaux' },
  { value: 'hypertrophy', label: 'Hypertrophie', description: 'Plus de volume, plus d\'isolation, au service de la force à venir' },
  { value: 'powerlifting_peak', label: 'Powerlifting', description: 'Préparation compétition — peaking vers un 1RM sur les 3 mouvements' },
  { value: 'strongman_prep', label: 'Strongman', description: 'Yoke, farmer\'s walk, atlas stones, log press, sled, tire' },
] as const

const DURATIONS = [4, 6, 8, 12] as const
const SESSIONS = [1, 2, 3, 4, 5] as const

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

interface StrengthProgramFormProps {
  trainingStyle: NonNullable<GenerateStrengthProgramDto['training_style']>
  onTrainingStyleChange: (v: NonNullable<GenerateStrengthProgramDto['training_style']>) => void
  duration: GenerateStrengthProgramDto['duration_weeks']
  onDurationChange: (v: GenerateStrengthProgramDto['duration_weeks']) => void
  sessions: GenerateStrengthProgramDto['sessions_per_week']
  onSessionsChange: (v: GenerateStrengthProgramDto['sessions_per_week']) => void
  focus: string
  onFocusChange: (v: string) => void
  generating: boolean
  onGenerate: () => void
}

export function StrengthProgramForm({
  trainingStyle,
  onTrainingStyleChange,
  duration,
  onDurationChange,
  sessions,
  onSessionsChange,
  focus,
  onFocusChange,
  generating,
  onGenerate,
}: StrengthProgramFormProps) {
  return (
    <div className="space-y-6">
      {/* Style */}
      <div className="border border-border bg-card rounded-lg p-5 space-y-3">
        <h2 className="eyebrow">Style</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {TRAINING_STYLES.map((ts) => (
            <OptionButton key={ts.value} selected={trainingStyle === ts.value} onClick={() => onTrainingStyleChange(ts.value)} className="p-4">
              <p className="font-display font-semibold text-sm text-foreground">{ts.label}</p>
              <p className="text-xs mt-0.5 text-muted-foreground">{ts.description}</p>
            </OptionButton>
          ))}
        </div>
        <div className="mt-2">
          <label className="eyebrow mb-1.5 block">Objectif spécifique (optionnel)</label>
          <Input
            type="text"
            value={focus}
            onChange={(e) => onFocusChange(e.target.value)}
            placeholder="ex: passer 140kg au squat, préparer une compétition dans 3 mois..."
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
          <div className="grid grid-cols-3 gap-2">
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
