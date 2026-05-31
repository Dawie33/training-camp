'use client'

import { CorosImport } from '@/components/fit-import/CorosImport'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { MultiActivityFitData } from '@/services/fit-import'
import { hyroxService, HyroxSessionType, HYROX_SESSION_TYPE_LABELS, HYROX_STATIONS, HYROX_STATION_LABELS } from '@/services/hyrox'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const SESSION_TYPES: HyroxSessionType[] = ['full_simulation', 'station_prep', 'run_prep', 'mixed']

function toSeconds(h: string, m: string, s: string) {
  return (parseInt(h || '0') * 3600) + (parseInt(m || '0') * 60) + (parseInt(s || '0'))
}

export default function HyroxLogPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [fitData, setFitData] = useState<MultiActivityFitData | null>(null)

  const [form, setForm] = useState({
    session_date: new Date().toISOString().split('T')[0],
    session_type: 'full_simulation' as HyroxSessionType,
    perceived_effort: '',
    notes: '',
    hours: '',
    minutes: '',
    seconds: '',
  })

  const [stationTimes, setStationTimes] = useState<Record<string, string>>({})

  const handleCorosImport = (data: MultiActivityFitData) => {
    setFitData(data)
    if (data.totals.duration_seconds) {
      const total = data.totals.duration_seconds
      setForm(f => ({
        ...f,
        hours: String(Math.floor(total / 3600)),
        minutes: String(Math.floor((total % 3600) / 60)),
        seconds: String(Math.floor(total % 60)),
      }))
    }
  }

  const handleSave = async () => {
    const totalSec = toSeconds(form.hours, form.minutes, form.seconds)
    if (form.session_type === 'full_simulation' && totalSec === 0) {
      toast.error('Saisis ton temps total')
      return
    }
    setSaving(true)
    try {
      const stationTimesArr = HYROX_STATIONS
        .filter(s => stationTimes[s])
        .map(s => ({ station: s, time_seconds: parseInt(stationTimes[s]) * 60 }))

      await hyroxService.create({
        session_date: form.session_date,
        session_type: form.session_type,
        total_time_seconds: totalSec > 0 ? totalSec : undefined,
        station_times: stationTimesArr.length > 0 ? stationTimesArr : undefined,
        perceived_effort: form.perceived_effort ? Number(form.perceived_effort) : undefined,
        notes: form.notes || undefined,
        source: 'manual',
      })
      toast.success('Séance HYROX enregistrée !')
      router.push('/hyrox')
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
          <Link href="/hyrox" className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Enregistrer une séance</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Log une séance HYROX réalisée</p>
          </div>
        </motion.div>

        {/* Infos séance */}
        <motion.div variants={fadeInUp} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
          <h2 className="text-lg font-semibold text-white">Séance</h2>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Date</label>
            <input type="date" value={form.session_date}
              onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-yellow-500/50 transition-all [color-scheme:dark]"
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
                      ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                  }`}
                >
                  {HYROX_SESSION_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>

          {/* Temps total */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Temps total</label>
            <div className="flex items-center gap-2">
              {[
                { key: 'hours', label: 'hh', max: 9 },
                { key: 'minutes', label: 'mm', max: 59 },
                { key: 'seconds', label: 'ss', max: 59 },
              ].map(({ key, label, max }, i) => (
                <div key={key} className="flex items-center gap-2">
                  {i > 0 && <span className="text-slate-500 font-bold text-lg">:</span>}
                  <input
                    type="number" min="0" max={max} placeholder={label}
                    value={form[key as 'hours' | 'minutes' | 'seconds']}
                    onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-16 px-2 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-center text-xl font-mono focus:outline-none focus:border-yellow-500/50 transition-all placeholder:text-slate-600"
                  />
                </div>
              ))}
              <span className="text-slate-500 text-sm ml-1">(hh : mm : ss)</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-slate-400 mb-2">RPE (1-10)</label>
              <input type="number" min="1" max="10" placeholder="7"
                value={form.perceived_effort}
                onChange={e => setForm(f => ({ ...f, perceived_effort: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-yellow-500/50 transition-all placeholder:text-slate-600"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Notes (optionnel)</label>
            <textarea rows={3} placeholder="Sensations, stratégie de pace..."
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:border-yellow-500/50 transition-all"
            />
          </div>
        </motion.div>

        {/* Temps par station */}
        <motion.div variants={fadeInUp} className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Temps par station</h2>
            <p className="text-xs text-slate-500 mt-0.5">Optionnel — saisis les temps en minutes</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {HYROX_STATIONS.map(station => (
              <div key={station}>
                <label className="block text-xs text-slate-400 mb-1">{HYROX_STATION_LABELS[station]}</label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number" min="0" placeholder="00"
                    value={stationTimes[station] ?? ''}
                    onChange={e => setStationTimes(prev => ({ ...prev, [station]: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500/50 transition-all placeholder:text-slate-600"
                  />
                  <span className="text-xs text-slate-500 shrink-0">min</span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Coros */}
        <motion.div variants={fadeInUp}>
          <CorosImport accentColor="yellow" onImport={handleCorosImport} onClear={() => setFitData(null)} />
        </motion.div>

        {/* Actions */}
        <motion.div variants={fadeInUp} className="flex gap-3 pb-20 sm:pb-8">
          <Link href="/hyrox" className="flex-1 py-3.5 text-center border border-slate-700/50 bg-slate-800/50 text-slate-300 rounded-xl font-medium hover:bg-slate-700/50 transition-colors">
            Annuler
          </Link>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 py-3.5 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold shadow-lg shadow-yellow-500/30 hover:shadow-yellow-500/50 transition-all disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer la séance'}
          </button>
        </motion.div>

      </div>
    </motion.div>
  )
}
