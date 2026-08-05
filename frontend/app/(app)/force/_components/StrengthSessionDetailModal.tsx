'use client'

import { useState } from 'react'
import { X, Plus, Trash2, Edit2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  StrengthSession,
  SetLogged,
  SESSION_GOAL_LABELS,
  MUSCLE_LABELS,
  BLOCK_TYPE_LABELS,
  BODY_FOCUS_LABELS,
  TRAINING_STYLE_LABELS,
  strengthService,
  MuscleGroup,
} from '@/services/strength'

interface ExerciseEntry {
  name: string
  prescribedReps?: string
  sets: Array<{ reps: string; weight_kg: string }>
}

function Section({ label, action, children }: { label: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="py-3 first:pt-0 last:pb-0">
      <div className="flex items-center justify-between mb-2">
        <p className="eyebrow text-primary">{label}</p>
        {action}
      </div>
      {children}
    </div>
  )
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
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl bg-background rounded-lg border border-border shadow-2xl overflow-y-auto max-h-[90vh]">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background z-10">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {session.ai_plan?.session_name ?? 'Séance de force'}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {new Date(session.session_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
              {' · '}
              {SESSION_GOAL_LABELS[session.session_goal]}
              {session.body_focus && ` · ${BODY_FOCUS_LABELS[session.body_focus]}`}
              {session.training_style === 'strongman' && ` · ${TRAINING_STYLE_LABELS.strongman}`}
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-full transition-colors text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {mode === 'view' && (
            <>
              {/* Tags infos */}
              <div className="flex flex-wrap gap-2">
                {session.target_muscles.map(m => (
                  <span key={m} className="px-2.5 py-1 rounded-md text-sm bg-primary/10 text-primary border border-primary/20">
                    {MUSCLE_LABELS[m as MuscleGroup] ?? m}
                  </span>
                ))}
                {session.duration_minutes && (
                  <span className="px-2.5 py-1 rounded-md text-sm bg-secondary text-foreground border border-border">
                    {session.duration_minutes} min
                  </span>
                )}
                {session.perceived_effort && (
                  <span className="px-2.5 py-1 rounded-md text-sm bg-secondary text-foreground border border-border">
                    RPE {session.perceived_effort}/10
                  </span>
                )}
              </div>

              <div className="rounded-md border border-border bg-muted/30 px-4 divide-y-2 divide-border">
                {hasResults && (
                  <Section
                    label="Exercices réalisés"
                    action={
                      <button
                        onClick={initLogMode}
                        className="text-xs text-primary hover:underline flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Modifier
                      </button>
                    }
                  >
                    <ul className="space-y-2">
                      {groupedResults.map(ex => (
                        <li key={ex.name} className="text-sm">
                          <p className="font-medium text-foreground">{ex.name}</p>
                          <div className="mt-1 space-y-0.5">
                            {ex.sets.map((s, i) => (
                              <div key={i} className="flex items-baseline gap-3 text-xs text-muted-foreground">
                                <span className="w-14 shrink-0">Série {s.set_number}</span>
                                <span className="text-foreground font-medium">{s.reps} reps</span>
                                {s.weight_kg && <span>{s.weight_kg} kg</span>}
                              </div>
                            ))}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </Section>
                )}

                {session.ai_plan && (
                  <>
                    <Section label={`Échauffement · ${session.ai_plan.warmup.duration}`}>
                      <ul className="space-y-1">
                        {session.ai_plan.warmup.exercises.map((ex, i) => (
                          <li key={i} className="flex items-baseline justify-between gap-3 text-sm">
                            <span className="text-foreground">{ex.name}</span>
                            <span className="text-muted-foreground shrink-0">{ex.duration_or_reps}</span>
                          </li>
                        ))}
                      </ul>
                    </Section>

                    {session.ai_plan.blocks.map((block, bi) => (
                      <Section key={bi} label={`${block.block_name} · ${BLOCK_TYPE_LABELS[block.block_type]}`}>
                        <ul className="space-y-1.5">
                          {block.exercises.map((ex, ei) => (
                            <li key={ei} className="text-sm">
                              <div className="flex items-baseline gap-2">
                                <span className="shrink-0 font-semibold text-primary tabular-nums">
                                  {ex.sets} × {ex.reps}
                                </span>
                                <span className="text-foreground">{ex.name}</span>
                                {ex.intensity && (
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-medium bg-secondary text-muted-foreground">
                                    {ex.intensity}
                                  </span>
                                )}
                              </div>
                              {(ex.rest || ex.coaching_notes) && (
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {[ex.rest ? `Repos ${ex.rest}` : null, ex.coaching_notes].filter(Boolean).join(' · ')}
                                </p>
                              )}
                            </li>
                          ))}
                        </ul>
                      </Section>
                    ))}

                    {session.ai_plan.coaching_notes && (
                      <Section label="Notes du coach">
                        <p className="text-sm text-muted-foreground italic">{session.ai_plan.coaching_notes}</p>
                      </Section>
                    )}

                    {session.ai_plan.cooldown && (
                      <Section label="Retour au calme">
                        <p className="text-sm text-muted-foreground">{session.ai_plan.cooldown}</p>
                      </Section>
                    )}
                  </>
                )}

                {session.notes && (
                  <Section label={isAiSession ? 'Notes personnelles' : 'Plan de séance'}>
                    <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{session.notes}</p>
                  </Section>
                )}
              </div>

              {/* Bouton pour accéder au log */}
              {!hasResults && (
                <button
                  onClick={initLogMode}
                  className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md transition-all text-sm"
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
                <h3 className="text-base font-semibold text-foreground">
                  {isAiSession ? 'Résultats réels' : 'Exercices réalisés'}
                </h3>
                <button onClick={() => setMode('view')} className="text-sm text-muted-foreground hover:text-foreground">
                  Annuler
                </button>
              </div>

              {isAiSession && (
                <p className="text-xs text-muted-foreground">
                  Les exercices du programme sont pré-remplis. Complète les poids et ajuste les reps si nécessaire.
                </p>
              )}

              <div className="space-y-4">
                {exercises.map((ex, exIdx) => (
                  <div key={exIdx} className="bg-card border border-border rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        value={ex.name}
                        onChange={e => updateExerciseName(exIdx, e.target.value)}
                        placeholder="Nom de l'exercice"
                        readOnly={isAiSession}
                        className="flex-1 px-3 py-2 bg-secondary/40 border border-border rounded-md text-foreground text-sm font-medium focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground read-only:opacity-70 read-only:cursor-default"
                      />
                      {!isAiSession && (
                        <button onClick={() => removeExercise(exIdx)} className="text-muted-foreground hover:text-destructive shrink-0">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {ex.prescribedReps && (
                      <p className="text-xs text-muted-foreground">Prescrit : {ex.prescribedReps} reps</p>
                    )}

                    <div className="space-y-2">
                      <div className="grid grid-cols-[44px_1fr_1fr_20px] gap-2 text-xs font-medium text-muted-foreground px-1">
                        <span>Série</span>
                        <span>Reps</span>
                        <span>Poids (kg)</span>
                        <span />
                      </div>
                      {ex.sets.map((s, setIdx) => (
                        <div key={setIdx} className="grid grid-cols-[44px_1fr_1fr_20px] gap-2 items-center">
                          <span className="text-sm text-muted-foreground text-center">{setIdx + 1}</span>
                          <input
                            type="number"
                            min="0"
                            placeholder="8"
                            value={s.reps}
                            onChange={e => updateSet(exIdx, setIdx, 'reps', e.target.value)}
                            className="px-2.5 py-2 bg-secondary/40 border border-border rounded text-foreground text-sm focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="60"
                            value={s.weight_kg}
                            onChange={e => updateSet(exIdx, setIdx, 'weight_kg', e.target.value)}
                            className="px-2.5 py-2 bg-secondary/40 border border-border rounded text-foreground text-sm focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground"
                          />
                          {ex.sets.length > 1 && (
                            <button onClick={() => removeSet(exIdx, setIdx)} className="text-muted-foreground hover:text-destructive">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => addSet(exIdx)}
                      className="text-sm text-primary hover:underline flex items-center gap-1 pt-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Ajouter une série
                    </button>
                  </div>
                ))}
              </div>

              {!isAiSession && (
                <button
                  onClick={addExercise}
                  className="w-full py-2 border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50 rounded-md text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Ajouter un exercice
                </button>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-md transition-all disabled:opacity-50 text-sm"
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
