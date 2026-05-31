'use client'

import { MUSCLE_GROUPS, MUSCLE_LABELS, SESSION_GOAL_LABELS, SessionGoal, strengthService } from '@/services/strength'
import { X } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

const GOALS: SessionGoal[] = ['strength', 'hypertrophy', 'endurance', 'power']

const GOAL_COLORS: Record<SessionGoal, string> = {
  strength: 'bg-red-500/20 text-red-400 border-red-500/40',
  hypertrophy: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  endurance: 'bg-green-500/20 text-green-400 border-green-500/40',
  power: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
}

export function LogManualModal({ open, onOpenChange, onSuccess }: Props) {
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    session_date: new Date().toISOString().split('T')[0],
    session_goal: 'strength' as SessionGoal,
    target_muscles: [] as string[],
    duration_minutes: '',
    perceived_effort: '',
    notes: '',
  })

  const toggleMuscle = (m: string) =>
    setForm(f => ({
      ...f,
      target_muscles: f.target_muscles.includes(m)
        ? f.target_muscles.filter(x => x !== m)
        : [...f.target_muscles, m],
    }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.target_muscles.length === 0) {
      toast.error('Sélectionne au moins un groupe musculaire')
      return
    }
    setSaving(true)
    try {
      await strengthService.create({
        session_date: form.session_date,
        session_goal: form.session_goal,
        target_muscles: form.target_muscles,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
        perceived_effort: form.perceived_effort ? Number(form.perceived_effort) : undefined,
        notes: form.notes || undefined,
        source: 'manual',
      })
      toast.success('Séance enregistrée')
      setForm({
        session_date: new Date().toISOString().split('T')[0],
        session_goal: 'strength',
        target_muscles: [],
        duration_minutes: '',
        perceived_effort: '',
        notes: '',
      })
      onSuccess?.()
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => onOpenChange(false)} />
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-y-auto max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <h2 className="font-semibold text-white">Enregistrer une séance</h2>
          <button onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Date */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Date</label>
            <input
              type="date"
              value={form.session_date}
              onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 [color-scheme:dark]"
              required
            />
          </div>

          {/* Objectif */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Objectif</label>
            <div className="flex gap-2 flex-wrap">
              {GOALS.map(goal => (
                <button
                  key={goal}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, session_goal: goal }))}
                  className={`px-3 py-1 rounded-lg text-xs font-medium border transition-all ${
                    form.session_goal === goal ? GOAL_COLORS[goal] : 'bg-white/5 border-white/10 text-slate-400'
                  }`}
                >
                  {SESSION_GOAL_LABELS[goal]}
                </button>
              ))}
            </div>
          </div>

          {/* Muscles */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Groupes musculaires travaillés</label>
            <div className="flex gap-2 flex-wrap">
              {MUSCLE_GROUPS.map(muscle => (
                <button
                  key={muscle}
                  type="button"
                  onClick={() => toggleMuscle(muscle)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    form.target_muscles.includes(muscle)
                      ? 'bg-violet-500/20 border-violet-500/40 text-violet-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {MUSCLE_LABELS[muscle]}
                </button>
              ))}
            </div>
          </div>

          {/* Durée + RPE */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Durée (min)</label>
              <input
                type="number"
                min="1"
                max="300"
                placeholder="60"
                value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">RPE (1-10)</label>
              <input
                type="number"
                min="1"
                max="10"
                placeholder="7"
                value={form.perceived_effort}
                onChange={e => setForm(f => ({ ...f, perceived_effort: e.target.value }))}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 placeholder:text-slate-600"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Notes (optionnel)</label>
            <textarea
              rows={3}
              placeholder="Exercices réalisés, sensations..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 placeholder:text-slate-600 resize-none"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving}
            className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 text-sm"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer la séance'}
          </button>
        </form>
      </div>
    </div>
  )
}
