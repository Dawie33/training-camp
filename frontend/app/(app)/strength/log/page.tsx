'use client'

import { CorosImport } from '@/components/fit-import/CorosImport'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { MultiActivityFitData } from '@/services/fit-import'
import { MUSCLE_GROUPS, MUSCLE_LABELS, SESSION_GOAL_LABELS, SessionGoal, strengthService } from '@/services/strength'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const GOALS: SessionGoal[] = ['strength', 'hypertrophy', 'endurance', 'power']
const GOAL_COLORS: Record<SessionGoal, string> = {
  strength: 'bg-red-500/20 border-red-500/40 text-red-400',
  hypertrophy: 'bg-purple-500/20 border-purple-500/40 text-purple-400',
  endurance: 'bg-green-500/20 border-green-500/40 text-green-400',
  power: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
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
      await strengthService.create({
        session_date: form.session_date,
        session_goal: form.session_goal,
        target_muscles: form.target_muscles,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
        perceived_effort: form.perceived_effort ? Number(form.perceived_effort) : undefined,
        notes: form.notes || undefined,
        source: 'manual',
        ...(fitData && { ai_plan: { coros: { activities: fitData.activities, totals: fitData.totals } } as unknown as Record<string, unknown> }),
      })
      toast.success('Séance enregistrée !')
      router.push('/strength')
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div className="space-y-6 pb-8" initial="hidden" animate="visible" variants={staggerContainer}>

      <motion.div variants={fadeInUp} className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-5 space-y-4">
        <h2 className="text-base font-semibold text-white">Séance</h2>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Date</label>
          <input type="date" value={form.session_date}
            onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-violet-500/50 transition-all [color-scheme:dark]"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Objectif</label>
          <div className="flex gap-2 flex-wrap">
            {GOALS.map(goal => (
              <button key={goal} type="button"
                onClick={() => setForm(f => ({ ...f, session_goal: goal }))}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                  form.session_goal === goal ? GOAL_COLORS[goal] : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {SESSION_GOAL_LABELS[goal]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Groupes musculaires travaillés</label>
          <div className="flex gap-2 flex-wrap">
            {MUSCLE_GROUPS.map(muscle => (
              <button key={muscle} type="button"
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-400 mb-2">Durée (min)</label>
            <input type="number" min="1" max="300" placeholder="60"
              value={form.duration_minutes}
              onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-slate-600"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">RPE (1-10)</label>
            <input type="number" min="1" max="10" placeholder="7"
              value={form.perceived_effort}
              onChange={e => setForm(f => ({ ...f, perceived_effort: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-violet-500/50 transition-all placeholder:text-slate-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-400 mb-2">Notes (optionnel)</label>
          <textarea rows={3} placeholder="Exercices réalisés, sensations, charges..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:border-violet-500/50 transition-all"
          />
        </div>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <CorosImport accentColor="violet" onImport={handleCorosImport} onClear={() => setFitData(null)} />
      </motion.div>

      <motion.div variants={fadeInUp} className="flex gap-3">
        <Link href="/strength" className="flex-1 py-3.5 text-center border border-slate-700/50 bg-slate-800/50 text-slate-300 rounded-xl font-medium hover:bg-slate-700/50 transition-colors">
          Annuler
        </Link>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-3.5 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-500 transition-all disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer la séance'}
        </button>
      </motion.div>

    </motion.div>
  )
}
