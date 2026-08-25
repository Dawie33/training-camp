'use client'

import dynamic from 'next/dynamic'
import { RichSectionDisplay } from '@/components/workout/display/RichSectionDisplay'
import { WorkoutPrintView, printWorkout } from '@/components/workout/WorkoutPrintView'

const ActiveWorkoutSession = dynamic(() => import('@/components/workout/ActiveWorkoutSession').then(m => ({ default: m.ActiveWorkoutSession })), { ssr: false })
import { PersonalizedWorkout } from '@/domain/entities/workout'
import { workoutsService, sessionService } from '@/services'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const difficultyConfig: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Debutant', color: 'text-emerald-500' },
  intermediate: { label: 'Intermediaire', color: 'text-amber-500' },
  advanced: { label: 'Avance', color: 'text-red-500' },
}

function PersonalizedWorkoutDetailContent() {
  const params = useParams()
  const router = useRouter()
  const [workout, setWorkout] = useState<PersonalizedWorkout | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeSession, setActiveSession] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    const fetchPersonalizedWorkout = async () => {
      try {
        setLoading(true)
        const response = await workoutsService.getPersonalizedWorkout(params.id as string)
        if (!response) throw new Error('Failed to fetch personalized workout')
        setWorkout(response)
      } catch (error) {
        toast.error(`Failed to fetch personalized workout: ${error}`)
      } finally {
        setLoading(false)
      }
    }
    if (params.id) fetchPersonalizedWorkout()
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
      toast.error(errorMessage)
    } finally {
      setIsStarting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 animate-pulse" />
      </div>
    )
  }

  if (!workout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <p className="text-red-400 font-medium">Workout personnalisé introuvable</p>
          <Link href="/personalized-workout" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Retour aux workouts personnalisés
          </Link>
        </div>
      </div>
    )
  }

  if (activeSession) {
    return (
      <ActiveWorkoutSession
        workout={workout.plan_json}
        sessionId={activeSession}
        onClose={() => setActiveSession(null)}
      />
    )
  }

  const w = workout.plan_json
  const diff = w.difficulty ? difficultyConfig[w.difficulty] : null

  return (
    <div className="min-h-screen lg:h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
      {/* LEFT PANEL - Workout Details */}
      <div className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden order-2 lg:order-1 min-h-0">
        {/* HEADER */}
        <div className="flex-shrink-0 px-4 lg:px-8 py-4 lg:py-6 border-b border-slate-700/50 sticky top-0 bg-slate-900/95 backdrop-blur-sm z-10 lg:static lg:bg-transparent">
          <div className="flex items-start gap-2 lg:gap-4">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-9 h-9 lg:w-10 lg:h-10 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white mt-1"
            >
              <span className="text-sm lg:text-base">&larr;</span>
            </button>

            <div className="flex items-center gap-2 lg:gap-3 flex-1 min-w-0">
              <div className="w-1.5 lg:w-2 h-8 lg:h-12 bg-orange-500 rounded-full flex-shrink-0"></div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold tracking-tight truncate">{w.name || 'Workout'}</h1>
                <div className="flex items-center gap-2 lg:gap-3 mt-1 lg:mt-2 flex-wrap">
                  <span className="px-2 lg:px-3 py-0.5 lg:py-1 bg-blue-500/20 text-blue-400 rounded-full text-xs lg:text-sm font-semibold">
                    Personnalisé
                  </span>
                  {w.workout_type && (
                    <span className="px-2 lg:px-3 py-0.5 lg:py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs lg:text-sm font-semibold">
                      {w.workout_type.replace(/_/g, ' ')}
                    </span>
                  )}
                  {diff && (
                    <span className={`${diff.color} text-xs lg:text-sm`}>
                      {diff.label}
                    </span>
                  )}
                  {w.estimated_duration && (
                    <span className="text-slate-400 text-xs lg:text-sm">
                      Cap: {w.estimated_duration} min
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 lg:gap-2">
              <button
                onClick={printWorkout}
                className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-xs lg:text-sm font-medium text-slate-300"
                title="Exporter en PDF"
              >
                <span>📄</span>
                <span className="hidden sm:inline">PDF</span>
              </button>
            </div>
          </div>

          {/* Stimulus */}
          {w.blocks?.stimulus && (
            <p className="text-slate-300 text-sm lg:text-lg mt-3 lg:mt-4 italic">{w.blocks.stimulus}</p>
          )}

          {/* Description */}
          {w.description && (
            <p className="text-slate-400 text-sm mt-2">{w.description}</p>
          )}
        </div>

        {/* MAIN CONTENT */}
        <div className="flex-1 lg:overflow-y-auto px-4 lg:px-8 py-4 lg:py-6 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* All sections */}
            {w.blocks?.sections.map((section, idx) => (
              <div key={idx}>
                <RichSectionDisplay section={section} />
              </div>
            ))}

            {/* Equipment */}
            {w.equipment_required && w.equipment_required.length > 0 && (
              <div className="pt-4 border-t border-slate-700/50 text-sm text-slate-400">
                <strong className="text-white">Équipement : </strong>
                {w.equipment_required.join(', ')}
              </div>
            )}

            {/* Coach notes */}
            {w.coach_notes && (
              <div className="pt-4 border-t border-slate-700/50 text-sm text-slate-400">
                <strong className="text-white">Notes du coach : </strong>
                {w.coach_notes}
              </div>
            )}

            {/* Save WOD button */}
            <div className="pt-4 border-t border-slate-700/50">
              <button
                onClick={() => router.push(`/crossfit/log-workout?personalizedWorkoutId=${workout?.id}`)}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 hover:border-slate-500 rounded-xl text-sm font-semibold text-slate-300 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <span>✓</span>
                Enregistrer le WOD
              </button>
            </div>
          </motion.div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-full lg:w-[450px] bg-slate-950/50 border-t lg:border-t-0 lg:border-l border-slate-700/50 flex flex-col items-center justify-center p-4 lg:p-8 backdrop-blur-sm order-1 lg:order-2 flex-shrink-0">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-center space-y-4 w-full"
        >
          <button
            onClick={handleStartWorkout}
            disabled={isStarting}
            className="w-full py-3 lg:py-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 rounded-xl text-sm lg:text-base font-semibold transition-all shadow-lg shadow-orange-500/30 flex items-center justify-center active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? 'Démarrage...' : 'Commencer le workout'}
          </button>
        </motion.div>
      </div>

      <WorkoutPrintView workout={workout.plan_json} />
    </div>
  )
}

export default function PersonalizedWorkoutDetailPage() {
  return     <PersonalizedWorkoutDetailContent />
}
