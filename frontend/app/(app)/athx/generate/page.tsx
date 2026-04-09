'use client'

import { fadeInUp, staggerContainer } from '@/lib/animations'
import { athxService, ATHX_SESSION_TYPE_LABELS, AthxSessionType, GeneratedAthxPlan } from '@/services/athx'
import { motion } from 'framer-motion'
import { ArrowLeft, BookOpen, CheckCircle, Dumbbell, Loader2, Sparkles, Timer } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'

const SESSION_TYPES: { value: AthxSessionType; description: string; color: string }[] = [
  { value: 'full_competition', description: 'Simulation 2h30 toutes zones', color: 'border-purple-500/40 data-[active=true]:bg-purple-500/20 data-[active=true]:border-purple-500' },
  { value: 'strength_prep', description: 'Force, haltérophilie, charges lourdes', color: 'border-red-500/40 data-[active=true]:bg-red-500/20 data-[active=true]:border-red-500' },
  { value: 'endurance_prep', description: 'Cardio soutenu, lactique, zone 4', color: 'border-blue-500/40 data-[active=true]:bg-blue-500/20 data-[active=true]:border-blue-500' },
  { value: 'metcon_prep', description: 'Fitness fonctionnel, mouvements variés', color: 'border-orange-500/40 data-[active=true]:bg-orange-500/20 data-[active=true]:border-orange-500' },
  { value: 'mixed', description: 'Multi-zones, préparation globale', color: 'border-yellow-500/40 data-[active=true]:bg-yellow-500/20 data-[active=true]:border-yellow-500' },
]

const ZONE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  warmup: { bg: 'bg-green-500/5', text: 'text-green-400', border: 'border-l-green-500' },
  strength: { bg: 'bg-red-500/5', text: 'text-red-400', border: 'border-l-red-500' },
  endurance: { bg: 'bg-blue-500/5', text: 'text-blue-400', border: 'border-l-blue-500' },
  metcon: { bg: 'bg-orange-500/5', text: 'text-orange-400', border: 'border-l-orange-500' },
  cooldown: { bg: 'bg-slate-500/5', text: 'text-slate-400', border: 'border-l-slate-500' },
}

