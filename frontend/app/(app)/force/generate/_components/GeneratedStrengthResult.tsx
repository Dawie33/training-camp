'use client'

import { fadeInUp } from '@/lib/animations'
import { BLOCK_TYPE_COLORS, BLOCK_TYPE_LABELS, GeneratedStrengthSession } from '@/services/strength'
import { motion } from 'framer-motion'
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
    <motion.div variants={fadeInUp}>
      {plan ? (
        <div className="space-y-4">
          {/* Infos générales */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <h3 className="text-lg font-bold text-white mb-1">{plan.session_name}</h3>
            {plan.coaching_notes && (
              <p className="text-sm text-slate-400 mb-3 italic">{plan.coaching_notes}</p>
            )}
            <div className="flex items-center gap-1.5 text-slate-300 text-sm">
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span>~{plan.estimated_duration_minutes} min</span>
            </div>
          </div>

          {/* Échauffement */}
          <div className="bg-white/5 border border-green-500/20 border-l-4 border-l-green-500 rounded-r-xl p-3">
            <p className="text-xs font-semibold text-green-400 mb-1">Échauffement — {plan.warmup.duration}</p>
            {plan.warmup.exercises.map((ex, i) => (
              <p key={i} className="text-xs text-slate-400">
                <span className="text-white">{ex.name}</span> — {ex.duration_or_reps}
                {ex.notes && <span className="text-slate-500"> · {ex.notes}</span>}
              </p>
            ))}
          </div>

          {/* Blocs */}
          <div className="space-y-2">
            {plan.blocks.map((block, i) => (
              <div
                key={i}
                className={`border-l-4 pl-3 py-2 rounded-r-xl bg-white/5 ${BLOCK_TYPE_COLORS[block.block_type] ?? 'border-l-white/20'}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  {block.block_type === 'rotation' && <RotateCcw className="w-3 h-3 text-cyan-400 shrink-0" />}
                  <span className="font-semibold text-sm text-white">{block.block_name}</span>
                  <span className="text-[10px] text-slate-500">— {BLOCK_TYPE_LABELS[block.block_type]}</span>
                </div>
                {block.exercises.map((ex, j) => (
                  <div key={j} className="mb-1">
                    <p className="text-xs text-slate-400">
                      <span className="text-white">{ex.name}</span>
                      {ex.equipment && <span className="text-slate-500"> ({ex.equipment})</span>}
                      {' '}— {ex.sets}×{ex.reps}
                      {ex.rest && <span className="text-slate-500"> · repos {ex.rest}</span>}
                      {ex.intensity && <span className="text-violet-400"> · {ex.intensity}</span>}
                    </p>
                    {ex.coaching_notes && (
                      <p className="text-[11px] text-slate-500 ml-2">{ex.coaching_notes}</p>
                    )}
                    {ex.alternatives && ex.alternatives.length > 0 && (
                      <p className="text-[10px] text-slate-600 ml-2">
                        Alt : {ex.alternatives.join(' / ')}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {plan.cooldown && (
            <div className="bg-white/5 border border-slate-500/20 rounded-xl p-3">
              <p className="text-xs font-semibold text-slate-400 mb-0.5">Retour au calme</p>
              <p className="text-xs text-slate-500">{plan.cooldown}</p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={onSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-xl hover:bg-violet-500/30 transition-colors font-semibold text-sm disabled:opacity-50"
            >
              {saving
                ? <><Loader2 className="w-4 h-4 animate-spin" />Sauvegarde...</>
                : <><Save className="w-4 h-4" />Sauvegarder cette séance</>
              }
            </button>
            <button
              onClick={onRegenerate}
              disabled={regenerateDisabled}
              className="flex items-center gap-1.5 px-4 py-3 text-slate-400 border border-white/10 rounded-xl hover:bg-white/5 transition-colors text-sm disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />{regenerateLabel}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white/5 border border-dashed border-white/10 rounded-xl p-8 text-center h-full flex flex-col items-center justify-center min-h-[300px]">
          <Sparkles className="w-10 h-10 text-slate-600 mb-3" />
          <p className="text-slate-500 text-sm">{emptyStateText}</p>
          <p className="text-[11px] text-slate-600 mt-3 max-w-xs">
            L'IA inclut automatiquement des mouvements de rotation (Pallof press, landmine, bandes…)
          </p>
        </div>
      )}
    </motion.div>
  )
}
