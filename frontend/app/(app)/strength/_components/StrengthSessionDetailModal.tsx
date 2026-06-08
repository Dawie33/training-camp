'use client'

import { useState } from 'react'
import { X, Plus, Trash2, ClipboardList, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  StrengthSession,
  SetLogged,
  SESSION_GOAL_LABELS,
  MUSCLE_LABELS,
  BLOCK_TYPE_LABELS,
  BLOCK_TYPE_COLORS,
  strengthService,
  MuscleGroup,
} from '@/services/strength'

interface ExerciseEntry {
  name: string
  prescribedReps?: string
  sets: Array<{ reps: string; weight_kg: string }>
}

interface Props {
  session: StrengthSession | null
  onClose: () => void
  onUpdate?: (updated: StrengthSession) => void
}

export function StrengthSessionDetailModal({ session, onClose, onUpdate }: Props) {
  const [mode, setMode] = useState<'view' | 'log'>('view')
  const [saving, setSaving] = useState(false)
  const [exercises, setExercises] = useState<ExerciseEntry[]>([])

  const initLogMode = () => {
    if (session?.sets_logged?.length) {
      const grouped: Record<string, Array<{ reps: string; weight_kg: string }>> = {}
      const order: string[] = []
      for (const s of session.sets_logged) {
        if (!grouped[s.exercise_name]) { grouped[s.exercise_name] = []; order.push(s.exercise_name) }
        grouped[s.exercise_name].push({ reps: String(s.reps), weight_kg: s.weight_kg ? String(s.weight_kg) : '' })
      }
      setExercises(order.map(name => ({ name, sets: grouped[name] })))
    } else if (session?.ai_plan) {
      const entries: ExerciseEntry[] = []
      for (const block of session.ai_plan.blocks) {
        for (const ex of block.exercises) {
          entries.push({
            name: ex.name,
            prescribedReps: String(ex.reps),
            sets: Array.from({ length: ex.sets }, () => ({
              reps: typeof ex.reps === 'number' ? String(ex.reps) : '',
              weight_kg: '',
            })),
          })
        }
      }
      setExercises(entries)
    } else {
      setExercises([{ name: '', sets: [{ reps: '', weight_kg: '' }] }])
    }
    setMode('log')
  }

  const addExercise = () =>
    setExercises(prev => [...prev, { name: '', sets: [{ reps: '', weight_kg: '' }] }])

  const removeExercise = (i: number) =>
    setExercises(prev => prev.filter((_, idx) => idx !== i))

  const addSet = (exIdx: number) =>
    setExercises(prev =>
      prev.map((ex, i) => i === exIdx ? { ...ex, sets: [...ex.sets, { reps: '', weight_kg: '' }] } : ex)
    )

  const removeSet = (exIdx: number, setIdx: number) =>
    setExercises(prev =>
      prev.map((ex, i) => i === exIdx ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) } : ex)
    )

  const updateSet = (exIdx: number, setIdx: number, field: 'reps' | 'weight_kg', value: string) =>
    setExercises(prev =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.map((s, j) => j === setIdx ? { ...s, [field]: value } : s) }
          : ex
      )
    )

  const updateExerciseName = (i: number, name: string) =>
    setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, name } : ex))

  const handleSave = async () => {
    if (!session) return
    const sets_logged: SetLogged[] = []
    for (const ex of exercises) {
      if (!ex.name.trim()) continue
      ex.sets.forEach((s, i) => {
        if (s.reps) {
          sets_logged.push({
            exercise_name: ex.name.trim(),
            set_number: i + 1,
            reps: Number(s.reps),
            weight_kg: s.weight_kg ? Number(s.weight_kg) : undefined,
          })
        }
      })
    }
    if (sets_logged.length === 0) {
      toast.error('Ajoute au moins une série avec des répétitions')
      return
    }
    setSaving(true)
    try {
      const updated = await strengthService.update(session.id, { sets_logged })
      toast.success('Résultats enregistrés')
      onUpdate?.(updated)
      setMode('view')
    } catch {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  if (!session) return null

  const hasResults = (session.sets_logged?.length ?? 0) > 0

  const groupedResults = (() => {
    if (!session.sets_logged?.length) return []
    const map: Record<string, SetLogged[]> = {}
    const order: string[] = []
    for (const s of session.sets_logged) {
      if (!map[s.exercise_name]) { map[s.exercise_name] = []; order.push(s.exercise_name) }
      map[s.exercise_name].push(s)
    }
    return order.map(name => ({ name, sets: map[name] }))
  })()

  const isAiSession = !!session.ai_plan

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 sticky top-0 bg-slate-900 z-10">
          <div>
            <h2 className="font-semibold text-white">
              {session.ai_plan?.session_name ?? 'Séance de force'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {new Date(session.session_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}
              {SESSION_GOAL_LABELS[session.session_goal]}
            </p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {mode === 'view' && (
            <>
              {/* Tags infos */}
              <div className="flex flex-wrap gap-2">
                {session.target_muscles.map(m => (
                  <span key={m} className="px-2 py-1 rounded-md text-xs bg-violet-500/15 text-violet-400 border border-violet-500/20">
                    {MUSCLE_LABELS[m as MuscleGroup] ?? m}
                  </span>
                ))}
                {session.duration_minutes && (
                  <span className="px-2 py-1 rounded-md text-xs bg-slate-700/50 text-slate-300">
                    {session.duration_minutes} min
                  </span>
                )}
                {session.perceived_effort && (
                  <span className="px-2 py-1 rounded-md text-xs bg-slate-700/50 text-slate-300">
                    RPE {session.perceived_effort}/10
                  </span>
                )}
              </div>

              {session.notes && (
                <p className="text-sm text-slate-400 whitespace-pre-wrap font-mono leading-relaxed">{session.notes}</p>
              )}

              {/* Résultats loggés */}
              {hasResults && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-white flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-violet-400" />
                      Exercices réalisés
                    </h3>
                    <button
                      onClick={initLogMode}
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1"
                    >
                      <Edit2 className="w-3 h-3" /> Modifier
                    </button>
                  </div>
                  <div className="space-y-3">
                    {groupedResults.map(ex => (
                      <div key={ex.name} className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-sm font-medium text-white mb-2">{ex.name}</p>
                        <div className="space-y-1">
                          {ex.sets.map((s, i) => (
                            <div key={i} className="flex items-center gap-3 text-xs text-slate-300">
                              <span className="w-14 text-slate-500">Série {s.set_number}</span>
                              <span className="font-medium">{s.reps} reps</span>
                              {s.weight_kg && <span className="text-slate-400">{s.weight_kg} kg</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Plan IA */}
              {session.ai_plan && (
                <div>
                  <h3 className="text-sm font-medium text-white mb-3">Programme</h3>

                  {session.ai_plan.coaching_notes && (
                    <p className="text-xs text-slate-400 italic mb-3">{session.ai_plan.coaching_notes}</p>
                  )}

                  <div className="mb-3 bg-slate-800/30 rounded-lg p-3">
                    <p className="text-xs font-medium text-amber-400 mb-2">
                      Échauffement · {session.ai_plan.warmup.duration}
                    </p>
                    <div className="space-y-1">
                      {session.ai_plan.warmup.exercises.map((ex, i) => (
                        <div key={i} className="flex items-baseline gap-2 text-xs">
                          <span className="text-white">{ex.name}</span>
                          <span className="text-slate-400">{ex.duration_or_reps}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {session.ai_plan.blocks.map((block, bi) => (
                    <div key={bi} className={`mb-3 bg-slate-800/30 rounded-lg p-3 border-l-2 ${BLOCK_TYPE_COLORS[block.block_type]}`}>
                      <p className="text-xs font-medium text-slate-300 mb-2">
                        {block.block_name}
                        <span className="ml-2 text-slate-500">({BLOCK_TYPE_LABELS[block.block_type]})</span>
                      </p>
                      <div className="space-y-2">
                        {block.exercises.map((ex, ei) => (
                          <div key={ei} className="text-xs">
                            <span className="text-white font-medium">{ex.name}</span>
                            <span className="text-slate-400 ml-2">
                              {ex.sets}×{ex.reps}
                              {ex.intensity && ` · ${ex.intensity}`}
                              {ex.rest && ` · Repos : ${ex.rest}`}
                            </span>
                            {ex.coaching_notes && (
                              <p className="text-slate-500 mt-0.5">{ex.coaching_notes}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}

                  {session.ai_plan.cooldown && (
                    <p className="text-xs text-slate-400 italic mt-2">
                      <span className="text-cyan-400 font-medium">Retour au calme : </span>
                      {session.ai_plan.cooldown}
                    </p>
                  )}
                </div>
              )}

              {/* Bouton pour accéder au log */}
              {!hasResults && (
                <button
                  onClick={initLogMode}
                  className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-sm"
                >
                  {isAiSession
                    ? 'Enregistrer les résultats de cette séance'
                    : 'Ajouter les exercices réalisés'}
                </button>
              )}
            </>
          )}

          {mode === 'log' && (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-white">
                  {isAiSession ? 'Résultats réels' : 'Exercices réalisés'}
                </h3>
                <button onClick={() => setMode('view')} className="text-xs text-slate-400 hover:text-white">
                  Annuler
                </button>
              </div>

              {isAiSession && (
                <p className="text-xs text-slate-400">
                  Les exercices du programme sont pré-remplis. Complète les poids et ajuste les reps si nécessaire.
                </p>
              )}

              <div className="space-y-4">
                {exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="bg-slate-800/50 rounded-lg p-3 space-y-2">
                    <div className="flex items-center gap-2">
                      <input
                        value={ex.name}
                        onChange={e => updateExerciseName(exIdx, e.target.value)}
                        placeholder="Nom de l'exercice"
                        readOnly={isAiSession}
                        className="flex-1 px-2.5 py-1.5 bg-slate-700/50 border border-white/10 rounded-lg text-white text-xs focus:outline-none focus:border-violet-500 placeholder:text-slate-600 read-only:opacity-70 read-only:cursor-default"
                      />
                      {!isAiSession && (
                        <button onClick={() => removeExercise(exIdx)} className="text-slate-500 hover:text-red-400 shrink-0">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    {ex.prescribedReps && (
                      <p className="text-xs text-slate-500">Prescrit : {ex.prescribedReps} reps</p>
                    )}

                    <div className="space-y-1.5">
                      <div className="grid grid-cols-[44px_1fr_1fr_20px] gap-2 text-[10px] text-slate-500 px-1">
                        <span>Série</span>
                        <span>Reps</span>
                        <span>Poids (kg)</span>
                        <span />
                      </div>
                      {ex.sets.map((s, setIdx) => (
                        <div key={setIdx} className="grid grid-cols-[44px_1fr_1fr_20px] gap-2 items-center">
                          <span className="text-xs text-slate-500 text-center">{setIdx + 1}</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="8"
                            value={s.reps}
                            onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                            className="px-2 py-1.5 bg-slate-700/50 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-violet-500 placeholder:text-slate-600"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="60"
                            value={s.weight_kg}
                            onChange={e => updateSet(exIdx, setIdx, 'weight_kg', e.target.value)}
                            className="px-2 py-1.5 bg-slate-700/50 border border-white/10 rounded text-white text-xs focus:outline-none focus:border-violet-500 placeholder:text-slate-600"
                          />
                          {ex.sets.length > 1 && (
                            <button onClick={() => removeSet(exIdx, setIdx)} className="text-slate-600 hover:text-red-400">
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addSet(exIdx)}
                      className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 pt-1"
                    >
                      <Plus className="w-3 h-3" /> Ajouter une série
                    </button>
                  </div>
                ))}
              </div>

              {!isAiSession && (
                <button
                  onClick={addExercise}
                  className="w-full py-2 border border-dashed border-white/20 text-slate-400 hover:text-white hover:border-violet-500 rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Ajouter un exercice
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
              >
                {saving ? 'Enregistrement...' : 'Sauvegarder les résultats'}
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
