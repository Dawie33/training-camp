'use client'

import { CorosImport } from '@/components/fit-import/CorosImport'
import { MultiActivityFitData } from '@/services/fit-import'
import { GeneratedStrengthSession, MUSCLE_GROUPS, MUSCLE_LABELS, SESSION_GOAL_LABELS, SessionGoal, strengthService } from '@/services/strength'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const GOALS: SessionGoal[] = ['strength', 'hypertrophy', 'endurance', 'power']
const GOAL_COLORS: Record<SessionGoal, string> = {
  strength: 'bg-red-50 border-red-400 text-red-700',
  hypertrophy: 'bg-purple-50 border-purple-400 text-purple-700',
  endurance: 'bg-emerald-50 border-emerald-400 text-emerald-700',
  power: 'bg-amber-50 border-amber-400 text-amber-700',
}

export default function StrengthLogPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [fitData, setFitData] = useState<MultiActivityFitData | null>(null)

  const [form, setForm] = useState({
    session_date: new Date().toISOString().split('T')[0],
    session_goal: 'strength' as SessionGoal,
    target_muscles: [] as string[],
    duration_minutes: '',
    perceived_effort: '',
    session_plan: '',
    notes: '',
  })

  const toggleMuscle = (m: string) =>
    setForm(f => ({
      ...f,
      target_muscles: f.target_muscles.includes(m) ? f.target_muscles.filter(x => x !== m) : [...f.target_muscles, m],
    }))

  const handleCorosImport = (data: MultiActivityFitData) => {
    setFitData(data)
    if (data.totals.duration_seconds) {
      setForm(f => ({ ...f, duration_minutes: String(Math.round(data.totals.duration_seconds / 60)) }))
    }
  }

  const handleSave = async () => {
    if (form.target_muscles.length === 0) {
      toast.error('Sélectionne au moins un groupe musculaire')
      return
    }

    setSaving(true)
    try {
      let ai_plan: GeneratedStrengthSession | undefined
      let notes = form.notes.trim() || undefined

      const planText = form.session_plan.trim()
      if (planText) {
        try {
          ai_plan = await strengthService.parseText(planText)
        } catch {
          toast.error("Impossible d'analyser le plan collé, il est enregistré tel quel")
          const notesParts = [planText, form.notes.trim()].filter(Boolean)
          notes = notesParts.length > 0 ? notesParts.join('\n\n---\n\n') : undefined
        }
      }

      if (!ai_plan && fitData) {
        ai_plan = { coros: { activities: fitData.activities, totals: fitData.totals } } as unknown as GeneratedStrengthSession
      }

      await strengthService.create({
        session_date: form.session_date,
        session_goal: form.session_goal,
        target_muscles: form.target_muscles,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
        perceived_effort: form.perceived_effort ? Number(form.perceived_effort) : undefined,
        notes,
        ...(ai_plan && { ai_plan }),
      })
      toast.success('Séance enregistrée !')
      router.push('/force')
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-3xl space-y-6">

      <div className="bg-card border border-border rounded-lg p-5 space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Séance</h2>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">Date</label>
          <input type="date" value={form.session_date}
            onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">Objectif</label>
          <div className="flex gap-2 flex-wrap">
            {GOALS.map(goal => (
              <button key={goal} type="button"
                onClick={() => setForm(f => ({ ...f, session_goal: goal }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  form.session_goal === goal ? GOAL_COLORS[goal] : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {SESSION_GOAL_LABELS[goal]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">Groupes musculaires travaillés</label>
          <div className="flex gap-2 flex-wrap">
            {MUSCLE_GROUPS.map(muscle => (
              <button key={muscle} type="button"
                onClick={() => toggleMuscle(muscle)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  form.target_muscles.includes(muscle)
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {MUSCLE_LABELS[muscle]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Durée (min)</label>
            <input type="number" min="1" max="300" placeholder="60"
              value={form.duration_minutes}
              onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">RPE (1-10)</label>
            <input type="number" min="1" max="10" placeholder="7"
              value={form.perceived_effort}
              onChange={e => setForm(f => ({ ...f, perceived_effort: e.target.value }))}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">
            Plan de séance (optionnel)
            <span className="text-xs text-muted-foreground/70"> — analysé automatiquement par l'IA à l'enregistrement</span>
          </label>
          <textarea
            rows={10}
            placeholder={"Colle ici le plan généré par l'IA…\n\nEx :\nBloc 1 — Compound lourd\n① Squat talon surélevé — 4 × 8\n…"}
            value={form.session_plan}
            onChange={e => setForm(f => ({ ...f, session_plan: e.target.value }))}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground resize-y focus:outline-none focus:border-primary/50 transition-all text-sm font-mono leading-relaxed"
          />
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">Notes personnelles (optionnel)</label>
          <textarea rows={3} placeholder="Sensations, charges utilisées, remarques…"
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
      </div>

      <CorosImport accentColor="orange" onImport={handleCorosImport} onClear={() => setFitData(null)} />

      <div className="flex gap-3 pb-20 sm:pb-8">
        <Link href="/force" className="flex-1 py-3.5 text-center border border-border bg-card text-foreground rounded-lg font-medium hover:bg-secondary/60 transition-colors">
          Annuler
        </Link>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving
            ? (form.session_plan.trim() ? 'Analyse et enregistrement...' : 'Enregistrement...')
            : 'Enregistrer la séance'}
        </button>
      </div>

    </div>
  )
}
