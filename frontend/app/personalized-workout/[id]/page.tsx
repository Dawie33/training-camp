'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ActiveWorkoutSession } from '@/components/workout/ActiveWorkoutSession'
import { WorkoutDisplay } from '@/components/workout/display/WorkoutDisplay'
import { workoutsService } from '@/lib/api'
import { PersonalizedWorkout } from '@/lib/types/workout'
import { ArrowLeft, Calendar, Clock } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'



function PersonalizedWorkoutDetailContent() {
  const params = useParams()
  const [workout, setWorkout] = useState<PersonalizedWorkout | null>(null)
  const [loading, setLoading] = useState(true)
  const [isStarting, setIsStarting] = useState(false)
  const [activeSession, setActiveSession] = useState<string | null>(null)
  useEffect(() => {
    const fetchPersonalizedWorkout = async () => {
      try {
        setLoading(true)

        const response = await workoutsService.getPersonalizedWorkout(params.id as string)

        if (!response) {
          throw new Error('Failed to fetch personalized workout')
        }

        setWorkout(response)
      } catch (error) {
        toast.error(`Failed to fetch personalized workout: ${error}`)
      } finally {
        setLoading(false)
      }
    }

    if (params.id) {
      fetchPersonalizedWorkout()
    }
  }, [params.id])

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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement de votre workout personnalisé...</p>
        </div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-muted-foreground">Workout personnalisé introuvable</p>
          <Link href="/dashboard" className="text-primary hover:underline mt-4 inline-block">
            Retour au dashboard
          </Link>
        </div>
      </div>
    )
  }

  if (activeSession && workout) {
    return (
      <ActiveWorkoutSession
        workout={workout.plan_json}
        sessionId={activeSession}
        onClose={() => setActiveSession(null)}
      />
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Retour au dashboard
      </Link>

      {/* Workout Header */}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                Personnalisé
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                {workout.plan_json.difficulty}
              </span>
            </div>
            <h1 className="text-3xl font-bold mb-2">{workout.plan_json.name}</h1>
            <p className="text-muted-foreground">{workout.plan_json.description}</p>
          </div>
        </div>

        {/* Workout Info */}
        <div className="flex flex-wrap gap-4 mt-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            <span>{workout.plan_json.estimated_duration || 30} min</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            <span>Créé le {new Date(workout.plan_json.created_at).toLocaleDateString('fr-FR')}</span>
          </div>
        </div>

        {/* Start Button */}
        <button
          onClick={handleStartWorkout}
          disabled={isStarting}
          className="mt-6 w-full bg-primary text-primary-foreground px-8 py-4 rounded-lg font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isStarting ? 'Démarrage...' : 'Commencer le workout'}
        </button>
      </div>

      {/* Workout Blocks */}
      <WorkoutDisplay blocks={workout.plan_json.blocks} showTitle={true} isStarting={isStarting} />
    </div>
  )
}

export default function PersonalizedWorkoutDetailPage() {
  return (
    <ProtectedRoute>
      <PersonalizedWorkoutDetailContent />
    </ProtectedRoute>
  )
}
