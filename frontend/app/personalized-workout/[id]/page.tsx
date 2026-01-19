'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { ActiveWorkoutSession } from '@/components/workout/ActiveWorkoutSession'
import { WorkoutDisplay } from '@/components/workout/display/WorkoutDisplay'
import { ExerciseDetailModal } from '@/components/workout/ExerciseDetailModal'
import { sessionService, workoutsService } from '@/services'
import { PersonalizedWorkout } from '@/domain/entities/workout'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { motion } from 'framer-motion'
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
  const [selectedExerciseName, setSelectedExerciseName] = useState<string | null>(null)
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
      const session = await sessionService.startSession({
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

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      case 'intermediate':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
      case 'advanced':
        return 'bg-red-500/20 text-red-400 border-red-500/30'
      default:
        return 'bg-white/10 text-slate-300 border-white/20'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400 mx-auto"></div>
          <p className="mt-4 text-slate-400">Chargement de votre workout personnalisé...</p>
        </div>
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-400">Workout personnalisé introuvable</p>
          <Link href="/dashboard" className="text-orange-400 hover:text-orange-300 mt-4 inline-block">
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
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Back Button */}
        <motion.div variants={fadeInUp}>
          <Link
            href="/personalized-workout"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Retour aux workouts personnalisés
          </Link>
        </motion.div>

        {/* Workout Header */}
        <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Personnalisé
                </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyStyle(workout.plan_json.difficulty)}`}>
                  {workout.plan_json.difficulty}
                </span>
              </div>
              <h1 className="text-3xl font-bold mb-2">
                <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">
                  {workout.plan_json.name}
                </span>
              </h1>
              <p className="text-slate-400">{workout.plan_json.description}</p>
            </div>
          </div>

          {/* Workout Info */}
          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Clock className="w-4 h-4 text-orange-400" />
              <span>{workout.plan_json.estimated_duration || 30} min</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span>Créé le {new Date(workout.plan_json.created_at || workout.created_at).toLocaleDateString('fr-FR')}</span>
            </div>
          </div>

          {/* Start Button */}
          <motion.button
            onClick={handleStartWorkout}
            disabled={isStarting}
            className="mt-6 w-full bg-gradient-to-r from-orange-500 to-rose-500 text-white px-8 py-4 rounded-xl font-semibold hover:from-orange-600 hover:to-rose-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isStarting ? 'Démarrage...' : 'Commencer le workout'}
          </motion.button>
        </motion.div>

        {/* Workout Blocks */}
        <motion.div variants={fadeInUp}>
          <WorkoutDisplay
            blocks={workout.plan_json.blocks}
            showTitle={true}
            isStarting={isStarting}
            onExerciseClick={(exerciseName) => setSelectedExerciseName(exerciseName)}
          />
        </motion.div>

        {selectedExerciseName && (
          <ExerciseDetailModal
            exerciseName={selectedExerciseName}
            isOpen={!!selectedExerciseName}
            onClose={() => setSelectedExerciseName(null)}
          />
        )}
      </div>
    </motion.div>
  )
}

export default function PersonalizedWorkoutDetailPage() {
  return (
    <ProtectedRoute>
      <PersonalizedWorkoutDetailContent />
    </ProtectedRoute>
  )
}
