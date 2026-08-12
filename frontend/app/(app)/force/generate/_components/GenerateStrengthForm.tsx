'use client'

import {
  LOWER_BODY_MUSCLES,
  MUSCLE_LABELS,
  MuscleGroup,
  SESSION_GOAL_LABELS,
  SessionGoal,
  TRAINING_STYLE_LABELS,
  TrainingStyle,
  UPPER_BODY_MUSCLES,
} from '@/services/strength'
import { CheckCircle2, Clock, Dumbbell, Loader2, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const BODY_PARTS = {
  upper: { label: 'Haut du corps', icon: '💪', muscles: UPPER_BODY_MUSCLES },
  lower: { label: 'Bas du corps', icon: '🦵', muscles: LOWER_BODY_MUSCLES },
}

const GOALS: { value: SessionGoal; description: string; reps: string }[] = [
  { value: 'strength', description: 'Charges lourdes, faibles reps', reps: '3-6 reps · RPE 8-9' },
  { value: 'hypertrophy', description: 'Volume et tension', reps: '8-12 reps · RPE 7-8' },
  { value: 'endurance', description: 'Résistance musculaire', reps: '15-20+ reps · RPE 6-7' },
  { value: 'power', description: 'Mouvements explosifs', reps: '3-5 reps · RPE 7-8' },
]

const TRAINING_STYLE_OPTIONS: TrainingStyle[] = ['traditional', 'strongman']

const CROSSFIT_BOX_EQUIPMENT = [
  'barbell', 'bumper-plates', 'dumbbell', 'kettlebell', 'rings',
  'pull-up-bar', 'rower', 'assault-bike', 'bike-erg', 'ski-erg',
  'jump-rope', 'rack', 'box', 'bench', 'GHD', 'landmine', 'sandbag',
]

type EquipmentMode = 'saved' | 'bodyweight' | 'crossfit'

const EQUIPMENT_MODES: { id: EquipmentMode; label: string; description: string }[] = [
  { id: 'saved', label: 'Mon équipement', description: 'Profil utilisateur' },
  { id: 'bodyweight', label: 'Poids du corps', description: 'Aucun équipement' },
  { id: 'crossfit', label: 'Box CrossFit', description: 'Tout le matériel' },
]

interface GenerateStrengthFormProps {
  selectedMuscles: MuscleGroup[]
  setSelectedMuscles: (v: MuscleGroup[] | ((prev: MuscleGroup[]) => MuscleGroup[])) => void
  toggleMuscle: (m: MuscleGroup) => void
  sessionGoal: SessionGoal
  setSessionGoal: (v: SessionGoal) => void
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
    <div className="bg-card rounded-lg p-4 lg:p-6 border border-border space-y-4 lg:space-y-5">
      <h2 className="text-lg lg:text-xl font-bold text-foreground">Paramètres de la séance</h2>

      {/* Mode coach personnalisé */}
      <div className="flex items-center justify-between p-3 rounded-md bg-secondary/40 border border-border">
        <div>
          <p className="text-sm font-semibold text-foreground">Mode coach personnalisé</p>
          <p className="text-xs text-muted-foreground mt-0.5">Adapte la séance à ton profil, tes 1RMs et ton historique</p>
        </div>
        <div className="flex items-center gap-2">
          {personalized && (
            <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded-full border border-primary/30">
              Basé sur ton profil
            </span>
          )}
          <button
            type="button"
            onClick={() => setPersonalized(!personalized)}
            className={`relative w-11 h-6 rounded-full transition-colors ${personalized ? 'bg-primary' : 'bg-muted'}`}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${personalized ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>
      </div>

      {/* Groupes musculaires */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">
          Groupes musculaires ciblés
          {selectedMuscles.length > 0 && (
            <span className="ml-2 text-primary font-normal">({selectedMuscles.length} sélectionnés)</span>
          )}
        </label>

        {/* Boutons haut / bas du corps */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {(Object.entries(BODY_PARTS) as [keyof typeof BODY_PARTS, typeof BODY_PARTS[keyof typeof BODY_PARTS]][]).map(([key, part]) => (
            <button
              key={key}
              onClick={() => toggleBodyPart(key)}
              className={`p-3 rounded-md border transition-all text-left ${
                isBodyPartFull(key)
                  ? 'bg-primary/10 border-primary text-foreground'
                  : isBodyPartPartial(key)
                    ? 'bg-primary/5 border-primary/50 text-foreground'
                    : 'bg-secondary/40 border-border text-muted-foreground hover:border-foreground/30'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm">{part.label}</span>
                {isBodyPartFull(key) && <CheckCircle2 className="w-4 h-4 text-primary" />}
                {isBodyPartPartial(key) && <span className="text-xs text-primary">{BODY_PARTS[key].muscles.filter(m => selectedMuscles.includes(m)).length}/{part.muscles.length}</span>}
              </div>
              <p className="text-[11px] mt-0.5 opacity-70">
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
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        selectedMuscles.includes(m)
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm shadow-primary/30'
                          : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
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
        <label className="block text-sm font-medium text-foreground mb-3">Objectif</label>
        <div className="grid grid-cols-2 gap-2">
          {GOALS.map(({ value, description, reps }) => (
            <button
              key={value}
              data-active={sessionGoal === value}
              onClick={() => setSessionGoal(value)}
              className="text-left p-3 rounded-md border bg-secondary/40 border-border text-muted-foreground transition-all data-[active=true]:bg-primary/10 data-[active=true]:border-primary data-[active=true]:text-primary hover:border-foreground/30"
            >
              <p className="font-semibold text-sm">{SESSION_GOAL_LABELS[value]}</p>
              <p className="text-[11px] mt-0.5 opacity-70">{description}</p>
              <p className="text-[10px] mt-0.5 opacity-60">{reps}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Style d'entraînement */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3">Style d'entraînement</label>
        <div className="grid grid-cols-2 gap-2">
          {TRAINING_STYLE_OPTIONS.map((value) => (
            <button
              key={value}
              data-active={trainingStyle === value}
              onClick={() => setTrainingStyle(value)}
              className="text-left p-3 rounded-md border bg-secondary/40 border-border text-muted-foreground transition-all data-[active=true]:bg-primary/10 data-[active=true]:border-primary data-[active=true]:text-primary hover:border-foreground/30"
            >
              <p className="font-semibold text-sm">{TRAINING_STYLE_LABELS[value]}</p>
              {value === 'strongman' && (
                <p className="text-[11px] mt-0.5 opacity-70">
                  L'IA privilégie yoke walk, atlas stone, sled, farmer's walk… adaptés à ton matériel
                </p>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Durée cible */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-muted-foreground" />Durée cible
          {targetDurationMinutes === undefined && (
            <span className="ml-1 text-muted-foreground font-normal text-xs">(libre)</span>
          )}
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[undefined, 30, 45, 60, 75, 90].map((duration) => (
            <button
              key={duration ?? 'libre'}
              onClick={() => setTargetDurationMinutes(duration)}
              data-active={targetDurationMinutes === duration}
              className="text-center p-2.5 rounded-md border bg-secondary/40 border-border text-muted-foreground transition-all data-[active=true]:bg-primary/10 data-[active=true]:border-primary data-[active=true]:text-primary hover:border-foreground/30"
            >
              <p className="font-semibold text-sm">
                {duration === undefined ? 'Libre' : `${duration} min`}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Équipement */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-3 flex items-center gap-1.5">
          <Dumbbell className="w-4 h-4 text-muted-foreground" />Équipement disponible
        </label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {EQUIPMENT_MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setEquipmentMode(m.id)}
              className={`text-left p-3 rounded-md border transition-all ${
                equipmentMode === m.id
                  ? 'bg-primary/10 border-primary/60 text-primary'
                  : 'bg-secondary/40 border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              <p className="font-semibold text-sm">{m.label}</p>
              <p className="text-[11px] mt-0.5 opacity-70">{m.description}</p>
            </button>
          ))}
        </div>

        {equipmentMode === 'crossfit' && (
          <div className="rounded-md border border-border bg-secondary/40 p-3">
            <div className="flex flex-wrap gap-1.5">
              {CROSSFIT_BOX_EQUIPMENT.map((e) => (
                <span key={e} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-secondary text-foreground border border-border">
                  <CheckCircle2 className="w-3 h-3" />{e}
                </span>
              ))}
            </div>
          </div>
        )}

        {equipmentMode === 'saved' && (
          <div className="rounded-md border border-border bg-secondary/40 p-3">
            {loadingProfile ? (
              <p className="text-xs text-muted-foreground">Chargement...</p>
            ) : equipment.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {equipment.map((e) => (
                  <span key={e} className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-secondary text-foreground border border-border">
                    <CheckCircle2 className="w-3 h-3" />{e}
                  </span>
                ))}
              </div>
            ) : (
              <>
                <p className="text-xs text-muted-foreground">Aucun équipement enregistré → poids du corps.</p>
                <Link href="/profile" className="text-xs text-primary hover:underline mt-1 inline-block">
                  Configurer mon équipement →
                </Link>
              </>
            )}
          </div>
        )}
      </div>

      {/* Contexte */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Contexte / instructions (optionnel)
        </label>
        <textarea
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          rows={2}
          placeholder="ex : j'ai mal au coude gauche, éviter les extensions triceps..."
          className="w-full bg-secondary/40 border border-border rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors resize-none"
        />
      </div>

      <button
        onClick={onGenerate}
        disabled={loading || selectedMuscles.length === 0}
        className="w-full flex items-center justify-center gap-2 py-3 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md font-semibold transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
      >
        {loading
          ? <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours...</>
          : <><Sparkles className="w-4 h-4" /> Générer la séance</>
        }
      </button>
    </div>
  )
}
