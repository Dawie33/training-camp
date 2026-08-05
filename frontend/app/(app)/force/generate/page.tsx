'use client'

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
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">L'IA adapte la séance à ton matériel et inclut des mouvements de rotation</p>

      {/* Sélecteur de mode */}
      <div className="flex flex-wrap gap-1 p-1 bg-secondary/40 rounded-lg w-fit border border-border">
        <button
          onClick={() => switchMode('ai')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'ai' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Générer avec l'IA
        </button>
        <button
          onClick={() => switchMode('paste')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
            mode === 'paste' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Depuis les réseaux
        </button>
      </div>

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
              <>Colle un texte à gauche et clique sur<br /><span className="text-primary">"Analyser"</span></>
            ) : (
              <>Sélectionne tes muscles et clique sur<br /><span className="text-primary">"Générer la séance"</span></>
            )
          }
        />
      </div>
    </div>
  )
}
