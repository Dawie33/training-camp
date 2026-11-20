'use client'

import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { GenerateForm } from './_components/GenerateForm'
import { GeneratedWorkoutResult } from './_components/GeneratedWorkoutResult'
import { useGenerateWorkout } from './_hooks/useGenerateWorkout'

/**
 * Page de génération de workout par IA : formulaire de paramètres puis prévisualisation
 * éditable et sauvegarde du workout généré.
 */
export default function GenerateWorkoutAIPage() {
  const router = useRouter()
  const {
    workoutType, setWorkoutType,
    suggestionReason,
    difficulty, setDifficulty,
    duration, setDuration,
    equipment, setEquipment, toggleEquipment,
    profileEquipment,
    additionalInstructions, setAdditionalInstructions,
    personalized, setPersonalized,
    loading, error,
    generatedWorkout,
    isEditing, setIsEditing,
    editedName, setEditedName,
    editedDescription, setEditedDescription,
    editedDifficulty, setEditedDifficulty,
    editedDuration, setEditedDuration,
    editedIntensity, setEditedIntensity,
    editedBlocks, setEditedBlocks,
    handleGenerate,
    handleSave,
  } = useGenerateWorkout()

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <div className="px-4 lg:px-8 py-4 lg:py-6 border-b border-border sticky top-0 bg-background backdrop-blur-sm z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-2 lg:gap-3">
          <Button variant="ghost"
            aria-label="Retour"
            onClick={() => router.back()}
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-card border border-border text-muted-foreground hover:bg-secondary hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="w-1.5 lg:w-2 h-8 lg:h-12 bg-primary rounded-full" />
          <div>
            <h1 className="font-display text-3xl lg:text-5xl font-semibold tracking-tight">Générer un Workout</h1>
            <p className="text-muted-foreground text-sm lg:text-base mt-0.5">Laissez l'IA créer un workout personnalisé</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
        <div className="space-y-6 lg:space-y-8">
          <GenerateForm
            workoutType={workoutType} setWorkoutType={setWorkoutType}
            suggestionReason={suggestionReason}
            difficulty={difficulty} setDifficulty={setDifficulty}
            duration={duration} setDuration={setDuration}
            equipment={equipment} setEquipment={setEquipment} toggleEquipment={toggleEquipment}
            profileEquipment={profileEquipment}
            additionalInstructions={additionalInstructions} setAdditionalInstructions={setAdditionalInstructions}
            personalized={personalized} setPersonalized={setPersonalized}
            loading={loading} error={error}
            onGenerate={handleGenerate}
          />

          <GeneratedWorkoutResult
            generatedWorkout={generatedWorkout}
            personalized={personalized}
            isEditing={isEditing}
            onToggleEdit={() => setIsEditing(!isEditing)}
            editedName={editedName} setEditedName={setEditedName}
            editedDescription={editedDescription} setEditedDescription={setEditedDescription}
            editedDifficulty={editedDifficulty} setEditedDifficulty={setEditedDifficulty}
            editedDuration={editedDuration} setEditedDuration={setEditedDuration}
            editedIntensity={editedIntensity} setEditedIntensity={setEditedIntensity}
            editedBlocks={editedBlocks} setEditedBlocks={setEditedBlocks}
            loading={loading}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  )
}
