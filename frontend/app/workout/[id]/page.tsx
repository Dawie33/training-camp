'use client'

import { AMRAPTimer } from '@/app/timer/timers/AMRAPTimer'
import { EMOMTimer } from '@/app/timer/timers/EMOMTimer'
import { ForTimeTimer } from '@/app/timer/timers/ForTimeTimer'
import { TabataTimer } from '@/app/timer/timers/TabataTimer'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import WorkoutEditModal from '@/components/workout/WorkoutEditModal'
import { WorkoutResultsModal } from '@/components/workout/WorkoutResultsModal'
import { Workouts } from '@/domain/entities/workout'
import { WorkoutBlocks, WorkoutSection, Exercise } from '@/domain/entities/workout-structure'
import { useTimerVibration } from '@/hooks/useTimerVibration'
import { workoutsService } from '@/services'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type TimerConfig =
  | { type: 'amrap'; duration: number }
  | { type: 'for_time'; capMin?: number }
  | { type: 'emom'; durationMin: number; intervalMin: number }
  | { type: 'tabata'; rounds?: number; workSeconds: number; restSeconds: number }

function detectTimerConfig(blocks: WorkoutBlocks): TimerConfig | null {
  for (const section of blocks.sections) {
    if ((section.type === 'amrap' || section.format?.toLowerCase().includes('amrap')) && section.duration_min) {
      return { type: 'amrap', duration: section.duration_min }
    }
    if (section.type === 'for_time' || section.format?.toLowerCase().includes('for time')) {
      return { type: 'for_time', capMin: section.duration_min }
    }
    if ((section.type === 'emom' || section.format?.toLowerCase().includes('emom')) && section.duration_min) {
      const match = section.format?.toLowerCase().match(/e(\d+)mom/)
      return { type: 'emom', durationMin: section.duration_min, intervalMin: match ? parseInt(match[1]) : 1 }
    }
    if (section.type === 'tabata' || section.format?.toLowerCase().includes('tabata')) {
      return { type: 'tabata', rounds: section.rounds, workSeconds: 20, restSeconds: 10 }
    }
  }
  return null
}

const difficultyConfig: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Debutant', color: 'text-emerald-500' },
  intermediate: { label: 'Intermediaire', color: 'text-amber-500' },
  advanced: { label: 'Avance', color: 'text-red-500' },
}

function formatExercise(exercise: Exercise): string {
  const parts: string[] = [exercise.name]

  if (exercise.reps) parts.push(`${exercise.reps} reps`)
  if (exercise.duration) parts.push(exercise.duration)
  if (exercise.distance) parts.push(exercise.distance)
  if (exercise.weight) parts.push(`(${exercise.weight})`)
  if (exercise.per_side) parts.push('par côté')

  return parts.join(' ')
}


