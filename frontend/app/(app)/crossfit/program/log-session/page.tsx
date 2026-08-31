'use client'

import { ProgramSessionDetail, type ProgramSessionData } from '@/components/program/ProgramSessionDetail'
import { StarRating } from '@/components/ui/star-rating'
import { TimeInput } from '@/components/ui/time-input'
import { scheduleApi, sessionService } from '@/services'
import type { WorkoutSchedule } from '@/services/schedule'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

function parseSessionData(raw: unknown): ProgramSessionData | null {
  if (!raw) return null
  if (typeof raw === 'object') return raw as ProgramSessionData
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw) as ProgramSessionData
    } catch {
      return null
    }
  }
  return null
}

const CONDITIONING_SCORE_LABELS: Record<string, string> = {
  time: 'Temps réalisé',
  rounds_and_reps: 'Score AMRAP',
  reps: 'Reps totales',
  calories: 'Calories totales',
  weight: 'Charge / poids',
}

function LogProgramSessionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const scheduleId = searchParams.get('scheduleId')

  const [schedule, setSchedule] = useState<WorkoutSchedule | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const [strengthNotes, setStrengthNotes] = useState<Record<number, string>>({})
  const [skillNote, setSkillNote] = useState('')
  const [conditioningNote, setConditioningNote] = useState('')

  const [timeMinutes, setTimeMinutes] = useState('')
  const [timeSeconds, setTimeSeconds] = useState('')
  const [capAtteint, setCapAtteint] = useState(false)
  const [capScore, setCapScore] = useState('')
  const [rounds, setRounds] = useState('')
  const [bonusReps, setBonusReps] = useState('')
  const [repsScore, setRepsScore] = useState('')
  const [caloriesScore, setCaloriesScore] = useState('')
  const [weightScore, setWeightScore] = useState('')

  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [sessionDate, setSessionDate] = useState(() => new Date().toISOString().slice(0, 16))

  useEffect(() => {
    if (!scheduleId) {
      setLoading(false)
      setLoadError(true)
      return
    }
    scheduleApi.getById(scheduleId)
      .then(setSchedule)
      .catch(() => setLoadError(true))
      .finally(() => setLoading(false))
  }, [scheduleId])

  const session = useMemo(() => parseSessionData(schedule?.session_data), [schedule])
  const movements = useMemo(() => session?.strength_work?.movements ?? [], [session])
  const scoreType = session?.conditioning?.score_type ?? undefined

  const handleStrengthNoteChange = (idx: number, value: string) => {
    setStrengthNotes((prev) => ({ ...prev, [idx]: value }))
  }

  const handleSave = async () => {
    const totalSeconds = (parseInt(timeMinutes || '0') * 60) + parseInt(timeSeconds || '0')

    if (scoreType === 'time' && !capAtteint && totalSeconds === 0) {
      toast.error('Saisis un temps ou coche "Cap atteint"')
      return
    }
    if (scoreType === 'rounds_and_reps' && !rounds && !bonusReps) {
      toast.error('Saisis un score AMRAP')
      return
    }
    if (scoreType === 'reps' && !repsScore) {
      toast.error('Saisis le nombre de reps')
      return
    }
    if (scoreType === 'calories' && !caloriesScore) {
      toast.error('Saisis le nombre de calories')
      return
    }
    if (scoreType === 'weight' && !weightScore.trim()) {
      toast.error('Saisis la charge réalisée')
      return
    }

    try {
      setIsSaving(true)

      const completedAt = new Date(sessionDate)
      const startedAt = new Date(completedAt.getTime() - totalSeconds * 1000)

      const created = await sessionService.startSession({
        started_at: startedAt.toISOString(),
      })

      const cleanStrengthNotes: Record<string, string> = {}
      for (const [idxStr, note] of Object.entries(strengthNotes)) {
        if (note.trim()) {
          const idx = parseInt(idxStr)
          const movement = movements[idx]
          if (movement) {
            const label = movements.filter((m, i) => m.name === movement.name && i < idx).length > 0
              ? `${movement.name} (${idx + 1})`
              : movement.name
            cleanStrengthNotes[label] = note.trim()
          }
        }
      }

      const results: Record<string, unknown> = {
        session_title: session?.title,
        program_enrollment_id: schedule?.program_enrollment_id,
        rating: rating > 0 ? rating : undefined,
        strength_notes: Object.keys(cleanStrengthNotes).length > 0 ? cleanStrengthNotes : undefined,
        skill_note: skillNote.trim() || undefined,
      }

      if (scoreType === 'time') {
        if (capAtteint) {
          results.cap_reached = true
          if (capScore) results.reps_at_cap = parseInt(capScore, 10)
        } else if (totalSeconds > 0) {
          results.elapsed_time_seconds = totalSeconds
        }
      } else if (scoreType === 'rounds_and_reps') {
        results.rounds = rounds ? parseInt(rounds) : undefined
        results.reps = bonusReps ? parseInt(bonusReps) : undefined
      } else if (scoreType === 'reps') {
        results.reps = repsScore ? parseInt(repsScore) : undefined
      } else if (scoreType === 'calories') {
        results.calories = caloriesScore ? parseInt(caloriesScore) : undefined
      } else if (scoreType === 'weight') {
        results.weight_result = weightScore.trim() || undefined
      } else if (session?.conditioning) {
        results.conditioning_note = conditioningNote.trim() || undefined
      }

      await sessionService.updateSession(created.id, {
        completed_at: completedAt.toISOString(),
        notes: notes || undefined,
        results,
      })

      if (scheduleId) {
        await scheduleApi.markAsCompleted(scheduleId, created.id)
      }

      toast.success('Séance enregistrée !')
      router.push('/calendar')
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setIsSaving(false)
    }
  }

  if (loading) {
    return <div className="max-w-3xl mx-auto text-muted-foreground">Chargement...</div>
  }

  if (loadError || !schedule || !session) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <p className="text-foreground">Impossible de charger cette séance planifiée.</p>
        <Link href="/calendar" className="text-primary hover:underline">Retour au calendrier</Link>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header séance */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-2">
          <h2 className="text-lg font-semibold text-foreground">{session.title}</h2>
          <div className="flex flex-wrap gap-2">
            {session.focus && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary capitalize">{session.focus}</span>
            )}
            {session.estimated_duration && (
              <span className="text-xs text-muted-foreground">{session.estimated_duration} min</span>
            )}
          </div>
        </div>

        {/* Contenu conditioning / skill / notes coach (lecture seule) */}
        <ProgramSessionDetail session={{ ...session, strength_work: null }} />

        {/* Force (éditable) */}
        {movements.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Force</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Charges, sensations, scaling...</p>
            </div>
            <div className="space-y-3">
              {movements.map((m, idx) => {
                const hints: string[] = []
                if (m.intensity) hints.push(m.intensity)
                if (m.rest) hints.push(`Repos ${m.rest}`)
                const placeholder = hints.length > 0 ? hints.join(' / ') : 'ex: 80kg, RPE 8...'
                return (
                  <div key={`${m.name}-${idx}`} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {m.sets ?? '—'} × {m.reps ?? '—'} — {m.name}
                      </p>
                      <input
                        type="text"
                        value={strengthNotes[idx] || ''}
                        onChange={(e) => handleStrengthNoteChange(idx, e.target.value)}
                        placeholder={placeholder}
                        className="w-full mt-1.5 px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Note skill (éditable) */}
        {session.skill_work && (
          <div className="bg-card border border-border rounded-lg p-5 space-y-3">
            <h2 className="text-lg font-semibold text-foreground">Skill</h2>
            <input
              type="text"
              value={skillNote}
              onChange={(e) => setSkillNote(e.target.value)}
              placeholder="Notes sur la technique, le ressenti..."
              className="w-full px-3 py-2 bg-background border border-border rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
        )}

        {/* Résultats */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-5">
          <h2 className="text-lg font-semibold text-foreground">Résultats</h2>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">Date et heure de la séance</label>
            <input
              type="datetime-local"
              value={sessionDate}
              onChange={(e) => setSessionDate(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>

          {scoreType === 'time' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm text-muted-foreground">{CONDITIONING_SCORE_LABELS.time}</label>
                <button
                  onClick={() => setCapAtteint(!capAtteint)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                    capAtteint
                      ? 'bg-destructive/10 border-destructive/40 text-destructive'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Cap atteint
                </button>
              </div>
              {!capAtteint ? (
                <TimeInput
                  minutes={timeMinutes}
                  seconds={timeSeconds}
                  onMinutesChange={setTimeMinutes}
                  onSecondsChange={setTimeSeconds}
                />
              ) : (
                <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    value={capScore}
                    onChange={(e) => setCapScore(e.target.value)}
                    placeholder="0"
                    className="w-24 bg-transparent text-foreground text-center text-xl font-mono outline-none"
                  />
                  <span className="text-destructive text-sm">reps au cap (score officiel)</span>
                </div>
              )}
            </div>
          )}

          {scoreType === 'rounds_and_reps' && (
            <div>
              <label className="block text-sm text-muted-foreground mb-2">{CONDITIONING_SCORE_LABELS.rounds_and_reps}</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={rounds}
                  onChange={(e) => setRounds(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-28 px-4 py-3 bg-background border border-border rounded-lg text-foreground text-center text-xl font-mono focus:outline-none focus:border-primary/50 transition-all"
                />
                <span className="text-muted-foreground font-semibold">rounds +</span>
                <input
                  type="number"
                  value={bonusReps}
                  onChange={(e) => setBonusReps(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-28 px-4 py-3 bg-background border border-border rounded-lg text-foreground text-center text-xl font-mono focus:outline-none focus:border-primary/50 transition-all"
                />
                <span className="text-muted-foreground">reps</span>
              </div>
            </div>
          )}

          {scoreType === 'reps' && (
            <div>
              <label className="block text-sm text-muted-foreground mb-2">{CONDITIONING_SCORE_LABELS.reps}</label>
              <input
                type="number"
                min="0"
                value={repsScore}
                onChange={(e) => setRepsScore(e.target.value)}
                placeholder="0"
                className="w-28 px-4 py-3 bg-background border border-border rounded-lg text-foreground text-center text-xl font-mono focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          )}

          {scoreType === 'calories' && (
            <div>
              <label className="block text-sm text-muted-foreground mb-2">{CONDITIONING_SCORE_LABELS.calories}</label>
              <input
                type="number"
                min="0"
                value={caloriesScore}
                onChange={(e) => setCaloriesScore(e.target.value)}
                placeholder="0"
                className="w-28 px-4 py-3 bg-background border border-border rounded-lg text-foreground text-center text-xl font-mono focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          )}

          {scoreType === 'weight' && (
            <div>
              <label className="block text-sm text-muted-foreground mb-2">{CONDITIONING_SCORE_LABELS.weight}</label>
              <input
                type="text"
                value={weightScore}
                onChange={(e) => setWeightScore(e.target.value)}
                placeholder="ex: 100kg"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          )}

          {!scoreType && session.conditioning && (
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Résultat</label>
              <input
                type="text"
                value={conditioningNote}
                onChange={(e) => setConditioningNote(e.target.value)}
                placeholder="Comment s'est passé le conditioning ?"
                className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-sm text-muted-foreground mb-2">Comment tu t&apos;es senti ?</label>
            <StarRating rating={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comment s'est passée ta séance ?"
              rows={3}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-20 sm:pb-8">
          <Link
            href="/calendar"
            className="flex-1 py-3.5 text-center border border-border bg-card text-foreground rounded-lg font-medium hover:bg-secondary/60 transition-colors"
          >
            Annuler
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer la séance'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function LogProgramSessionPage() {
  return <LogProgramSessionContent />
}
