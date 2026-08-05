'use client'

import { BLOCK_TYPE_COLORS, BLOCK_TYPE_LABELS, GeneratedStrengthSession } from '@/services/strength'
import { Loader2, RotateCcw, Save, Sparkles } from 'lucide-react'
import { ReactNode } from 'react'

interface GeneratedStrengthResultProps {
  plan: GeneratedStrengthSession | null
  saving: boolean
  onSave: () => void
  regenerateLabel: string
  onRegenerate: () => void
  regenerateDisabled: boolean
  emptyStateText: ReactNode
}

export function GeneratedStrengthResult({
  plan, saving, onSave, regenerateLabel, onRegenerate, regenerateDisabled, emptyStateText,
}: GeneratedStrengthResultProps) {
  return (
    <div>
      {plan ? (
        <div className="space-y-4">
          {/* Infos générales */}
          <div className="bg-card border border-border rounded-lg p-4">
            <h3 className="text-lg font-bold text-foreground mb-1">{plan.session_name}</h3>
            {plan.coaching_notes && (
              <p className="text-sm text-muted-foreground mb-3 italic">{plan.coaching_notes}</p>
            )}
            <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
              <RotateCcw className="w-4 h-4 text-primary" />
              <span>~{plan.estimated_duration_minutes} min</span>
            </div>
          </div>

          {/* Échauffement */}
          <div className="bg-card border border-border border-l-4 border-l-green-500 rounded-r-lg p-3">
            <p className="text-xs font-semibold text-green-600 mb-1">Échauffement — {plan.warmup.duration}</p>
            {plan.warmup.exercises.map((ex, i) => (
              <p key={i} className="text-xs text-muted-foreground">
                <span className="text-foreground">{ex.name}</span> — {ex.duration_or_reps}
                {ex.notes && <span className="text-muted-foreground/70"> · {ex.notes}</span>}
              </p>
            ))}
          </div>

          {/* Blocs */}
          <div className="space-y-2">
            {plan.blocks.map((block, i) => (
              <div
                key={i}
                className={`border-l-4 pl-3 py-2 rounded-r-lg bg-card border border-border ${BLOCK_TYPE_COLORS[block.block_type] ?? 'border-l-border'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {block.block_type === 'rotation' && <RotateCcw className="w-3 h-3 text-primary shrink-0" />}
                  <span className="font-semibold text-sm text-foreground">{block.block_name}</span>
                  <span className="text-[10px] text-muted-foreground">— {BLOCK_TYPE_LABELS[block.block_type]}</span>
                </div>
                {block.exercises.map((ex, j) => (
                  <div key={j} className="mb-1">
                    <p className="text-xs text-muted-foreground">
                      <span className="text-foreground">{ex.name}</span>
                      {ex.equipment && <span className="text-muted-foreground/70"> ({ex.equipment})</span>}
                      {' '}— {ex.sets}×{ex.reps}
                      {ex.rest && <span className="text-muted-foreground/70"> · repos {ex.rest}</span>}
                      {ex.intensity && <span className="text-primary"> · {ex.intensity}</span>}
                    </p>
                    {ex.coaching_notes && (
                      <p className="text-[11px] text-muted-foreground/70 ml-2">{ex.coaching_notes}</p>
                    )}
                    {ex.alternatives && ex.alternatives.length > 0 && (
                      <p className="text-[10px] text-muted-foreground/60 ml-2">
                        Alt : {ex.alternatives.join(' / ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {plan.cooldown && (
            <div className="bg-card border border-border rounded-lg p-3">
              <p className="text-xs font-semibold text-muted-foreground mb-0.5">Retour au calme</p>
              <p className="text-xs text-muted-foreground/80">{plan.cooldown}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-all font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" />Sauvegarde...</>
                : <><Save className="w-4 h-4" />Sauvegarder cette séance</>
              }
            </button>
            <button
              onClick={onRegenerate}
              disabled={regenerateDisabled}
              className="flex items-center gap-1.5 px-4 py-3 text-muted-foreground border border-border rounded-md hover:bg-secondary hover:text-foreground transition-colors text-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />{regenerateLabel}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-dashed border-border rounded-lg p-8 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
          <Sparkles className="w-10 h-10 text-muted-foreground mb-3" />
          <p className="text-muted-foreground text-sm">{emptyStateText}</p>
          <p className="text-[11px] text-muted-foreground/70 mt-3 max-w-xs">
            L'IA inclut automatiquement des mouvements de rotation (Pallof press, landmine, bandes…)
          </p>
        </div>
      )}
    </div>
  )
}
