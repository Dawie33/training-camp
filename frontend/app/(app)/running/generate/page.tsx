'use client'

import { fadeInUp, staggerContainer } from '@/lib/animations'
import { RUN_TYPE_LABELS, RunType } from '@/services/running'
import { motion } from 'framer-motion'
import { Loader2, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { RunPlanPreview } from './_components/RunPlanPreview'
import { useGenerateRunning } from './_hooks/useGenerateRunning'

const RUN_TYPES: { value: RunType; description: string }[] = [
  { value: 'easy', description: 'Zone 1-2, conversation possible' },
  { value: 'tempo', description: 'Allure seuil, inconfortable mais tenu' },
  { value: 'intervals', description: 'Fractionné haute intensité zone 4-5' },
  { value: 'long_run', description: 'Endurance fondamentale, zone 2' },
  { value: 'fartlek', description: 'Variations libres d\'allure, ludique' },
  { value: 'recovery', description: 'Zone 1, très facile, régénérateur' },
]

export default function GenerateRunningPage() {
  const {
    runType, setRunType,
    durationMinutes, setDurationMinutes,
    targetDistanceKm, setTargetDistanceKm,
    goal, setGoal,
    additionalInstructions, setAdditionalInstructions,
    loading,
    saving,
    generatedPlan,
    handleGenerate,
    handleSave,
  } = useGenerateRunning()

  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')

  return (
    <motion.div
      className="space-y-6"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <motion.div variants={fadeInUp}>
        <p className="text-sm text-muted-foreground">L'IA crée un plan adapté à ton niveau et tes objectifs</p>
      </motion.div>

      <motion.div variants={fadeInUp}>
        {pasteOpen ? (
          <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
            <label className="block text-sm font-semibold text-foreground">Coller un plan existant</label>
            <textarea
              rows={4}
              placeholder="Ex: 2km échauffement + 6×800m @ allure 5'/km + 2km retour au calme..."
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              className="w-full px-3 py-2 bg-card border border-border rounded-lg text-foreground text-sm focus:outline-none focus:border-primary/50 placeholder:text-muted-foreground resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { setPasteOpen(false); setPasteText('') }}
                className="flex-1 py-2 border border-border text-foreground rounded-lg hover:bg-secondary/60 transition-colors text-sm"
              >
                Annuler
              </button>
              <button
                onClick={() => { setAdditionalInstructions(pasteText); setPasteOpen(false) }}
                disabled={!pasteText.trim()}
                className="flex-1 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors text-sm disabled:opacity-50"
              >
                Utiliser ce texte
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setPasteOpen(true)}
            className="text-sm text-primary hover:underline underline-offset-2"
          >
            Coller un plan existant →
          </button>
        )}
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Formulaire */}
        <motion.div variants={fadeInUp} className="space-y-5">
          {/* Type de sortie */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">Type de séance</label>
            <div className="grid grid-cols-2 gap-2">
              {RUN_TYPES.map(({ value, description }) => (
                <button
                  key={value}
                  data-active={runType === value}
                  onClick={() => setRunType(value)}
                  className="text-left p-3 rounded-lg border bg-secondary/40 border-border text-muted-foreground transition-all data-[active=true]:bg-primary/10 data-[active=true]:border-primary data-[active=true]:text-primary hover:border-foreground/30"
                >
                  <p className="font-semibold text-sm">{RUN_TYPE_LABELS[value]}</p>
                  <p className="text-[11px] mt-0.5 opacity-70">{description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Durée */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Durée cible — <span className="text-primary">{durationMinutes} min</span>
            </label>
            <input
              type="range"
              min={15}
              max={180}
              step={5}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>15 min</span><span>1h30</span><span>3h</span>
            </div>
          </div>

          {/* Distance optionnelle */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Distance cible (optionnel)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={100}
                step={0.5}
                value={targetDistanceKm ?? ''}
                onChange={(e) => setTargetDistanceKm(e.target.value ? Number(e.target.value) : undefined)}
                placeholder="ex : 10"
                className="flex-1 bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
              <span className="text-muted-foreground text-sm">km</span>
            </div>
          </div>

          {/* Objectif */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Objectif (optionnel)
            </label>
            <input
              type="text"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="ex : préparer un 10K, améliorer endurance..."
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
            />
          </div>

          {/* Instructions supplémentaires */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Instructions supplémentaires (optionnel)
            </label>
            <textarea
              value={additionalInstructions}
              onChange={(e) => setAdditionalInstructions(e.target.value)}
              rows={3}
              placeholder="ex : j'ai couru 15km dimanche, séance légère aujourd'hui..."
              className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 resize-none"
            />
          </div>

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all font-semibold disabled:opacity-50"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Génération en cours...</>
            ) : (
              <><Sparkles className="w-4 h-4" /> Générer la séance</>
            )}
          </button>
        </motion.div>

        {/* Résultat */}
        <motion.div variants={fadeInUp}>
          {generatedPlan ? (
            <RunPlanPreview plan={generatedPlan} onSave={handleSave} saving={saving} />
          ) : (
            <div className="bg-card border border-dashed border-border rounded-lg p-8 text-center h-full flex flex-col items-center justify-center">
              <Sparkles className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="text-muted-foreground text-sm">
                Remplis le formulaire et clique sur<br />
                <span className="text-primary">"Générer la séance"</span>
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
