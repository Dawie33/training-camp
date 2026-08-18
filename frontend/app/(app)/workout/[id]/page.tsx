'use client'

import dynamic from 'next/dynamic'
import { WorkoutPrintView, printWorkout } from '@/components/workout/WorkoutPrintView'
import { WorkoutSectionCard } from './_components/WorkoutSectionCard'

const WorkoutEditModal = dynamic(() => import('@/components/workout/WorkoutEditModal'), { ssr: false })
import { Button } from '@/components/ui/button'
import { Workouts } from '@/domain/entities/workout'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { workoutsService } from '@/services'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, FileDown, Pencil } from 'lucide-react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

const difficultyConfig: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Débutant', color: 'text-emerald-600' },
  intermediate: { label: 'Intermédiaire', color: 'text-amber-600' },
  advanced: { label: 'Avancé', color: 'text-red-600' },
}

function WorkoutDetailContent() {
  const params = useParams()
  const router = useRouter()
  const [workout, setWorkout] = useState<Workouts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditWorkoutModal, setShowEditWorkoutModal] = useState(false)

  useEffect(() => {
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
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  if (error || !workout) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center space-y-3">
          <p className="text-destructive font-medium">{error || 'Workout non trouvé'}</p>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Retour au dashboard
          </Link>
        </div>
      </div>
    )
  }

  const diff = workout.difficulty ? difficultyConfig[workout.difficulty] : null

  return (
    <div className="min-h-screen bg-background">
      <motion.div
        className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8 pb-24"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        {/* HEADER */}
        <motion.div variants={fadeInUp} className="space-y-5">
          <div className="flex items-start gap-3">
            <button
              onClick={() => router.back()}
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors mt-1 flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <div className="flex-1 min-w-0">
              <div className="eyebrow mb-2 flex flex-wrap items-center gap-x-2 gap-y-1">
                {workout.workout_type && <span>{workout.workout_type.replace(/_/g, ' ')}</span>}
                {diff && (
                  <>
                    <span className="text-border">·</span>
                    <span className={diff.color}>{diff.label}</span>
                  </>
                )}
                {workout.estimated_duration && (
                  <>
                    <span className="text-border">·</span>
                    <span>Cap {workout.estimated_duration} min</span>
                  </>
                )}
              </div>
              <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-semibold leading-none tracking-tight truncate">
                {workout.name || 'Workout'}
              </h1>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="outline" size="icon" onClick={printWorkout} title="Exporter en PDF">
                <FileDown className="w-4 h-4" />
              </Button>
              {!workout.is_benchmark && (
                <Button variant="outline" size="icon" onClick={() => setShowEditWorkoutModal(true)} title="Éditer">
                  <Pencil className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>

          {/* Stimulus */}
          {workout.blocks.stimulus && (
            <p className="text-muted-foreground italic">{workout.blocks.stimulus}</p>
          )}
        </motion.div>

        {/* Sections */}
        <motion.div variants={fadeInUp} className="space-y-6">
          {workout.blocks.sections.map((section, idx) => (
            <WorkoutSectionCard key={idx} section={section} />
          ))}
        </motion.div>

        {/* Equipment */}
        {workout.equipment_required && workout.equipment_required.length > 0 && (
          <motion.div variants={fadeInUp} className="pt-4 border-t border-border text-sm text-muted-foreground">
            <strong className="text-foreground">Équipement : </strong>
            {workout.equipment_required.join(', ')}
          </motion.div>
        )}

        {/* Save WOD button */}
        <motion.div variants={fadeInUp}>
          <Button
            onClick={() => router.push(`/crossfit/log-workout?workoutId=${workout.id}`)}
            className="w-full py-6 text-base font-semibold rounded-lg"
          >
            <Check className="w-4 h-4" />
            Enregistrer le WOD
          </Button>
        </motion.div>
      </motion.div>

      {/* Modals */}
      {showEditWorkoutModal && (
        <WorkoutEditModal
          workout={workout}
          isOpen={showEditWorkoutModal}
          onClose={() => setShowEditWorkoutModal(false)}
        />
      )}

      <WorkoutPrintView workout={workout} />
    </div>
  )
}

export default function WorkoutDetailPage() {
  return <WorkoutDetailContent />
}
