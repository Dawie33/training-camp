'use client'

import { WorkoutBlocks, WorkoutSection } from '@/lib/types/workout-structure'
import { useCallback, useEffect, useState } from 'react'
import { SectionDisplay } from './SectionDisplay'

interface InteractiveWorkoutDisplayProps {
  blocks: WorkoutBlocks
  onExerciseComplete?: (sectionIndex: number, exerciseIndex: number, completed: boolean) => void
}

/**
 * Composant qui affiche un entraînement de manière interactive.
 * Il permet de cocher une section, de la compléter, de la marquer comme complète.
 * Il permet également de passer automatiquement à la section suivante lorsque tous les exercices sont complétés.
 *
 * @param {WorkoutBlocks} blocks - Les blocs de l'entraînement.
 * @param {((sectionIdx: number, exerciseIdx: number, completed: boolean) => void} [onExerciseComplete] - Fonction à appeler lorsque l'utilisateur coche un exercice.
 */
export function InteractiveWorkoutDisplay({ blocks, onExerciseComplete }: InteractiveWorkoutDisplayProps) {
  const [completedExercises, setCompletedExercises] = useState<Record<string, boolean>>({})
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0)

  /**
* Active/désactive l'état d'achèvement d'un exercice.
* La fonction onExerciseComplete est également appelée si elle est fournie.
* @param {number} sectionIdx: index de la section contenant l'exercice.
* @param {number} exerciseIdx: index de l'exercice dans la section.
   */
  const toggleExercise = (sectionIdx: number, exerciseIdx: number) => {
    const key = `${sectionIdx}-${exerciseIdx}`
    const newValue = !completedExercises[key]
    setCompletedExercises(prev => ({
      ...prev,
      [key]: newValue
    }))
    onExerciseComplete?.(sectionIdx, exerciseIdx, newValue)
  }

  /**
   * Vérifie si un exercice est complété.
   * La fonction renvoie true si l'exercice est complété, false sinon.
   * @param {number} sectionIdx - Index de la section contenant l'exercice.
   * @param {number} exerciseIdx - Index de l'exercice dans la section.
   * @returns {boolean} - true si l'exercice est complété, false sinon.
   */
  const isExerciseCompleted = (sectionIdx: number, exerciseIdx: number) => {
    return completedExercises[`${sectionIdx}-${exerciseIdx}`] || false
  }

  // Compter les exercices d'une section (récursivement pour les sous-sections)
  const countSectionExercises = useCallback((section: WorkoutSection): number => {
    let count = section.exercises?.length || 0
    if (section.sections) {
      section.sections.forEach(subsection => {
        count += countSectionExercises(subsection)
      })
    }
    return count
  }, [])

  // Vérifier si tous les exercices d'une section sont complétés
  const isSectionCompleted = useCallback((sectionIdx: number): boolean => {
    const section = blocks.sections[sectionIdx]
    const totalExercises = countSectionExercises(section)

    if (totalExercises === 0) return false

    let completedCount = 0
    for (let i = 0; i < totalExercises; i++) {
      if (completedExercises[`${sectionIdx}-${i}`]) {
        completedCount++
      }
    }

    return completedCount === totalExercises
  }, [blocks.sections, completedExercises, countSectionExercises])

  // Passer automatiquement à la section suivante quand tous les exercices sont complétés
  useEffect(() => {
    if (currentSectionIndex < blocks.sections.length - 1) {
      if (isSectionCompleted(currentSectionIndex)) {
        setCurrentSectionIndex(prev => prev + 1)
      }
    }
  }, [completedExercises, currentSectionIndex, blocks.sections.length, isSectionCompleted])

  return (
    <div className="space-y-6">
      {blocks.stimulus && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🎯 Objectif</h3>
          <p className="text-blue-800 dark:text-blue-200">{blocks.stimulus}</p>
        </div>
      )}

      <div className="space-y-4">
        {blocks.sections.map((section, idx) => (
          <SectionDisplay
            key={idx}
            section={section}
            index={idx}
            isStarting={true}
            isExerciseCompleted={isExerciseCompleted}
            toggleExercise={toggleExercise}
            isCurrentSection={idx === currentSectionIndex}
            onSectionStart={() => setCurrentSectionIndex(idx)}
          />
        ))}
      </div>

      {blocks.estimated_calories && (
        <div className="text-sm text-muted-foreground text-center pt-4 border-t">
          🔥 Estimation : {blocks.estimated_calories} calories
        </div>
      )}
    </div>
  )
}

