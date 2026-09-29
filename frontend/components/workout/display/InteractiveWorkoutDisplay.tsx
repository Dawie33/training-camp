'use client'

import { WorkoutBlocks } from '@/domain/entities/workout-structure'
import { useEffect, useRef, useState } from 'react'
import { SectionDisplay } from './SectionDisplay'

interface InteractiveWorkoutDisplayProps {
  blocks: WorkoutBlocks
  onSectionComplete?: (sectionIndex: number, completed: boolean) => void
  onExerciseClick?: (exerciseId: string) => void
}

/**
 * Composant qui affiche un entraînement de manière interactive.
 * Il permet de cocher une section complète, de la marquer comme complète.
 * Il permet également de passer automatiquement à la section suivante lorsqu'elle est complétée.
 *
 * @param {WorkoutBlocks} blocks - Les blocs de l'entraînement.
 * @param {((sectionIdx: number, completed: boolean) => void} [onSectionComplete] - Fonction à appeler lorsque l'utilisateur coche une section.
 */
export function InteractiveWorkoutDisplay({ blocks, onSectionComplete, onExerciseClick }: InteractiveWorkoutDisplayProps) {
  const [completedSections, setCompletedSections] = useState<Record<number, boolean>>({})
  const [currentSectionIndex, setCurrentSectionIndex] = useState<number>(0)
  const sectionRefs = useRef<(HTMLDivElement | null)[]>([])

  /**
   * Active/désactive l'état d'achèvement d'une section.
   * La fonction onSectionComplete est également appelée si elle est fournie.
   * @param {number} sectionIdx: index de la section.
   */
  const toggleSection = (sectionIdx: number) => {
    const newValue = !completedSections[sectionIdx]
    setCompletedSections(prev => ({
      ...prev,
      [sectionIdx]: newValue
    }))
    onSectionComplete?.(sectionIdx, newValue)

    // Si on coche la section (newValue = true) et qu'il y a une section suivante
    if (newValue && sectionIdx < blocks.sections.length - 1) {
      // Attendre un peu pour laisser l'animation de check se terminer
      setTimeout(() => {
        const nextSectionRef = sectionRefs.current[sectionIdx + 1]
        if (nextSectionRef) {
          nextSectionRef.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 300)
    }
  }

  /**
   * Vérifie si une section est complétée.
   * @param {number} sectionIdx - Index de la section.
   * @returns {boolean} - true si la section est complétée, false sinon.
   */
  const isSectionCompleted = (sectionIdx: number) => {
    return completedSections[sectionIdx] || false
  }

  // Passer automatiquement à la section suivante quand elle est complétée
  useEffect(() => {
    if (currentSectionIndex < blocks.sections.length - 1) {
      if (completedSections[currentSectionIndex]) {
        setCurrentSectionIndex(prev => prev + 1)
      }
    }
  }, [completedSections, currentSectionIndex, blocks.sections.length])

  return (
    <div className="space-y-6">
      {blocks.stimulus && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🎯 Objectif</h3>
          <p className="text-blue-800 dark:text-blue-200">{blocks.stimulus}</p>
        </div>
      )}

      <div className="space-y-4">
        {blocks.sections.map((section, idx) => {
          // Une section peut être démarrée si c'est la première OU si la section précédente est complétée
          const canStart = idx === 0 || isSectionCompleted(idx - 1)

          return (
            <div
              key={idx}
              ref={(el) => {
                sectionRefs.current[idx] = el
              }}
            >
              <SectionDisplay
                section={section}
                index={idx}
                isStarting={true}
                isSectionCompleted={isSectionCompleted(idx)}
                onSectionToggle={() => toggleSection(idx)}
                isCurrentSection={idx === currentSectionIndex}
                onSectionStart={() => setCurrentSectionIndex(idx)}
                onExerciseClick={onExerciseClick}
                canStart={canStart}
              />
            </div>
          )
        })}
      </div>

      {blocks.estimated_calories && (
        <div className="text-sm text-muted-foreground text-center pt-4 border-t">
          🔥 Estimation : {blocks.estimated_calories} calories
        </div>
      )}
    </div>
  )
}

