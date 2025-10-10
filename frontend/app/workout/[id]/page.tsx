'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ActiveWorkoutSession } from '@/components/workout/ActiveWorkoutSession'
import { useSport } from '@/contexts/SportContext'
import { workoutsService } from '@/lib/api'
import { blockTypeColors } from '@/lib/constants/workout-blocks'
import { Workouts } from '@/lib/types/workout'
import { getSportImage } from '@/lib/utils/sport-images'
import { ArrowLeft, Calendar, Clock, Share2 } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'

function WorkoutDetailContent() {
  const params = useParams()
  const { activeSport } = useSport()
  const [workout, setWorkout] = useState<Workouts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    /**
     * Récupère le workout par son ID depuis l'URL
     */
    const fetchWorkout = async () => {
      if (!params.id) return

      try {
        setLoading(true)
        const data = await workoutsService.getDailyWorkoutById(params.id as string)
        setWorkout(data)
      } catch (err) {
        console.error('Error fetching workout:', err)
        setError('Impossible de charger le workout')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkout()
  }, [params.id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (error || !workout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Workout non trouvé'}</p>
          <Link href="/dashboard" className="text-primary hover:underline">
            Retour au dashboard
          </Link>
        </div>
      </div>
    )
  }

  const handleStartWorkout = async () => {
    if (!workout) return

    try {
      setIsStarting(true)
      const session = await workoutsService.startSession({
        workout_id: workout.id,
        started_at: new Date().toISOString()
      })
      setActiveSession(session.id)
    } catch (err) {
      console.error('Error starting workout session:', err)
      const errorMessage = err instanceof Error ? err.message : 'Impossible de démarrer le workout'
      alert(errorMessage)
    } finally {
      setIsStarting(false)
    }
  }

  // Afficher la session active si elle existe
  if (activeSession && workout) {
    return (
      <ActiveWorkoutSession
        workout={workout}
        sessionId={activeSession}
        onClose={() => setActiveSession(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative h-[40vh] min-h-[300px]">
        {/* Image de fond */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url(${getSportImage(activeSport?.slug || 'default', workout.id)})`,
          }}
        />
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/30" />

        {/* Contenu */}
        <div className="relative h-full max-w-5xl mx-auto px-6 py-8">
          {/* Back button */}
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </Link>

          {/* Title & Info */}
          <div className="absolute bottom-8 left-6 right-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold px-3 py-1.5 bg-primary text-primary-foreground rounded-full">
                WORKOUT DU JOUR
              </span>
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{new Date(workout.scheduled_date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
              {workout.name || `${activeSport?.name} Workout`}
            </h1>

            <div className="flex items-center gap-4 text-white/90 flex-wrap">
              {/* Type de workout */}
              {workout.workout_type && (
                <span className="text-sm font-medium px-3 py-1.5 bg-primary/90 text-primary-foreground rounded-full uppercase">
                  {workout.workout_type}
                </span>
              )}

              {/* Difficulté */}
              {workout.difficulty && (
                <span className="text-sm font-medium px-3 py-1.5 bg-white/20 backdrop-blur-sm text-white rounded-full">
                  {workout.difficulty === 'beginner' && '🟢 Débutant'}
                  {workout.difficulty === 'intermediate' && '🟡 Intermédiaire'}
                  {workout.difficulty === 'advanced' && '🔴 Avancé'}
                </span>
              )}

              {/* Durée estimée */}
              {workout.estimated_duration && (
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">{workout.estimated_duration} min</span>
                </div>
              )}

              {/* Durée du bloc (si différente) */}
              {workout.blocks.duration_min && workout.blocks.duration_min !== workout.estimated_duration && (
                <div className="flex items-center gap-2">
                  <span className="text-sm">({workout.blocks.duration_min} min de workout)</span>
                </div>
              )}

              {/* Stimulus */}
              {workout.blocks.stimulus && (
                <div className="text-sm">
                  {workout.blocks.stimulus}
                </div>
              )}
            </div>

            {workout.tags && workout.tags.length > 0 && (
              <div className="flex gap-2 flex-wrap mt-4">
                {workout.tags.map((tag, idx) => (
                  <span key={idx} className="text-xs px-3 py-1 bg-white/20 backdrop-blur-sm text-white rounded-full">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Action Buttons */}
        <div className="flex gap-4 mb-12">
          <button
            onClick={handleStartWorkout}
            disabled={isStarting}
            className="flex-1 bg-primary text-primary-foreground px-6 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? 'Démarrage...' : 'Commencer le workout'}
          </button>
          <button className="px-6 py-4 border border-border rounded-lg hover:bg-accent transition-colors">
            <Share2 className="w-5 h-5 cursor-pointer" />
          </button>
        </div>

        {/* Workout Blocks */}
        <div className="space-y-8">
          {/* Warmup */}
          {workout.blocks.warmup && (
            <div className={`border-l-4 ${blockTypeColors.warmup} bg-card rounded-lg p-6`}>
              <h2 className="text-2xl font-bold mb-4 capitalize">Warmup</h2>
              <ul className="space-y-3">
                {workout.blocks.warmup.map((ex, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-muted-foreground mt-1">•</span>
                    <div className="flex-1">
                      <p className="font-medium">{ex.movement}</p>
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
              <h2 className="text-2xl font-bold mb-4 capitalize">Strength</h2>
              <div>
                <p className="text-lg font-semibold mb-2">{workout.blocks.strength.name}</p>
                <p className="text-muted-foreground mb-2">{workout.blocks.strength.scheme}</p>
                {workout.blocks.strength.rest_sec && (
                  <p className="text-sm text-muted-foreground">Rest: {workout.blocks.strength.rest_sec}s between sets</p>
                )}
                {workout.blocks.strength.equipment && workout.blocks.strength.equipment.length > 0 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Equipment: {workout.blocks.strength.equipment.join(', ')}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Metcon */}
          {workout.blocks.metcon && (
            <div className={`border-l-4 ${blockTypeColors.metcon} bg-card rounded-lg p-6`}>
              <h2 className="text-2xl font-bold mb-4 capitalize">Metcon</h2>

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
                      <span className="text-muted-foreground mt-1">•</span>
                      <div className="flex-1">
                        <p className="font-medium">{part.reps}x {part.movement}</p>
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
              <h2 className="text-2xl font-bold mb-4 capitalize">Accessory</h2>
              <ul className="space-y-3">
                {workout.blocks.accessory.map((ex, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-muted-foreground mt-1">•</span>
                    <div className="flex-1">
                      <p className="font-medium">{ex.movement}</p>
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
              <h2 className="text-2xl font-bold mb-4 capitalize">Cooldown</h2>
              <ul className="space-y-3">
                {workout.blocks.cooldown.map((ex, idx) => (
                  <li key={idx} className="flex items-start gap-3">
                    <span className="text-muted-foreground mt-1">•</span>
                    <div className="flex-1">
                      <p className="font-medium">{ex.movement}</p>
                      {ex.duration_sec && (
                        <p className="text-sm text-muted-foreground mt-1">{ex.duration_sec}s</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default function WorkoutDetailPage() {
  return (
    <ProtectedRoute>
      <WorkoutDetailContent />
    </ProtectedRoute>
  )
}
