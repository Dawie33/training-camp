'use client'

import { Button } from '@/components/ui/button'
import { SessionPreviewCard } from '@/components/program/SessionPreviewCard'
import type { GeneratedProgram } from '@/services/training-programs'
import { CheckCircle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'

const LEVELS = [
  { value: 'beginner', label: 'Débutant' },
  { value: 'intermediate', label: 'Intermédiaire' },
  { value: 'advanced', label: 'Avancé' },
] as const

interface ProgramPreviewProps {
  preview: GeneratedProgram
  duration: number
  sessions: number
  expandedPhase: number
  onToggleExpandedPhase: (index: number) => void
  saving: boolean
  onBack: () => void
  onConfirm: () => void
}

export function ProgramPreview({
  preview,
  duration,
  sessions,
  expandedPhase,
  onToggleExpandedPhase,
  saving,
  onBack,
  onConfirm,
}: ProgramPreviewProps) {
  return (
    <div className="space-y-5">
      {/* Résumé programme */}
      <div className="border border-border bg-card rounded-lg p-5 space-y-3">
        <div>
          <h2 className="font-display text-2xl font-semibold leading-tight">{preview.name}</h2>
          <p className="text-sm text-muted-foreground mt-1">{preview.description}</p>
        </div>
        <div className="flex flex-wrap gap-2 pt-3 border-t border-border">
          <span className="eyebrow px-2 py-1 rounded bg-secondary">{duration} semaines</span>
          <span className="eyebrow px-2 py-1 rounded bg-secondary">{sessions}×/semaine</span>
          <span className="eyebrow px-2 py-1 rounded bg-secondary">{LEVELS.find((l) => l.value === preview.target_level)?.label}</span>
        </div>
        {preview.objectives && <p className="text-sm text-muted-foreground italic">« {preview.objectives} »</p>}
      </div>

      {/* Phases */}
      <div className="space-y-3">
        {preview.phases.map((phase, pi) => (
          <div key={pi} className="border border-border bg-card rounded-lg overflow-hidden">
            <button
              onClick={() => onToggleExpandedPhase(expandedPhase === pi ? -1 : pi)}
              className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/50 transition-colors"
            >
              <div className="text-left">
                <p className="font-display font-semibold text-foreground">
                  Phase {phase.phase_number} — {phase.name}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Semaines {phase.weeks.join(', ')} · {sessionsPerPhase(phase, sessions)}
                </p>
              </div>
              {expandedPhase === pi ? (
                <ChevronUp className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              )}
            </button>

            {expandedPhase === pi && (
              <div className="px-5 pb-5 space-y-3 border-t border-border pt-4">
                <p className="text-sm text-muted-foreground">{phase.description}</p>
                {phase.sessions.some((session) => session.week !== undefined) ? (
                  phase.weeks.map((week) => (
                    <div key={week} className="space-y-2">
                      <p className="eyebrow text-primary">Semaine {week}</p>
                      {phase.sessions
                        .filter((session) => session.week === week)
                        .map((session, si) => (
                          <SessionPreviewCard key={`${week}-${si}`} session={session} />
                        ))}
                    </div>
                  ))
                ) : (
                  phase.sessions.map((session, si) => <SessionPreviewCard key={si} session={session} />)
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Régénérer ou confirmer */}
      <div className="flex gap-3 pb-8">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1 rounded-full border-border text-foreground hover:border-primary hover:text-primary"
        >
          Modifier les paramètres
        </Button>
        <Button onClick={onConfirm} disabled={saving} className="flex-1 rounded-full font-display font-semibold">
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />Enregistrement...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />Démarrer ce programme
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

function sessionsPerPhase(phase: GeneratedProgram['phases'][number], expectedPerWeek: number): string {
  const sessionsWithWeek = phase.sessions.filter((session) => session.week !== undefined)
  if (sessionsWithWeek.length > 0) return `${expectedPerWeek} séances/sem.`
  return `${phase.sessions.length} séances`
}
