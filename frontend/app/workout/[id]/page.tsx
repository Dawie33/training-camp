'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ActiveWorkoutSession } from '@/components/workout/ActiveWorkoutSession'
import { WorkoutDisplay } from '@/components/workout/display/WorkoutDisplay'
import { useSport } from '@/contexts/SportContext'
import { workoutsService } from '@/lib/api'
import { Workouts } from '@/lib/types/workout'
import { getSportImage } from '@/lib/utils/sport-images'
import { ArrowLeft, Calendar, Clock, Share2 } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

function WorkoutDetailContent() {
  const params = useParams()
  const router = useRouter()
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
        const data = await workoutsService.getById(params.id as string)
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

  /**
   * Démarre un workout et crée une nouvelle session
   * En cas d'erreur, affiche un message d'erreur
   * Met à jour l'état de la session en cours
   * Met à jour l'indicateur de démarrage en cours
   * @returns {Promise<void>} - promesse qui résout sans valeur
   */
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
          <button
            onClick={() => router.back()}
            className="inline-flex items-center gap-2 text-white/90 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </button>

          {/* Title & Info */}
          <div className="absolute bottom-8 left-6 right-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-semibold px-3 py-1.5 bg-primary text-primary-foreground rounded-full">
                WORKOUT DU JOUR
              </span>
              <div className="flex items-center gap-2 text-white/90 text-sm">
                <Calendar className="w-4 h-4" />
                <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
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
        <WorkoutDisplay blocks={workout.blocks} showTitle={true} isStarting={isStarting} />

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
