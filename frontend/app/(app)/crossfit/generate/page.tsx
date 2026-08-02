'use client'

import { useGenerateWorkout } from '@/app/(app)/workouts/generate-ai/_hooks/useGenerateWorkout'
import { WodCaptureForm, WodCaptureMode } from '@/components/workout/WodCaptureForm'
import { Instagram, Search, Sparkles } from 'lucide-react'
import { useState } from 'react'
import { AiGenerateForm } from './_components/AiGenerateForm'
import { AiGeneratedResult } from './_components/AiGeneratedResult'

type Method = WodCaptureMode | 'ai'

const METHODS: { id: Method; label: string; icon: typeof Instagram }[] = [
  { id: 'instagram', label: 'Depuis Instagram', icon: Instagram },
  { id: 'search', label: 'Rechercher un WOD', icon: Search },
  { id: 'ai', label: "Générer avec l'IA", icon: Sparkles },
]

export default function CrossFitGeneratePage() {
  const [method, setMethod] = useState<Method>('instagram')

  const ai = useGenerateWorkout({ redirectTo: null })

  return (
    <div className="space-y-6">
      {/* Sélecteur de méthode */}
      <div className="flex flex-wrap gap-1 p-1 bg-secondary/40 rounded-lg w-fit border border-border">
        {METHODS.map(({ id, label, icon: Icon }) => {
          const isActive = method === id
          return (
            <button
              key={id}
              onClick={() => setMethod(id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                isActive
                  ? 'bg-card text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          )
        })}
      </div>

      {/* Instagram / Recherche */}
      {(method === 'instagram' || method === 'search') && (
        <div className="max-w-2xl bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            {method === 'instagram'
              ? "Colle le post de ta box — l'IA extrait le WOD et l'ajoute à ta bibliothèque."
              : 'Cherche un benchmark, un Open ou un Hero WOD connu — ajouté directement à ta bibliothèque.'}
          </p>
          <WodCaptureForm key={method} mode={method} />
        </div>
      )}

      {/* Génération IA */}
      {method === 'ai' && (
        <div className="space-y-6 lg:space-y-8">
          <AiGenerateForm
            workoutType={ai.workoutType} setWorkoutType={ai.setWorkoutType}
            difficulty={ai.difficulty} setDifficulty={ai.setDifficulty}
            duration={ai.duration} setDuration={ai.setDuration}
            equipment={ai.equipment} setEquipment={ai.setEquipment} toggleEquipment={ai.toggleEquipment}
            profileEquipment={ai.profileEquipment}
            additionalInstructions={ai.additionalInstructions} setAdditionalInstructions={ai.setAdditionalInstructions}
            personalized={ai.personalized} setPersonalized={ai.setPersonalized}
            loading={ai.loading} error={ai.error}
            onGenerate={ai.handleGenerate}
          />
          <AiGeneratedResult
            generatedWorkout={ai.generatedWorkout}
            personalized={ai.personalized}
            isEditing={ai.isEditing}
            onToggleEdit={() => ai.setIsEditing(!ai.isEditing)}
            editedName={ai.editedName} setEditedName={ai.setEditedName}
            editedDescription={ai.editedDescription} setEditedDescription={ai.setEditedDescription}
            editedDifficulty={ai.editedDifficulty} setEditedDifficulty={ai.setEditedDifficulty}
            editedDuration={ai.editedDuration} setEditedDuration={ai.setEditedDuration}
            editedIntensity={ai.editedIntensity} setEditedIntensity={ai.setEditedIntensity}
            editedBlocks={ai.editedBlocks} setEditedBlocks={ai.setEditedBlocks}
            loading={ai.loading}
            onSave={ai.handleSave}
          />
        </div>
      )}
    </div>
  )
}
