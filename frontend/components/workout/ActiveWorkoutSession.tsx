'use client'

import { WorkoutDisplay } from '@/components/workout/WorkoutDisplay'
import { WorkoutSummary } from '@/components/workout/WorkoutSummary'
import { Workouts } from '@/lib/types/workout'
import { Clock, Pause, Play, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ActiveWorkoutSessionProps {
  workout: Workouts
  sessionId: string
  onClose: () => void
}

interface BlockProgress {
  [key: string]: boolean
}

export function ActiveWorkoutSession({ workout, sessionId, onClose }: ActiveWorkoutSessionProps) {
  const [isRunning, setIsRunning] = useState(true)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [blockProgress] = useState<BlockProgress>({})
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [showSummary, setShowSummary] = useState(false)

  // Timer global
  useEffect(() => {
    if (!isRunning) return

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isRunning])

  /**
   * Formate le temps en heures, minutes et secondes.
   * @param {number} seconds - le nombre de secondes
   * @returns {string} - le format du temps
   */
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const handleComplete = () => {
    // Arrêter le timer
    setIsRunning(false)
    // Afficher la page de résumé
    setShowSummary(true)
  }

  // Si on affiche le résumé, montrer le composant WorkoutSummary
  if (showSummary) {
    return (
      <WorkoutSummary
        workout={workout}
        sessionId={sessionId}
        elapsedTime={elapsedTime}
        blockProgress={blockProgress}
        notes=""
      />
    )
  }

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-y-auto">
      {/* Header fixe */}
      <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="relative group">
              <button
                onClick={() => setShowCloseModal(true)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                aria-label="Fermer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute left-0 top-full mt-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border">
                Fermer
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-muted-foreground mb-1">Temps écoulé</div>
              <div className="text-3xl font-bold font-mono">{formatTime(elapsedTime)}</div>
            </div>

            <div className="relative group">
              <button
                onClick={() => setIsRunning(!isRunning)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
                aria-label={isRunning ? 'Pause' : 'Reprendre'}
              >
                {isRunning ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>
              <div className="absolute right-0 top-full mt-2 px-2 py-1 bg-popover text-popover-foreground text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 border border-border">
                {isRunning ? 'Pause' : 'Reprendre'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground justify-center">
            <Clock className="w-4 h-4" />
            {workout.blocks.duration_min != null && (
              <span>Durée estimée: {workout.blocks.duration_min} min</span>
            )}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* TODO: Refactor this component to use the new WorkoutBlocks.sections structure with interactive checkboxes */}
        <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
          <h3 className="font-semibold text-yellow-900 dark:text-yellow-100 mb-2">⚠ Fonctionnalité en cours de migration</h3>
          <p className="text-yellow-800 dark:text-yellow-200 text-sm">
            Cette session active nécessite une mise à jour pour fonctionner avec la nouvelle structure de workout.
            Les fonctionnalités de suivi interactif (cocher les exercices complétés) seront restaurées prochainement.
          </p>
        </div>

        {/* Afficher le workout avec WorkoutDisplay */}
        <WorkoutDisplay blocks={workout.blocks} showTitle={true} />

        {/* Bouton de complétion */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border pt-6 pb-8">
          <button
            onClick={handleComplete}
            className="w-full bg-primary text-primary-foreground px-6 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors"
          >
            Terminer le workout
          </button>
        </div>
      </div>

      {/* Modale de confirmation d'arrêt */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
          <div className="bg-card border border-border rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-xl font-bold mb-3 ">Arrêter le workout ?</h3>
            <p className="text-muted-foreground mb-6">
              Êtes-vous sûr de vouloir arrêter le workout ? Votre progression ne sera pas sauvegardée.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 px-4 py-3 border border-border rounded-lg hover:bg-accent transition-colors font-medium cursor-pointer"
              >
                Continuer
              </button>
              <button
                onClick={() => {
                  setShowCloseModal(false)
                  onClose()
                }}
                className="flex-1 px-4 py-3 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors font-medium cursor-pointer"
              >
                Arrêter
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