function SectionDisplay({ section }: { section: WorkoutSection }) {
  const isWarmup = section.type?.toLowerCase().includes('warm') || section.title?.toLowerCase().includes('échauffement')
  const isCooldown = section.type?.toLowerCase().includes('cool') || section.title?.toLowerCase().includes('retour')
  const isMetcon = section.type === 'amrap' || section.type === 'for_time' || section.type === 'emom' || section.format?.toLowerCase().includes('for time')

  return (
    <div className="space-y-4">
      {/* Section Header */}
      {isWarmup || isCooldown ? (
        // Warmup/Cooldown - Bloc avec fond et bordure
        <div className="bg-slate-800/50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-slate-700/50">
          <h3 className="text-base lg:text-lg font-semibold mb-2 lg:mb-3">
            <span>{section.title || section.format}</span>
            {section.duration_min && (
              <span className="text-slate-400 font-normal text-sm lg:text-base">({section.duration_min} min)</span>
            )}
          </h3>
          {section.exercises && section.exercises.length > 0 && (
            <div className="space-y-1.5 lg:space-y-2">
              {section.exercises.map((exercise, idx) => (
                <div key={idx} className="text-slate-300 pl-3 lg:pl-4 text-sm lg:text-base">
                  • {formatExercise(exercise)}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : isMetcon ? (
        // Metcon/Main workout style avec cartes d'exercices
        <div className="space-y-3 lg:space-y-4">
          <div className="space-y-1 lg:space-y-2">
            <h3 className="text-xl lg:text-2xl font-bold">
              <span>{section.format || section.title}</span>
              {section.duration_min && (
                <span className="text-sm lg:text-base font-normal text-slate-400">
                  {' '}- Cap {section.duration_min} min
                </span>
              )}
            </h3>
            {section.goal && (
              <p className="text-sm lg:text-base text-slate-400">{section.goal}</p>
            )}
            {section.rounds && section.rounds > 1 && (
              <p className="text-sm lg:text-base text-slate-400">
                {section.rounds}-{Math.max(1, section.rounds - 6)}-{Math.max(1, section.rounds - 12)} reps de chaque exercice
              </p>
            )}
          </div>

          {/* Exercise Cards */}
          {section.exercises && section.exercises.length > 0 && (
            <div className="bg-slate-800/50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-slate-700/50">
              <div className="space-y-3 lg:space-y-4">
                {section.exercises.map((exercise, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 lg:p-4 bg-slate-900/50 rounded-lg lg:rounded-xl hover:bg-slate-900/70 transition-colors"
                  >
                    <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
                      {/* Number badge */}
                      <div className="w-8 h-8 lg:w-10 lg:h-10 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-400 font-bold text-sm lg:text-base flex-shrink-0">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-base lg:text-lg truncate">{exercise.name}</div>
                        {exercise.weight && (
                          <div className="text-xs lg:text-sm text-slate-400">{exercise.weight}</div>
                        )}
                        {exercise.details && (
                          <div className="text-xs text-slate-500 mt-0.5 lg:mt-1 line-clamp-1">{exercise.details}</div>
                        )}
                      </div>
                    </div>
                    {/* Reps/Info - Grand affichage orange */}
                    {(exercise.reps || section.rounds || exercise.duration || exercise.distance) && (
                      <div className="text-xl lg:text-2xl font-bold text-orange-400 flex-shrink-0 ml-2">
                        {section.rounds && section.rounds > 1
                          ? `${section.rounds}-${Math.max(1, section.rounds - 6)}-${Math.max(1, section.rounds - 12)}`
                          : exercise.reps || exercise.duration || exercise.distance
                        }
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {section.description && (
            <p className="text-xs lg:text-sm text-slate-400 italic">{section.description}</p>
          )}
        </div>
      ) : (
        // Autres sections (strength, etc.)
        <div className="bg-slate-800/50 rounded-xl lg:rounded-2xl p-4 lg:p-6 border border-slate-700/50">
          <h3 className="text-lg lg:text-xl font-semibold mb-2 lg:mb-3">
            <span>{section.title || section.format}</span>
          </h3>
          {section.exercises && section.exercises.length > 0 && (
            <div className="space-y-1.5 lg:space-y-2">
              {section.exercises.map((exercise, idx) => (
                <div key={idx} className="text-slate-300 pl-3 lg:pl-4 text-sm lg:text-base">
                  • {formatExercise(exercise)}
                </div>
              ))}
            </div>
          )}
          {section.description && (
            <p className="text-xs lg:text-sm text-slate-400 italic mt-2">{section.description}</p>
          )}
        </div>
      )}

      {/* Nested sections */}
      {section.sections?.map((sub, idx) => (
        <div key={idx} className="ml-0 mt-4">
          <SectionDisplay section={sub} />
        </div>
      ))}
    </div>
  )
}

function WorkoutDetailContent() {
  const params = useParams()
  const router = useRouter()
  const [workout, setWorkout] = useState<Workouts | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showEditWorkoutModal, setShowEditWorkoutModal] = useState(false)
  const [workoutVersion, setWorkoutVersion] = useState<'RX' | 'SCALED'>('RX')
  const [showResultsModal, setShowResultsModal] = useState(false)
  const [soundEnabled, setSoundEnabled] = useState(true)
  const [timerElapsed, setTimerElapsed] = useState('0:00')
  const [amrapRounds, setAmrapRounds] = useState(0)
  const vibration = useTimerVibration()

  // Détecter si le timer a démarré
  const isTimerStarted = timerElapsed !== '0:00'

  const handleFinishWorkout = () => {
    vibration.vibrateFinish()
    setShowResultsModal(true)
  }

  const renderTimer = (config: TimerConfig) => {
    switch (config.type) {
      case 'amrap':
        return (
          <AMRAPTimer
            duration={config.duration}
            onTimeUpdate={setTimerElapsed}
            onRoundsUpdate={setAmrapRounds}
            soundEnabled={soundEnabled}
          />
        )
      case 'for_time':
        return <ForTimeTimer capMin={config.capMin} onTimeUpdate={setTimerElapsed} />
      case 'emom':
        return <EMOMTimer durationMin={config.durationMin} intervalMin={config.intervalMin} onTimeUpdate={setTimerElapsed} />
      case 'tabata':
        return <TabataTimer rounds={config.rounds} workSeconds={config.workSeconds} restSeconds={config.restSeconds} onTimeUpdate={setTimerElapsed} />
    }
  }

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 animate-pulse">
        </div>
      </div>
    )
  }

  if (error || !workout) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <p className="text-red-400 font-medium">{error || 'Workout non trouve'}</p>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Retour au dashboard
          </Link>
        </div>
      </div>
    )
  }

  const timerConfig = detectTimerConfig(workout.blocks)
  const diff = workout.difficulty ? difficultyConfig[workout.difficulty] : null

  return (
    <div className="min-h-screen lg:h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex flex-col lg:flex-row overflow-y-auto lg:overflow-hidden">
      {/* LEFT PANEL - Workout Details */}
      <div className="flex-1 flex flex-col overflow-y-auto lg:overflow-hidden order-2 lg:order-1 min-h-0">
        {/* HEADER avec barre verticale orange */}
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
                <h1 className="text-2xl sm:text-3xl lg:text-5xl font-bold tracking-tight truncate">{workout.name || 'Workout'}</h1>
                <div className="flex items-center gap-2 lg:gap-3 mt-1 lg:mt-2 flex-wrap">
                  {workout.workout_type && (
                    <span className="px-2 lg:px-3 py-0.5 lg:py-1 bg-orange-500/20 text-orange-400 rounded-full text-xs lg:text-sm font-semibold">
                      {workout.workout_type.replace(/_/g, ' ')}
                    </span>
                  )}
                  {diff && (
                    <span className={`${diff.color} text-xs lg:text-sm`}>
                      {diff.label}
                    </span>
                  )}
                  {workout.estimated_duration && (
                    <span className="text-slate-400 text-xs lg:text-sm">
                      Cap: {workout.estimated_duration} min
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 lg:gap-2">
              {/* Sound toggle */}
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 lg:p-2 rounded-lg transition-colors ${
                  soundEnabled ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-400'
                }`}
                title={soundEnabled ? 'Désactiver le son' : 'Activer le son'}
              >
                <span className="text-xs lg:text-sm font-semibold">{soundEnabled ? 'ON' : 'OFF'}</span>
              </button>

              {!workout.is_benchmark && (
                <button
                  onClick={() => setShowEditWorkoutModal(true)}
                  className="flex items-center gap-1 lg:gap-2 px-2 lg:px-3 py-1.5 lg:py-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors text-xs lg:text-sm font-medium text-slate-300"
                >
                  <span>Éditer</span>
                </button>
              )}
            </div>
          </div>

          {/* Stimulus sous le titre */}
          {workout.blocks.stimulus && (
            <p className="text-slate-300 text-sm lg:text-lg mt-3 lg:mt-4 italic">{workout.blocks.stimulus}</p>
          )}

          {/* RX/Scaled tabs */}
          {workout.scaling_options && workout.scaling_options.length > 0 && (
            <div className="flex gap-2 mt-4 lg:mt-6">
              <button
                onClick={() => setWorkoutVersion('RX')}
                className={`flex-1 py-2.5 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base font-semibold transition-all ${
                  workoutVersion === 'RX'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                }`}
              >
                RX
              </button>
              <button
                onClick={() => setWorkoutVersion('SCALED')}
                className={`flex-1 py-2.5 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base font-semibold transition-all ${
                  workoutVersion === 'SCALED'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                }`}
              >
                SCALED
              </button>
            </div>
          )}
        </div>

        {/* MAIN CONTENT - Scrollable workout details */}
        <div className="flex-1 lg:overflow-y-auto px-4 lg:px-8 py-4 lg:py-6 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
          >
            {/* Scaling Options (when SCALED is selected) */}
            {workoutVersion === 'SCALED' && workout.scaling_options && workout.scaling_options.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
                <h3 className="font-semibold text-amber-400 mb-2">
                  Options Scaled
                </h3>
                <ul className="space-y-1 text-amber-300">
                  {workout.scaling_options.map((option, idx) => (
                    <li key={idx}>• {option}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* All sections */}
            {workout.blocks.sections.map((section, idx) => (
              <div key={idx}>
                <SectionDisplay section={section} />
              </div>
            ))}

            {/* Equipment */}
            {workout.equipment_required && workout.equipment_required.length > 0 && (
              <div className="pt-4 border-t border-slate-700/50 text-sm text-slate-400">
                <strong className="text-white">Équipement : </strong>
                {workout.equipment_required.join(', ')}
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {/* RIGHT PANEL - Timer */}
      {timerConfig && (
        <div className="w-full lg:w-[450px] bg-slate-950/50 border-t lg:border-t-0 lg:border-l border-slate-700/50 flex flex-col items-center justify-center p-4 lg:p-8 backdrop-blur-sm order-1 lg:order-2 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-center space-y-8 w-full"
          >
            {renderTimer(timerConfig)}

            {/* Finish Workout Button */}
            {isTimerStarted && (
              <button
                onClick={handleFinishWorkout}
                className="w-full py-3 lg:py-4 bg-green-500 hover:bg-green-600 rounded-xl text-sm lg:text-base font-semibold transition-all shadow-lg shadow-green-500/30 flex items-center justify-center active:scale-95"
              >
                Terminer le WOD
              </button>
            )}

            {!isTimerStarted && (
              <div className="text-slate-500 text-xs lg:text-sm">
                Appuyez sur play pour démarrer
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Modals */}
      {showEditWorkoutModal && (
        <WorkoutEditModal
          workout={workout}
          isOpen={showEditWorkoutModal}
          onClose={() => setShowEditWorkoutModal(false)}
        />
      )}

      {showResultsModal && (
        <WorkoutResultsModal
          isOpen={showResultsModal}
          onClose={() => setShowResultsModal(false)}
          workoutId={workout.id}
          workoutName={workout.name}
          timeElapsed={timerElapsed}
          rounds={timerConfig?.type === 'amrap' ? amrapRounds : undefined}
          version={workoutVersion}
        />
      )}
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
