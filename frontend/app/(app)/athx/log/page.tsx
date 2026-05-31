'use client'

import { CorosImport } from '@/components/fit-import/CorosImport'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { MultiActivityFitData } from '@/services/fit-import'
import { athxService, AthxSessionType, ATHX_SESSION_TYPE_LABELS } from '@/services/athx'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const SESSION_TYPES: AthxSessionType[] = ['full_competition', 'strength_prep', 'endurance_prep', 'metcon_prep', 'mixed']
const SESSION_TYPE_COLORS: Record<AthxSessionType, string> = {
  full_competition: 'bg-purple-500/20 border-purple-500/40 text-purple-400',
  strength_prep: 'bg-red-500/20 border-red-500/40 text-red-400',
  endurance_prep: 'bg-blue-500/20 border-blue-500/40 text-blue-400',
  metcon_prep: 'bg-orange-500/20 border-orange-500/40 text-orange-400',
  mixed: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400',
}

const ZONES = [
  { key: 'strength', label: 'Zone Force' },
  { key: 'endurance', label: 'Zone Endurance' },
  { key: 'metcon', label: 'MetCon X' },
]

export default function AthxLogPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [fitData, setFitData] = useState<MultiActivityFitData | null>(null)

  const [form, setForm] = useState({
    session_date: new Date().toISOString().split('T')[0],
    session_type: 'mixed' as AthxSessionType,
    duration_minutes: '',
    perceived_effort: '',
    notes: '',
  })

  const [zoneResults, setZoneResults] = useState<Record<string, { score: string; notes: string }>>({})

  const handleCorosImport = (data: MultiActivityFitData) => {
    setFitData(data)
    if (data.totals.duration_seconds) {
      setForm(f => ({ ...f, duration_minutes: String(Math.round(data.totals.duration_seconds / 60)) }))
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const zoneResultsPayload: Record<string, { score?: string; notes?: string }> = {}
      for (const [zone, result] of Object.entries(zoneResults)) {
        if (result.score || result.notes) {
          zoneResultsPayload[zone] = {
            score: result.score || undefined,
            notes: result.notes || undefined,
          }
        }
      }

      await athxService.create({
        session_date: form.session_date,
        session_type: form.session_type,
        duration_minutes: form.duration_minutes ? Number(form.duration_minutes) : undefined,
        perceived_effort: form.perceived_effort ? Number(form.perceived_effort) : undefined,
        notes: form.notes || undefined,
        zone_results: Object.keys(zoneResultsPayload).length > 0 ? zoneResultsPayload : undefined,
        source: 'manual',
      })
      toast.success('Séance ATHX enregistrée !')
      router.push('/athx')
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setSaving(false)
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
      initial="hidden" animate="visible" variants={staggerContainer}
    >
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <Link href="/athx" className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Enregistrer une séance</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Log une séance ATHX réalisée</p>
          </div>
        </motion.div>

        {/* Infos séance */}
        <motion.div variants={fadeInUp} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">Séance</h2>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Date</label>
            <input type="date" value={form.session_date}
              onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-all [color-scheme:dark]"
            />
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Type de séance</label>
            <div className="flex gap-2 flex-wrap">
              {SESSION_TYPES.map(type => (
                <button key={type} type="button"
                  onClick={() => setForm(f => ({ ...f, session_type: type }))}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                    form.session_type === type
                      ? SESSION_TYPE_COLORS[type]
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {ATHX_SESSION_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-2">Durée (min)</label>
              <input type="number" min="1" max="300" placeholder="150"
                value={form.duration_minutes}
                onChange={e => setForm(f => ({ ...f, duration_minutes: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-2">RPE (1-10)</label>
              <input type="number" min="1" max="10" placeholder="7"
                value={form.perceived_effort}
                onChange={e => setForm(f => ({ ...f, perceived_effort: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Notes (optionnel)</label>
            <textarea rows={3} placeholder="Sensations, performances par zone..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:border-purple-500/50 transition-all"
            />
          </div>
        </motion.div>

        {/* Résultats par zone */}
        <motion.div variants={fadeInUp} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Résultats par zone</h2>
            <p className="text-xs text-slate-500 mt-0.5">Optionnel — score et notes par zone de travail</p>
          </div>
          <div className="space-y-3">
            {ZONES.map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <p className="text-sm font-medium text-slate-300">{label}</p>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text" placeholder="Score / temps..."
                    value={zoneResults[key]?.score ?? ''}
                    onChange={e => setZoneResults(prev => ({ ...prev, [key]: { ...prev[key], score: e.target.value } }))}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-600"
                  />
                  <input
                    type="text" placeholder="Notes..."
                    value={zoneResults[key]?.notes ?? ''}
                    onChange={e => setZoneResults(prev => ({ ...prev, [key]: { ...prev[key], notes: e.target.value } }))}
                    className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Coros */}
        <motion.div variants={fadeInUp}>
          <CorosImport accentColor="purple" onImport={handleCorosImport} onClear={() => setFitData(null)} />
        </motion.div>

        {/* Actions */}
        <motion.div variants={fadeInUp} className="flex gap-3 pb-20 sm:pb-8">
          <Link href="/athx" className="flex-1 py-3.5 text-center border border-slate-700/50 bg-slate-800/50 text-slate-300 rounded-xl font-medium hover:bg-slate-700/50 transition-colors">
            Annuler
          </Link>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer la séance'}
          </button>
        </motion.div>

      </div>
    </motion.div>
  )
}
