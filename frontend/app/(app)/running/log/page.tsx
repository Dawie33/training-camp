'use client'

import { CorosImport } from '@/components/fit-import/CorosImport'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { MultiActivityFitData } from '@/services/fit-import'
import { RUN_TYPE_LABELS, runningService, RunningSession, RunType } from '@/services/running'
import { motion } from 'framer-motion'
import { ChevronDown, Sparkles, X } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

const RUN_TYPES: RunType[] = ['easy', 'tempo', 'intervals', 'long_run', 'fartlek', 'recovery', 'race']

export default function RunningLogPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [fitData, setFitData] = useState<MultiActivityFitData | null>(null)

  const [aiPlans, setAiPlans] = useState<RunningSession[]>([])
  const [selectedPlan, setSelectedPlan] = useState<RunningSession | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [search, setSearch] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  useEffect(() => {
    runningService.getSessions({ limit: 50 })
      .then(res => setAiPlans(res.rows.filter(s => s.source === 'ai_generated')))
      .catch(() => { })
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelectPlan = (plan: RunningSession) => {
    setSelectedPlan(plan)
    setShowDropdown(false)
    setSearch('')
    setForm(f => ({
      ...f,
      run_type: plan.run_type,
      distance_km: plan.ai_plan?.total_distance_km ? String(plan.ai_plan.total_distance_km) : f.distance_km,
      minutes: plan.ai_plan?.estimated_duration_minutes ? String(plan.ai_plan.estimated_duration_minutes) : f.minutes,
      seconds: '0',
    }))
  }

  const handleClearPlan = () => {
    setSelectedPlan(null)
    setSearch('')
  }

  const filteredPlans = aiPlans.filter(p =>
    (p.ai_plan?.name ?? RUN_TYPE_LABELS[p.run_type]).toLowerCase().includes(search.toLowerCase())
  )

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
    <motion.div className="space-y-6 pb-8" initial="hidden" animate="visible" variants={staggerContainer}>

      {/* Sélection d'un plan IA */}
      <motion.div variants={fadeInUp} className="bg-card border border-border rounded-lg p-5">
        <h2 className="text-base font-semibold text-foreground mb-3">Séance planifiée (optionnel)</h2>
        <div className="relative" ref={dropdownRef}>
          {selectedPlan ? (
            <div className="flex items-center justify-between px-4 py-3 bg-primary/10 border border-primary/30 rounded-lg">
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {selectedPlan.ai_plan?.name ?? RUN_TYPE_LABELS[selectedPlan.run_type]}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {selectedPlan.ai_plan?.total_distance_km && `${selectedPlan.ai_plan.total_distance_km} km · `}
                    {selectedPlan.ai_plan?.estimated_duration_minutes && `${selectedPlan.ai_plan.estimated_duration_minutes} min`}
                  </p>
                </div>
              </div>
              <button onClick={handleClearPlan} className="ml-2 text-muted-foreground hover:text-foreground transition-colors shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={e => { setSearch(e.target.value); setShowDropdown(true) }}
                  onFocus={() => setShowDropdown(true)}
                  placeholder="Sélectionner un plan généré par l'IA..."
                  className="w-full px-4 py-3 pr-10 bg-card border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
                />
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-xl overflow-hidden">
                  {filteredPlans.length === 0 ? (
                    <p className="px-4 py-3 text-sm text-muted-foreground">Aucun plan trouvé</p>
                  ) : (
                    filteredPlans.map(plan => (
                      <button
                        key={plan.id}
                        onClick={() => handleSelectPlan(plan)}
                        className="w-full text-left px-4 py-3 hover:bg-secondary/60 transition-colors border-b border-border last:border-0"
                      >
                        <p className="text-sm font-medium text-foreground">
                          {plan.ai_plan?.name ?? RUN_TYPE_LABELS[plan.run_type]}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(plan.session_date).toLocaleDateString('fr-FR')}
                          {plan.ai_plan?.total_distance_km && ` · ${plan.ai_plan.total_distance_km} km`}
                          {plan.ai_plan?.estimated_duration_minutes && ` · ${plan.ai_plan.estimated_duration_minutes} min`}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </motion.div>

      <motion.div variants={fadeInUp} className="bg-card border border-border rounded-lg p-5 space-y-4">
        <h2 className="text-base font-semibold text-foreground">Sortie</h2>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">Date</label>
          <input type="date" value={form.session_date}
            onChange={e => setForm(f => ({ ...f, session_date: e.target.value }))}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">Type de sortie</label>
          <div className="flex gap-2 flex-wrap">
            {RUN_TYPES.map(type => (
              <button key={type} type="button"
                data-active={form.run_type === type}
                onClick={() => setForm(f => ({ ...f, run_type: type }))}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border bg-secondary/40 border-border text-muted-foreground transition-all data-[active=true]:bg-primary/10 data-[active=true]:border-primary data-[active=true]:text-primary hover:border-foreground/30"
              >
                {RUN_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-2">Distance (km)</label>
            <input type="number" min="0" step="0.01" placeholder="10.00"
              value={form.distance_km}
              onChange={e => setForm(f => ({ ...f, distance_km: e.target.value }))}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground"
            />
          </div>
          <div>
            <label className="block text-sm text-muted-foreground mb-2">FC moyenne (bpm)</label>
            <input type="number" min="40" max="220" placeholder="150"
              value={form.avg_heart_rate}
              onChange={e => setForm(f => ({ ...f, avg_heart_rate: e.target.value }))}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">Durée</label>
          <div className="flex items-center gap-2">
            {[
              { key: 'hours', label: 'hh', max: 9 },
              { key: 'minutes', label: 'mm', max: 59 },
              { key: 'seconds', label: 'ss', max: 59 },
            ].map(({ key, label, max }, i) => (
              <div key={key} className="flex items-center gap-2">
                {i > 0 && <span className="text-muted-foreground font-bold text-lg">:</span>}
                <input type="number" min="0" max={max} placeholder={label}
                  value={form[key as 'hours' | 'minutes' | 'seconds']}
                  onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                  className="w-16 px-2 py-3 bg-background border border-border rounded-lg text-foreground text-center text-xl font-mono focus:outline-none focus:border-primary/50 transition-all placeholder:text-muted-foreground"
                />
              </div>
            ))}
            {paceDisplay && (
              <span className="ml-2 text-sm text-primary font-mono">{paceDisplay}</span>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-2">Notes (optionnel)</label>
          <textarea rows={3} placeholder="Sensations, conditions météo, itinéraire..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
            className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 transition-all"
          />
        </div>
      </motion.div>

      <motion.div variants={fadeInUp}>
        <CorosImport accentColor="cyan" onImport={handleCorosImport} onClear={() => setFitData(null)} />
      </motion.div>

      <motion.div variants={fadeInUp} className="flex gap-3">
        <Link href="/running" className="flex-1 py-3.5 text-center border border-border bg-card text-foreground rounded-lg font-medium hover:bg-secondary/60 transition-colors">
          Annuler
        </Link>
        <button onClick={handleSave} disabled={saving}
          className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer la sortie'}
        </button>
      </motion.div>

    </motion.div>
  )
}
