'use client'

import { Timer } from '@/components/workout/Timer'
import { WorkoutSummary } from '@/components/workout/WorkoutSummary'
import { blockTypeColors, blockTypeLabels } from '@/lib/constants/workout-blocks'
import { Workouts } from '@/lib/types/workout'
import { Check, Clock, Pause, Play, X } from 'lucide-react'
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
  const [blockProgress, setBlockProgress] = useState<BlockProgress>({})
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

  // Fonction pour mettre à jour la progression de l'exercice
  const toggleExercise = (blockType: string, index: number) => {
    const key = `${blockType}-${index}`
    setBlockProgress(prev => ({
      ...prev,
      [key]: !prev[key]
    }))
  }

  /**
   * Vérifie si l'exercice est complété.
   * @param {string} blockType - le type de bloc (warmup, strength, metcon, accessory, cooldown)
   * @param {number} index - l'index de l'exercice
   * @returns {boolean} - true si l'exercice est complété, false sinon
   */
  const isExerciseCompleted = (blockType: string, index: number) => {
    return blockProgress[`${blockType}-${index}`] || false
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
            {workout.blocks.duration_min && (
              <span>Durée estimée: {workout.blocks.duration_min} min</span>
            )}
          </div>
        </div>
      </div>

      {/* Contenu */}
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        {/* Warmup */}
        {workout.blocks.warmup && (
          <div className={`border-l-4 ${blockTypeColors.warmup} bg-card rounded-lg p-6`}>
            <h2 className="text-xl font-bold mb-4">{blockTypeLabels.warmup}</h2>
            <ul className="space-y-3">
              {workout.blocks.warmup.map((ex, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <button
                    onClick={() => toggleExercise('warmup', idx)}
                    className={`mt-0.5 w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${isExerciseCompleted('warmup', idx)
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground/30 hover:border-primary'
                      }`}
                  >
                    {isExerciseCompleted('warmup', idx) && (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className={`font-medium ${isExerciseCompleted('warmup', idx) ? 'line-through text-muted-foreground' : ''}`}>
                      {ex.movement}
                    </p>
                    <div className="text-sm text-muted-foreground mt-1">
                      {ex.reps && <span>{ex.reps} reps</span>}
                      {ex.duration_sec && <span>{ex.duration_sec}s</span>}
                      {ex.equipment && ex.equipment.length > 0 && (
                        <span className="ml-2">• {ex.equipment.join(', ')}</span>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Strength */}
        {workout.blocks.strength && (
          <div className={`border-l-4 ${blockTypeColors.strength} bg-card rounded-lg p-6`}>
            <h2 className="text-xl font-bold mb-4">{blockTypeLabels.strength}</h2>
            <button
              onClick={() => toggleExercise('strength', 0)}
              className="w-full"
            >
              <div className="flex items-start gap-3 text-left">
                <div
                  className={`mt-0.5 w-6 h-6 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${isExerciseCompleted('strength', 0)
                    ? 'bg-primary border-primary'
                    : 'border-muted-foreground/30 hover:border-primary'
                    }`}
                >
                  {isExerciseCompleted('strength', 0) && (
                    <Check className="w-4 h-4 text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <p className={`text-lg font-semibold mb-2 ${isExerciseCompleted('strength', 0) ? 'line-through text-muted-foreground' : ''}`}>
                    {workout.blocks.strength.name}
                  </p>
                  <p className="text-muted-foreground mb-2">{workout.blocks.strength.scheme}</p>
                  {workout.blocks.strength.rest_sec && (
                    <p className="text-sm text-muted-foreground">Repos: {workout.blocks.strength.rest_sec}s entre les séries</p>
                  )}
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Metcon */}
        {workout.blocks.metcon && (
          <div className={`border-l-4 ${blockTypeColors.metcon} bg-card rounded-lg p-6`}>
            <h2 className="text-xl font-bold mb-4">{blockTypeLabels.metcon}</h2>

            {/* Timer */}
            {workout.blocks.metcon.time_cap_min && (
              <div className="mb-6">
                <Timer timeCap={workout.blocks.metcon.time_cap_min} />
              </div>
            )}

            <div className="mb-4">
              <p className="text-lg font-semibold">{workout.blocks.metcon.format}</p>
              {workout.blocks.metcon.time_cap_min && (
                <p className="text-sm text-muted-foreground">Time cap: {workout.blocks.metcon.time_cap_min} min</p>
              )}
            </div>
            {workout.blocks.metcon.parts && (
              <ul className="space-y-3">
                {workout.blocks.metcon.parts.map((part, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <button
                      onClick={() => toggleExercise('metcon', idx)}
                      className={`mt-0.5 w-6 h-6 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${isExerciseCompleted('metcon', idx)
                        ? 'bg-primary border-primary'
                        : 'border-muted-foreground/30 hover:border-primary'
                        }`}
                    >
                      {isExerciseCompleted('metcon', idx) && (
                        <Check className="w-4 h-4 text-primary-foreground" />
                      )}
                    </button>
                    <div className="flex-1">
                      <p className={`font-medium ${isExerciseCompleted('metcon', idx) ? 'line-through text-muted-foreground' : ''}`}>
                        {part.reps}x {part.movement}
                      </p>
                      {part.equipment && part.equipment.length > 0 && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {part.equipment.join(', ')}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Accessory */}
        {workout.blocks.accessory && (
          <div className={`border-l-4 ${blockTypeColors.accessory} bg-card rounded-lg p-6`}>
            <h2 className="text-xl font-bold mb-4">{blockTypeLabels.accessory}</h2>
            <ul className="space-y-3">
              {workout.blocks.accessory.map((ex, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <button
                    onClick={() => toggleExercise('accessory', idx)}
                    className={`mt-0.5 w-6 h-6 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${isExerciseCompleted('accessory', idx)
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground/30 hover:border-primary'
                      }`}
                  >
                    {isExerciseCompleted('accessory', idx) && (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className={`font-medium ${isExerciseCompleted('accessory', idx) ? 'line-through text-muted-foreground' : ''}`}>
                      {ex.movement}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">{ex.scheme}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Cooldown */}
        {workout.blocks.cooldown && (
          <div className={`border-l-4 ${blockTypeColors.cooldown} bg-card rounded-lg p-6`}>
            <h2 className="text-xl font-bold mb-4">{blockTypeLabels.cooldown}</h2>
            <ul className="space-y-3">
              {workout.blocks.cooldown.map((ex, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <button
                    onClick={() => toggleExercise('cooldown', idx)}
                    className={`mt-0.5 w-6 h-6 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${isExerciseCompleted('cooldown', idx)
                      ? 'bg-primary border-primary'
                      : 'border-muted-foreground/30 hover:border-primary'
                      }`}
                  >
                    {isExerciseCompleted('cooldown', idx) && (
                      <Check className="w-4 h-4 text-primary-foreground" />
                    )}
                  </button>
                  <div className="flex-1">
                    <p className={`font-medium ${isExerciseCompleted('cooldown', idx) ? 'line-through text-muted-foreground' : ''}`}>
                      {ex.movement}
                    </p>
                    {ex.duration_sec && (
                      <p className="text-sm text-muted-foreground mt-1">{ex.duration_sec}s</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

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