export default function GenerateAthxPage() {
  const router = useRouter()
  const [sessionType, setSessionType] = useState<AthxSessionType>('metcon_prep')
  const [durationMinutes, setDurationMinutes] = useState(60)
  const [targetZones, setTargetZones] = useState('')
  const [competitionDate, setCompetitionDate] = useState('')
  const [additionalInstructions, setAdditionalInstructions] = useState('')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [plan, setPlan] = useState<GeneratedAthxPlan | null>(null)

  const handleGenerate = async () => {
    try {
      setLoading(true)
      const result = await athxService.generatePreview({
        session_type: sessionType, duration_minutes: durationMinutes,
        target_zones: targetZones || undefined,
        competition_date: competitionDate || undefined,
        additional_instructions: additionalInstructions || undefined,
      })
      setPlan(result)
    } catch { toast.error('Erreur lors de la génération') } finally { setLoading(false) }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      await athxService.generateAndSave({
        session_type: sessionType, duration_minutes: durationMinutes,
        target_zones: targetZones || undefined,
        competition_date: competitionDate || undefined,
        additional_instructions: additionalInstructions || undefined,
      })
      toast.success('Séance sauvegardée !')
      router.push('/athx')
    } catch { toast.error('Erreur lors de la sauvegarde') } finally { setSaving(false) }
  }

  return (
    <motion.div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white" initial="hidden" animate="visible" variants={staggerContainer}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <Link href="/athx" className="text-slate-400 hover:text-white transition-colors"><ArrowLeft className="w-5 h-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold"><span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Générer une séance ATHX</span></h1>
            <p className="text-sm text-slate-400">L'IA crée un plan de préparation adapté aux zones de compétition ATHX</p>
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Formulaire */}
          <motion.div variants={fadeInUp} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-3">Type de séance</label>
              <div className="grid grid-cols-1 gap-2">
                {SESSION_TYPES.map(({ value, description, color }) => (
                  <button key={value} data-active={sessionType === value} onClick={() => setSessionType(value)}
                    className={`text-left p-3 rounded-xl border bg-white/5 transition-all ${color}`}>
                    <p className="font-semibold text-sm text-white">{ATHX_SESSION_TYPE_LABELS[value]}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Durée — <span className="text-purple-400">{durationMinutes} min</span>
              </label>
              <input type="range" min={20} max={150} step={5} value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))} className="w-full accent-purple-400" />
              <div className="flex justify-between text-xs text-slate-500 mt-1"><span>20 min</span><span>1h15</span><span>2h30</span></div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Zones ciblées (optionnel)</label>
              <input type="text" value={targetZones} onChange={(e) => setTargetZones(e.target.value)}
                placeholder="ex : force et MetCon X"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Date de compétition (optionnel)</label>
              <input type="text" value={competitionDate} onChange={(e) => setCompetitionDate(e.target.value)}
                placeholder="ex : dans 6 semaines"
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">Instructions (optionnel)</label>
              <textarea value={additionalInstructions} onChange={(e) => setAdditionalInstructions(e.target.value)}
                rows={2} placeholder="ex : je veux travailler les faiblesses en endurance..."
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-purple-500 resize-none" />
            </div>

            <button onClick={handleGenerate} disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-400 border border-purple-500/30 rounded-xl hover:from-purple-500/30 hover:to-pink-500/30 transition-all font-semibold disabled:opacity-50">
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération...</> : <><Sparkles className="w-4 h-4" /> Générer la séance</>}
            </button>
          </motion.div>

          {/* Résultat */}
          <motion.div variants={fadeInUp}>
            {plan ? (
              <div className="space-y-4">
                <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                  <h3 className="text-lg font-bold text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-slate-400 mb-3">{plan.description}</p>
                  <div className="flex gap-4 text-sm">
                    <div className="flex items-center gap-1.5 text-slate-300"><Timer className="w-4 h-4 text-purple-400" /><span>{plan.duration_minutes} min</span></div>
                    <div className="flex items-center gap-1.5 text-slate-300"><Dumbbell className="w-4 h-4 text-red-400" /><span className="capitalize">{plan.difficulty}</span></div>
                  </div>
                </div>

                <div className="space-y-2">
                  {plan.blocks.map((block, i) => {
                    const colors = ZONE_COLORS[block.zone] || ZONE_COLORS.cooldown
                    return (
                      <div key={i} className={`border-l-4 rounded-r-xl p-3 ${colors.border} ${colors.bg}`}>
                        <div className="flex justify-between mb-1">
                          <span className={`font-semibold text-sm ${colors.text}`}>{block.label}</span>
                          <span className="text-xs text-slate-400">{block.duration_minutes} min</span>
                        </div>
                        <div className="space-y-1">
                          {block.exercises.slice(0, 3).map((ex, j) => (
                            <p key={j} className="text-xs text-slate-400">
                              <span className="text-white">{ex.name}</span>
                              {ex.sets && ex.reps && ` — ${ex.sets}×${ex.reps}`}
                              {ex.duration && ` — ${ex.duration}`}
                            </p>
                          ))}
                          {block.exercises.length > 3 && <p className="text-xs text-slate-500">+{block.exercises.length - 3} exercices...</p>}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1"><BookOpen className="w-3.5 h-3.5 text-yellow-400" /><span className="text-xs font-semibold text-slate-300">Conseils</span></div>
                    <p className="text-xs text-slate-400">{plan.coaching_tips}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3">
                    <div className="flex items-center gap-1.5 mb-1"><CheckCircle className="w-3.5 h-3.5 text-green-400" /><span className="text-xs font-semibold text-slate-300">Compétition</span></div>
                    <p className="text-xs text-slate-400">{plan.competition_notes}</p>
                  </div>
                </div>

                <button onClick={handleSave} disabled={saving}
                  className="w-full py-3 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-xl hover:bg-purple-500/30 transition-colors font-semibold disabled:opacity-50">
                  {saving ? 'Sauvegarde...' : 'Sauvegarder cette séance'}
                </button>
              </div>
            ) : (
              <div className="bg-white/5 border border-dashed border-white/10 rounded-xl p-8 text-center h-full flex flex-col items-center justify-center">
                <Sparkles className="w-10 h-10 text-slate-600 mb-3" />
                <p className="text-slate-500 text-sm">Remplis le formulaire et clique sur<br /><span className="text-purple-400">"Générer la séance"</span></p>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}
