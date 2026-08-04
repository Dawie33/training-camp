'use client'

import { fadeInUp, staggerContainer } from '@/lib/animations'
import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { GeneratedStrengthResult } from './_components/GeneratedStrengthResult'
import { GenerateStrengthForm } from './_components/GenerateStrengthForm'
import { ParseStrengthTextForm } from './_components/ParseStrengthTextForm'
import { useGenerateStrengthSession } from './_hooks/useGenerateStrengthSession'

type Mode = 'ai' | 'paste'

export default function GenerateStrengthPage() {
  const [mode, setMode] = useState<Mode>('ai')
  const s = useGenerateStrengthSession()

  const switchMode = (next: Mode) => {
    setMode(next)
    s.resetPlan()
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
      initial="hidden" animate="visible" variants={staggerContainer}
    >
      <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <Link href="/force" className="text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                Générer une séance Force
              </span>
            </h1>
            <p className="text-sm text-slate-400">L'IA adapte la séance à ton matériel et inclut des mouvements de rotation</p>
          </div>
        </motion.div>

        {/* Sélecteur de mode */}
        <motion.div variants={fadeInUp} className="flex gap-2 p-1 bg-white/5 rounded-xl border border-white/10 w-fit">
          <button
            onClick={() => switchMode('ai')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === 'ai' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Générer avec l'IA
          </button>
          <button
            onClick={() => switchMode('paste')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              mode === 'paste' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/40' : 'text-slate-400 hover:text-white'
            }`}
          >
            Depuis les réseaux
          </button>
        </motion.div>

        <div className="space-y-6 lg:space-y-8">
          {mode === 'ai' ? (
            <GenerateStrengthForm
              selectedMuscles={s.selectedMuscles}
              setSelectedMuscles={s.setSelectedMuscles}
              toggleMuscle={s.toggleMuscle}
              sessionGoal={s.sessionGoal}
              setSessionGoal={s.setSessionGoal}
              bodyFocus={s.bodyFocus}
              setBodyFocus={s.setBodyFocus}
              trainingStyle={s.trainingStyle}
              setTrainingStyle={s.setTrainingStyle}
              targetDurationMinutes={s.targetDurationMinutes}
              setTargetDurationMinutes={s.setTargetDurationMinutes}
              equipment={s.equipment}
              setEquipment={s.setEquipment}
              profileEquipment={s.profileEquipment}
              loadingProfile={s.loadingProfile}
              additionalContext={s.additionalContext}
              setAdditionalContext={s.setAdditionalContext}
              personalized={s.personalized}
              setPersonalized={s.setPersonalized}
              loading={s.loading}
              onGenerate={s.handleGenerate}
            />
          ) : (
            <ParseStrengthTextForm
              text={s.parseInputText}
              setText={s.setParseInputText}
              analyzing={s.analyzing}
              onAnalyze={s.handleAnalyzeText}
            />
          )}

          <GeneratedStrengthResult
            plan={s.plan}
            saving={s.saving}
            onSave={s.handleSave}
            regenerateLabel={mode === 'paste' ? 'Réanalyser' : 'Regénérer'}
            onRegenerate={mode === 'paste' ? s.handleAnalyzeText : s.handleGenerate}
            regenerateDisabled={s.loading || s.analyzing || s.saving}
            emptyStateText={
              mode === 'paste' ? (
                <>Colle un texte à gauche et clique sur<br /><span className="text-violet-400">"Analyser"</span></>
              ) : (
                <>Sélectionne tes muscles et clique sur<br /><span className="text-violet-400">"Générer la séance"</span></>
              )
            }
          />
        </div>
      </div>
    </motion.div>
  )
}
