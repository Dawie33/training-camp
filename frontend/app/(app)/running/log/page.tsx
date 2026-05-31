'use client'

import { CorosImport } from '@/components/fit-import/CorosImport'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { MultiActivityFitData } from '@/services/fit-import'
import { runningService, RunType, RUN_TYPE_LABELS } from '@/services/running'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const RUN_TYPES: RunType[] = ['easy', 'tempo', 'intervals', 'long_run', 'fartlek', 'recovery', 'race']
const RUN_TYPE_COLORS: Record<RunType, string> = {
  easy: 'bg-green-500/20 border-green-500/40 text-green-400',
  tempo: 'bg-orange-500/20 border-orange-500/40 text-orange-400',
  intervals: 'bg-red-500/20 border-red-500/40 text-red-400',
  long_run: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
  fartlek: 'bg-purple-500/20 border-purple-500/40 text-purple-400',
  recovery: 'bg-slate-500/20 border-slate-500/40 text-slate-400',
  race: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
}

export default function RunningLogPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [fitData, setFitData] = useState<MultiActivityFitData | null>(null)

  const [form, setForm] = useState({
    session_date: new Date().toISOString().split('T')[0],
    run_type: 'easy' as RunType,
    distance_km: '',
    hours: '',
    minutes: '',
    seconds: '',
    avg_heart_rate: '',
    notes: '',
  })

  const handleCorosImport = (data: MultiActivityFitData) => {
    setFitData(data)
    const total = data.totals
    const updates: Partial<typeof form> = {}
    if (total.duration_seconds) {
      updates.hours = String(Math.floor(total.duration_seconds / 3600))
      updates.minutes = String(Math.floor((total.duration_seconds % 3600) / 60))
      updates.seconds = String(Math.floor(total.duration_seconds % 60))
    }
    if (total.distance_meters && total.distance_meters > 0) {
      updates.distance_km = (total.distance_meters / 1000).toFixed(2)
    }
    const runActivity = data.activities.find(a => a.sport?.toLowerCase().includes('run'))
    if (runActivity?.avg_heart_rate) {
      updates.avg_heart_rate = String(runActivity.avg_heart_rate)
    }
    setForm(f => ({ ...f, ...updates }))
  }

  const handleSave = async () => {
    const durationSec =
      parseInt(form.hours || '0') * 3600 +
      parseInt(form.minutes || '0') * 60 +
      parseInt(form.seconds || '0')

    if (!form.distance_km && durationSec === 0) {
      toast.error('Saisis au moins une distance ou une durée')
      return
    }

    setSaving(true)
    try {
      await runningService.create({
        session_date: form.session_date,
        run_type: form.run_type,
        distance_km: form.distance_km ? Number(form.distance_km) : undefined,
        duration_seconds: durationSec > 0 ? durationSec : undefined,
        avg_pace_seconds_per_km:
          durationSec > 0 && form.distance_km
            ? Math.round(durationSec / Number(form.distance_km))
            : undefined,
        avg_heart_rate: form.avg_heart_rate ? Number(form.avg_heart_rate) : undefined,
        notes: form.notes || undefined,
        source: 'manual',
      })
      toast.success('Sortie enregistrée !')
      router.push('/running')
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  const durationSec =
    parseInt(form.hours || '0') * 3600 +
    parseInt(form.minutes || '0') * 60 +
    parseInt(form.seconds || '0')
  const pace =
    durationSec > 0 && Number(form.distance_km) > 0
      ? Math.round(durationSec / Number(form.distance_km))
      : null
  const paceDisplay = pace
    ? `${Math.floor(pace / 60)}:${String(pace % 60).padStart(2, '0')} /km`
    : null

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
      initial="hidden" animate="visible" variants={staggerContainer}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <Link href="/running" className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Enregistrer une sortie</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Log une sortie running réalisée</p>
          </div>
        </motion.div>

        {/* Infos sortie */}
        <motion.div variants={fadeInUp} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">Sortie</h2>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Date</label>
            <input type="date" value={form.session_date}
              onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 transition-all [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Type de sortie</label>
            <div className="flex gap-2 flex-wrap">
              {RUN_TYPES.map(type => (
                <button key={type} type="button"
                  onClick={() => setForm(f => ({ ...f, run_type: type }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    form.run_type === type
                      ? RUN_TYPE_COLORS[type]
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {RUN_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Distance + Durée */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Distance (km)</label>
              <input type="number" min="0" step="0.01" placeholder="10.00"
                value={form.distance_km}
                onChange={e => setForm(f => ({ ...f, distance_km: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">FC moyenne (bpm)</label>
              <input type="number" min="40" max="220" placeholder="150"
                value={form.avg_heart_rate}
                onChange={e => setForm(f => ({ ...f, avg_heart_rate: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Durée</label>
            <div className="flex items-center gap-2">
              {[
                { key: 'hours', label: 'hh', max: 9 },
                { key: 'minutes', label: 'mm', max: 59 },
                { key: 'seconds', label: 'ss', max: 59 },
              ].map(({ key, label, max }, i) => (
                <div key={key} className="flex items-center gap-2">
                  {i > 0 && <span className="text-slate-500 font-bold text-lg">:</span>}
                  <input type="number" min="0" max={max} placeholder={label}
                    value={form[key as 'hours' | 'minutes' | 'seconds']}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-16 px-2 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-center text-xl font-mono focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
              ))}
              {paceDisplay && (
                <span className="ml-2 text-sm text-cyan-400 font-mono">{paceDisplay}</span>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Notes (optionnel)</label>
            <textarea rows={3} placeholder="Sensations, conditions météo, itinéraire..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:border-cyan-500/50 transition-all"
            />
          </div>
        </motion.div>

        {/* Coros */}
        <motion.div variants={fadeInUp}>
          <CorosImport accentColor="cyan" onImport={handleCorosImport} onClear={() => setFitData(null)} />
        </motion.div>

        {/* Actions */}
        <motion.div variants={fadeInUp} className="flex gap-3 pb-20 sm:pb-8">
          <Link href="/running" className="flex-1 py-3.5 text-center border border-slate-700/50 bg-slate-800/50 text-slate-300 rounded-xl font-medium hover:bg-slate-700/50 transition-colors">
            Annuler
          </Link>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3.5 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-xl font-semibold shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer la sortie'}
          </button>
        </motion.div>

      </div>
    </motion.div>
  )
}
