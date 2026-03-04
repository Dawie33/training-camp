'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { ProgramSession, StrengthMovement } from '@/domain/entities/training-program'
import { useState } from 'react'
import { toast } from 'sonner'

interface SwapSessionModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  session: ProgramSession | null
  weekNum: number
  onSwap: (sessionInWeek: number, data: {
    swap_type: 'workout' | 'ai_regenerate' | 'exercise'
    week: number
    workout_id?: string
    movement_name?: string
    replacement_exercise?: Partial<StrengthMovement>
    instructions?: string
  }) => Promise<void>
}

type SwapTab = 'exercise' | 'ai_regenerate'

export function SwapSessionModal({ open, onOpenChange, session, weekNum, onSwap }: SwapSessionModalProps) {
  const [activeTab, setActiveTab] = useState<SwapTab>('exercise')
  const [selectedMovement, setSelectedMovement] = useState('')
  const [replacementName, setReplacementName] = useState('')
  const [replacementSets, setReplacementSets] = useState('3')
  const [replacementReps, setReplacementReps] = useState('10')
  const [replacementIntensity, setReplacementIntensity] = useState('')
  const [replacementRest, setReplacementRest] = useState('')
  const [aiInstructions, setAiInstructions] = useState('')
  const [saving, setSaving] = useState(false)

  if (!session) return null

  const movements = session.strength_work?.movements ?? []

  const handleSubmit = async () => {
    if (!session) return
    setSaving(true)
    try {
      if (activeTab === 'exercise') {
        if (!selectedMovement || !replacementName) {
          toast.error('Sélectionnez un exercice à remplacer et le nom du remplacement')
          return
        }
        await onSwap(session.session_in_week, {
          swap_type: 'exercise',
          week: weekNum,
          movement_name: selectedMovement,
          replacement_exercise: {
            name: replacementName,
            sets: parseInt(replacementSets),
            reps: replacementReps,
            intensity: replacementIntensity || undefined,
            rest: replacementRest || undefined,
          },
        })
      } else {
        await onSwap(session.session_in_week, {
          swap_type: 'ai_regenerate',
          week: weekNum,
          instructions: aiInstructions,
        })
      }
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">
            Modifier — {session.title}
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/5 rounded-xl">
          {([
            { key: 'exercise', label: 'Remplacer un exercice' },
            { key: 'ai_regenerate', label: 'Régénérer par l\'IA' },
          ] as { key: SwapTab; label: string }[]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-1 py-2 px-3 text-xs rounded-lg transition-all ${
                activeTab === key ? 'bg-orange-500 text-white font-medium' : 'text-slate-400 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === 'exercise' ? (
          <div className="space-y-4">
            {movements.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4">
                Aucun exercice de force dans cette séance. Utilisez &ldquo;Régénérer par l&apos;IA&rdquo;.
              </p>
            ) : (
              <>
                <div>
                  <label className="text-xs text-slate-400 mb-1.5 block">Exercice à remplacer</label>
                  <select
                    value={selectedMovement}
                    onChange={(e) => setSelectedMovement(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                  >
                    <option value="">Choisir un exercice...</option>
                    {movements.map((m) => (
                      <option key={m.name} value={m.name}>{m.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Nouvel exercice</label>
                    <input
                      value={replacementName}
                      onChange={(e) => setReplacementName(e.target.value)}
                      placeholder="ex: Goblet Squat"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">Séries</label>
                      <input
                        value={replacementSets}
                        onChange={(e) => setReplacementSets(e.target.value)}
                        type="number"
                        min="1"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">Reps</label>
                      <input
                        value={replacementReps}
                        onChange={(e) => setReplacementReps(e.target.value)}
                        placeholder="10"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-400 mb-1.5 block">Repos</label>
                      <input
                        value={replacementRest}
                        onChange={(e) => setReplacementRest(e.target.value)}
                        placeholder="2min"
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1.5 block">Intensité (optionnel)</label>
                    <input
                      value={replacementIntensity}
                      onChange={(e) => setReplacementIntensity(e.target.value)}
                      placeholder="ex: 70% 1RM"
                      className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">
              Décrivez ce que vous souhaitez adapter dans cette séance. L&apos;IA régénérera la session en tenant compte de vos instructions.
            </p>
            <textarea
              value={aiInstructions}
              onChange={(e) => setAiInstructions(e.target.value)}
              placeholder="ex: Remplacer les squats par des exercices sans barre, j'ai mal aux genoux..."
              rows={4}
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 resize-none"
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium text-sm hover:from-orange-600 hover:to-rose-600 transition-all disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Appliquer la modification'}
        </button>
      </DialogContent>
    </Dialog>
  )
}
