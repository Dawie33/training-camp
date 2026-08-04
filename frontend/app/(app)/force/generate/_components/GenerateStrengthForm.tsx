'use client'

import { fadeInUp } from '@/lib/animations'
import {
  BODY_FOCUS_LABELS,
  BodyFocus,
  MUSCLE_LABELS,
  MuscleGroup,
  SESSION_GOAL_LABELS,
  SessionGoal,
  TRAINING_STYLE_LABELS,
  TrainingStyle,
} from '@/services/strength'
import { motion } from 'framer-motion'
import { CheckCircle2, Clock, Dumbbell, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const BODY_PARTS = {
  upper: { label: 'Haut du corps', icon: '💪', muscles: ['chest', 'back', 'shoulders', 'arms', 'forearms'] as MuscleGroup[] },
  lower: { label: 'Bas du corps', icon: '🦵', muscles: ['legs', 'glutes', 'core'] as MuscleGroup[] },
}

const GOALS: { value: SessionGoal; description: string; reps: string }[] = [
  { value: 'strength', description: 'Charges lourdes, faibles reps', reps: '3-6 reps · RPE 8-9' },
  { value: 'hypertrophy', description: 'Volume et tension', reps: '8-12 reps · RPE 7-8' },
  { value: 'endurance', description: 'Résistance musculaire', reps: '15-20+ reps · RPE 6-7' },
  { value: 'power', description: 'Mouvements explosifs', reps: '3-5 reps · RPE 7-8' },
]

const GOAL_COLORS: Record<SessionGoal, string> = {
  strength: 'border-red-500/40 data-[active=true]:bg-red-500/20 data-[active=true]:border-red-500',
  hypertrophy: 'border-purple-500/40 data-[active=true]:bg-purple-500/20 data-[active=true]:border-purple-500',
  endurance: 'border-green-500/40 data-[active=true]:bg-green-500/20 data-[active=true]:border-green-500',
  power: 'border-yellow-500/40 data-[active=true]:bg-yellow-500/20 data-[active=true]:border-yellow-500',
}

const BODY_FOCUS_OPTIONS: BodyFocus[] = ['upper_body', 'lower_body', 'full_body']
const TRAINING_STYLE_OPTIONS: TrainingStyle[] = ['traditional', 'strongman']

const CROSSFIT_BOX_EQUIPMENT = [
  'barbell', 'bumper-plates', 'dumbbell', 'kettlebell', 'rings',
  'pull-up-bar', 'rower', 'assault-bike', 'bike-erg', 'ski-erg',
  'jump-rope', 'rack', 'box', 'bench', 'GHD',
]

type EquipmentMode = 'saved' | 'bodyweight' | 'crossfit'

interface GenerateStrengthFormProps {
  selectedMuscles: MuscleGroup[]
  setSelectedMuscles: (v: MuscleGroup[] | ((prev: MuscleGroup[]) => MuscleGroup[])) => void
  toggleMuscle: (m: MuscleGroup) => void
  sessionGoal: SessionGoal
  setSessionGoal: (v: SessionGoal) => void
  bodyFocus: BodyFocus
  setBodyFocus: (v: BodyFocus) => void
  trainingStyle: TrainingStyle
  setTrainingStyle: (v: TrainingStyle) => void
  targetDurationMinutes: number | undefined
  setTargetDurationMinutes: (v: number | undefined) => void
  equipment: string[]
  setEquipment: (v: string[]) => void
  profileEquipment: string[]
  loadingProfile: boolean
  additionalContext: string
  setAdditionalContext: (v: string) => void
  personalized: boolean
  setPersonalized: (v: boolean) => void
  loading: boolean
  onGenerate: () => void
}

export function GenerateStrengthForm({
  selectedMuscles, setSelectedMuscles, toggleMuscle,
  sessionGoal, setSessionGoal,
  bodyFocus, setBodyFocus,
  trainingStyle, setTrainingStyle,
  targetDurationMinutes, setTargetDurationMinutes,
  equipment, setEquipment, profileEquipment, loadingProfile,
  additionalContext, setAdditionalContext,
  personalized, setPersonalized,
  loading, onGenerate,
}: GenerateStrengthFormProps) {
  const [equipmentMode, setEquipmentMode] = useState<EquipmentMode>('saved')

  useEffect(() => {
    if (equipmentMode === 'bodyweight') setEquipment([])
    else if (equipmentMode === 'crossfit') setEquipment(CROSSFIT_BOX_EQUIPMENT)
    else setEquipment(profileEquipment)
  }, [equipmentMode, profileEquipment, setEquipment])

  const toggleBodyPart = (part: 'upper' | 'lower') => {
    const muscles = BODY_PARTS[part].muscles
    const allSelected = muscles.every(m => selectedMuscles.includes(m))
    if (allSelected) {
      setSelectedMuscles(prev => prev.filter(m => !muscles.includes(m)))
    } else {
      setSelectedMuscles(prev => [...new Set([...prev, ...muscles])])
    }
  }

  const isBodyPartFull = (part: 'upper' | 'lower') =>
    BODY_PARTS[part].muscles.every(m => selectedMuscles.includes(m))

  const isBodyPartPartial = (part: 'upper' | 'lower') =>
    BODY_PARTS[part].muscles.some(m => selectedMuscles.includes(m)) && !isBodyPartFull(part)

  return (
    <motion.div variants={fadeInUp} className="space-y-5">
      {/* Mode coach personnalisé */}
      <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
        <div>
          <p className="text-sm font-semibold text-white">Mode coach personnalisé</p>
          <p className="text-xs text-slate-400 mt-0.5">Adapte la séance à ton profil, tes 1RMs et ton historique</p>
        </div>
        <div className="flex items-center gap-2">
          {personalized && (
            <span className="px-2 py-0.5 bg-violet-500/20 text-violet-400 text-xs font-medium rounded-full border border-violet-500/30">
              Basé sur ton profil
            </span>
          )}
          <button
            type="button"
            onClick={() => setPersonalized(!personalized)}
            className={`relative w-11 h-6 rounded-full transition-colors ${personalized ? 'bg-violet-500' : 'bg-slate-700'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${personalized ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Groupes musculaires */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-3">
          Groupes musculaires ciblés
          {selectedMuscles.length > 0 && (
            <span className="ml-2 text-violet-400 font-normal">({selectedMuscles.length} sélectionnés)</span>
          )}
        </label>

        {/* Boutons haut / bas du corps */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {(Object.entries(BODY_PARTS) as [keyof typeof BODY_PARTS, typeof BODY_PARTS[keyof typeof BODY_PARTS]][]).map(([key, part]) => (
            <button
              key={key}
              onClick={() => toggleBodyPart(key)}
              className={`p-3 rounded-xl border transition-all text-left ${
                isBodyPartFull(key)
                  ? 'bg-violet-500/20 border-violet-500 text-white'
                  : isBodyPartPartial(key)
                    ? 'bg-violet-500/10 border-violet-500/50 text-white'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{part.label}</span>
                {isBodyPartFull(key) && <CheckCircle2 className="w-4 h-4 text-violet-400" />}
                {isBodyPartPartial(key) && <span className="text-xs text-violet-400">{BODY_PARTS[key].muscles.filter(m => selectedMuscles.includes(m)).length}/{part.muscles.length}</span>}
              </div>
              <p className="text-[11px] mt-0.5 opacity-60">
                {part.muscles.map(m => MUSCLE_LABELS[m]).join(', ')}
              </p>
            </button>
          ))}
        </div>

        {/* Muscles détaillés pour affiner */}
        {selectedMuscles.length > 0 && (
          <div className="space-y-2">
            {(Object.entries(BODY_PARTS) as [keyof typeof BODY_PARTS, typeof BODY_PARTS[keyof typeof BODY_PARTS]][]).map(([key, part]) => {
              if (!isBodyPartFull(key) && !isBodyPartPartial(key)) return null
              return (
                <div key={key} className="flex flex-wrap gap-1.5">
                  {part.muscles.map(m => (
                    <button
                      key={m}
                      onClick={() => toggleMuscle(m)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                        selectedMuscles.includes(m)
                          ? 'bg-violet-500/20 border-violet-500/60 text-violet-300'
                          : 'bg-white/5 border-white/10 text-slate-500 hover:border-white/20 hover:text-slate-300'
                      }`}
                    >
                      {MUSCLE_LABELS[m]}
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Objectif */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-3">Objectif</label>
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map(({ value, description, reps }) => (
            <button
              key={value}
              data-active={sessionGoal === value}
              onClick={() => setSessionGoal(value)}
              className={`text-left p-3 rounded-xl border bg-white/5 transition-all ${GOAL_COLORS[value]}`}
            >
              <p className="font-semibold text-sm text-white">{SESSION_GOAL_LABELS[value]}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">{description}</p>
              <p className="text-[10px] text-slate-500 mt-0.5">{reps}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Focus corporel */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-3">Focus corporel</label>
        <div className="grid grid-cols-3 gap-2">
          {BODY_FOCUS_OPTIONS.map((value) => (
            <button
              key={value}
              data-active={bodyFocus === value}
              onClick={() => setBodyFocus(value)}
              className="text-center p-2.5 rounded-xl border bg-white/5 border-white/10 transition-all data-[active=true]:bg-violet-500/20 data-[active=true]:border-violet-500 hover:border-white/20"
            >
              <p className="font-semibold text-sm text-white">{BODY_FOCUS_LABELS[value]}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Style d'entraînement */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-3">Style d'entraînement</label>
        <div className="grid grid-cols-2 gap-2">
          {TRAINING_STYLE_OPTIONS.map((value) => (
            <button
              key={value}
              data-active={trainingStyle === value}
              onClick={() => setTrainingStyle(value)}
              className="text-left p-3 rounded-xl border bg-white/5 border-white/10 transition-all data-[active=true]:bg-orange-500/20 data-[active=true]:border-orange-500 hover:border-white/20"
            >
              <p className="font-semibold text-sm text-white">{TRAINING_STYLE_LABELS[value]}</p>
              {value === 'strongman' && (
                <p className="text-[11px] mt-0.5 opacity-60">
                  L'IA privilégie yoke walk, atlas stone, sled, farmer's walk… adaptés à ton matériel
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Durée cible */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-400" />Durée cible
          {targetDurationMinutes === undefined && (
            <span className="ml-1 text-slate-500 font-normal text-xs">(libre)</span>
          )}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[undefined, 30, 45, 60, 75, 90].map((duration) => (
            <button
              key={duration ?? 'libre'}
              onClick={() => setTargetDurationMinutes(duration)}
              data-active={targetDurationMinutes === duration}
              className="text-center p-2.5 rounded-xl border bg-white/5 border-white/10 transition-all data-[active=true]:bg-violet-500/20 data-[active=true]:border-violet-500 hover:border-white/20"
            >
              <p className="font-semibold text-sm text-white">
                {duration === undefined ? 'Libre' : `${duration} min`}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Équipement */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
          <Dumbbell className="w-4 h-4 text-slate-400" />Équipement disponible
        </label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          <button
            onClick={() => setEquipmentMode('saved')}
            className={`text-left p-3 rounded-xl border transition-all ${
              equipmentMode === 'saved'
                ? 'bg-violet-500/20 border-violet-500 text-violet-400'
                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            <div className="mb-0.5">
              <p className="font-semibold text-sm">Mon équipement</p>
            </div>
            <p className="text-[11px] mt-0.5 opacity-70">Profil utilisateur</p>
          </button>
          <button
            onClick={() => setEquipmentMode('bodyweight')}
            className={`text-left p-3 rounded-xl border transition-all ${
              equipmentMode === 'bodyweight'
                ? 'bg-slate-500/20 border-slate-400 text-slate-300'
                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            <div className="mb-0.5">
              <p className="font-semibold text-sm">Poids du corps</p>
            </div>
            <p className="text-[11px] mt-0.5 opacity-70">Aucun équipement</p>
          </button>
          <button
            onClick={() => setEquipmentMode('crossfit')}
            className={`text-left p-3 rounded-xl border transition-all ${
              equipmentMode === 'crossfit'
                ? 'bg-orange-500/20 border-orange-500 text-orange-400'
                : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/20'
            }`}
          >
            <div className="mb-0.5">
              <p className="font-semibold text-sm">Box CrossFit</p>
            </div>
            <p className="text-[11px] mt-0.5 opacity-70">Tout le matériel</p>
          </button>
        </div>

        {equipmentMode === 'crossfit' && (
          <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 mb-3">
            <div className="flex flex-wrap gap-1.5">
              {CROSSFIT_BOX_EQUIPMENT.map((e) => (
                <span key={e} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-orange-500/20 text-orange-300 border border-orange-500/30">
                  <CheckCircle2 className="w-3 h-3" />{e}
                </span>
              ))}
            </div>
          </div>
        )}

        {equipmentMode === 'saved' && (
          <div className="rounded-lg border border-white/10 bg-white/5 p-3">
            {loadingProfile ? (
              <p className="text-xs text-slate-500">Chargement...</p>
            ) : equipment.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {equipment.map((e) => (
                  <span key={e} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    <CheckCircle2 className="w-3 h-3" />{e}
                  </span>
                ))}
              </div>
            ) : (
              <>
                <p className="text-xs text-slate-400">Aucun équipement enregistré → poids du corps.</p>
                <Link href="/profile" className="text-xs text-violet-400 hover:underline mt-1 inline-block">
                  Configurer mon équipement →
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Contexte */}
      <div>
        <label className="block text-sm font-semibold text-slate-300 mb-2">
          Contexte / instructions (optionnel)
        </label>
        <textarea
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          rows={2}
          placeholder="ex : j'ai mal au coude gauche, éviter les extensions triceps..."
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 resize-none"
        />
      </div>

      <button
        onClick={onGenerate}
        disabled={loading || selectedMuscles.length === 0}
        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-500/20 to-purple-500/20 text-violet-400 border border-violet-500/30 rounded-xl hover:from-violet-500/30 hover:to-purple-500/30 transition-all font-semibold disabled:opacity-50"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours...</>
          : <><Sparkles className="w-4 h-4" /> Générer la séance</>
        }
      </button>
    </motion.div>
  )
}
