'use client'

import { AMRAPTimer } from '@/app/timer/timers/AMRAPTimer'
import { EMOMTimer } from '@/app/timer/timers/EMOMTimer'
import { ForTimeTimer } from '@/app/timer/timers/ForTimeTimer'
import { TabataTimer } from '@/app/timer/timers/TabataTimer'
import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import WorkoutEditModal from '@/components/workout/WorkoutEditModal'
import { WorkoutResultsModal } from '@/components/workout/WorkoutResultsModal'
import { Workouts } from '@/domain/entities/workout'
import { Exercise, WorkoutBlocks, WorkoutSection } from '@/domain/entities/workout-structure'
import { useTimerVibration } from '@/hooks/useTimerVibration'
import { workoutsService } from '@/services'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

type TimerConfig =
  | { type: 'amrap'; duration: number; label: string }
  | { type: 'for_time'; capMin?: number; label: string }
  | { type: 'emom'; durationMin: number; intervalMin: number; label: string }
  | { type: 'tabata'; rounds?: number; workSeconds: number; restSeconds: number; label: string }

function detectTimerConfigs(blocks: WorkoutBlocks): TimerConfig[] {
  const configs: TimerConfig[] = []

  for (const section of blocks.sections) {
    const formatLower = section.format?.toLowerCase() || ''
    const sectionType = section.type

    // AMRAP
    if (sectionType === 'amrap' || formatLower.includes('amrap')) {
      if (section.duration_min) {
        configs.push({
          type: 'amrap',
          duration: section.duration_min,
          label: section.title || `AMRAP ${section.duration_min}'`,
        })
      }
      continue
    }

    // EMOM
    if (sectionType === 'emom' || formatLower.includes('emom')) {
      const match = formatLower.match(/e(\d+)mom/)
      const intervalMin = match ? parseInt(match[1]) : 1
      const durationMin = section.duration_min || (section.rounds ? section.rounds * intervalMin : undefined)
      if (durationMin) {
        configs.push({
          type: 'emom',
          durationMin,
          intervalMin,
          label: section.title || `EMOM ${durationMin}'`,
        })
      }
      continue
    }

    // Tabata
    if (sectionType === 'tabata' || formatLower.includes('tabata')) {
      configs.push({
        type: 'tabata',
        rounds: section.rounds,
        workSeconds: 20,
        restSeconds: 10,
        label: section.title || 'Tabata',
      })
      continue
    }

    // For Time
    if (sectionType === 'for_time' || formatLower.includes('for time')) {
      configs.push({
        type: 'for_time',
        capMin: section.duration_min,
        label: section.title || 'For Time',
      })
      continue
    }

    // Check format on non-timer section types (e.g. skill_work with format EMOM)
    if (formatLower.includes('amrap') && section.duration_min) {
      configs.push({ type: 'amrap', duration: section.duration_min, label: section.title || `AMRAP ${section.duration_min}'` })
    } else if (formatLower.includes('emom')) {
      const match2 = formatLower.match(/e(\d+)mom/)
      const interval = match2 ? parseInt(match2[1]) : 1
      const dur = section.duration_min || (section.rounds ? section.rounds * interval : undefined)
      if (dur) {
        configs.push({ type: 'emom', durationMin: dur, intervalMin: interval, label: section.title || `EMOM ${dur}'` })
      }
    } else if (formatLower.includes('tabata')) {
      configs.push({ type: 'tabata', rounds: section.rounds, workSeconds: 20, restSeconds: 10, label: section.title || 'Tabata' })
    } else if (formatLower.includes('for time')) {
      configs.push({ type: 'for_time', capMin: section.duration_min, label: section.title || 'For Time' })
    }
  }

  return configs
}

const difficultyConfig: Record<string, { label: string; color: string }> = {
  beginner: { label: 'Debutant', color: 'text-emerald-500' },
  intermediate: { label: 'Intermediaire', color: 'text-amber-500' },
  advanced: { label: 'Avance', color: 'text-red-500' },
}

const FORMAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  amrap: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500' },
  emom: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500' },
  'for time': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500' },
  'for_time': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500' },
  tabata: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500' },
  warmup: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500' },
  cooldown: { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-500' },
  strength: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500' },
  skill_work: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500' },
}

const TIMER_TAB_COLORS: Record<string, { active: string; inactive: string }> = {
  amrap: { active: 'bg-orange-500 text-white', inactive: 'text-orange-400 hover:bg-orange-500/20' },
  for_time: { active: 'bg-blue-500 text-white', inactive: 'text-blue-400 hover:bg-blue-500/20' },
  emom: { active: 'bg-purple-500 text-white', inactive: 'text-purple-400 hover:bg-purple-500/20' },
  tabata: { active: 'bg-green-500 text-white', inactive: 'text-green-400 hover:bg-green-500/20' },
}

function getSectionColors(section: WorkoutSection) {
  const formatLower = section.format?.toLowerCase() || ''
  const sectionType = section.type

  // Try format first
  for (const key of Object.keys(FORMAT_COLORS)) {
    if (formatLower.includes(key)) return FORMAT_COLORS[key]
  }
  // Then type
  if (FORMAT_COLORS[sectionType]) return FORMAT_COLORS[sectionType]

  // Default
  return { bg: 'bg-slate-500/20', text: 'text-slate-400', border: 'border-slate-600' }
}

function getFormatLabel(section: WorkoutSection): string | null {
  if (section.format) return section.format
  const typeFormats: Record<string, string> = {
    amrap: 'AMRAP',
    emom: 'EMOM',
    for_time: 'For Time',
    tabata: 'Tabata',
  }
  return typeFormats[section.type] || null
}

function ExerciseDisplay({ exercise, idx, colors }: { exercise: Exercise; idx: number; colors: ReturnType<typeof getSectionColors> }) {
  return (
    <div className="flex items-start justify-between p-3 bg-slate-900/50 rounded-lg lg:rounded-xl hover:bg-slate-900/70 transition-colors">
      <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
        {/* Number badge */}
        <div className={`w-6 h-8 lg:w-10 lg:h-10 ${colors.bg} rounded-lg flex items-center justify-center ${colors.text} font-bold text-sm lg:text-base flex-shrink-0 mt-0.5`}>
          {idx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold ">{exercise.name}</div>

          {/* Tags: duration, distance, per_side */}
          <div className="flex flex-wrap gap-1.5 mt-1">
            {exercise.duration && (
              <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300">{exercise.duration}</span>
            )}
            {exercise.distance && (
              <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300">{exercise.distance}</span>
            )}
            {exercise.per_side && (
              <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300">par côté</span>
            )}
            {exercise.tempo && (
              <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300">Tempo: {exercise.tempo}</span>
            )}
          </div>

          {exercise.weight && (
            <div className="text-xs lg:text-sm text-slate-400 mt-0.5">{exercise.weight}</div>
          )}

          {/* Extra fields: intensity, pace, effort */}
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            {exercise.intensity && (
              <span className="text-xs text-slate-500">Intensité: {exercise.intensity}</span>
            )}
            {exercise.pace && (
              <span className="text-xs text-slate-500">Pace: {exercise.pace}</span>
            )}
            {exercise.effort && (
              <span className="text-xs text-slate-500">Effort: {exercise.effort}</span>
            )}
          </div>

          {exercise.details && (
            <div className="text-xs text-slate-500 mt-1">{exercise.details}</div>
          )}
        </div>
      </div>
      {/* Reps/Info */}
      {(exercise.reps || (!exercise.duration && !exercise.distance)) && exercise.reps && (
        <div className={``}>
          {exercise.reps} reps
        </div>
      )}
    </div>
  )
}

function SectionDisplay({ section }: { section: WorkoutSection }) {
  const colors = getSectionColors(section)
  const formatLabel = getFormatLabel(section)

  return (
    <div className="space-y-4">
      <div className={` rounded-xl lg:rounded-2xl overflow-hidden`}>
        <div className="bg-slate-800/50 p-4 lg:p-6 border border-slate-700/50 border-l-0 rounded-r-xl lg:rounded-r-2xl">
          {/* Section Header */}
          <div className="flex items-center gap-2 lg:gap-3 mb-3">
            <h3 className="text-lg lg:text-xl font-semibold">
              {section.title || section.format || section.type}
            </h3>
            {formatLabel && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${colors.bg} ${colors.text}`}>
                {formatLabel}
              </span>
            )}
            {section.duration_min && (
              <span className="text-slate-400 text-sm">{section.duration_min} min</span>
            )}
          </div>

          {/* Section metadata */}
          <div className="flex flex-wrap gap-2 mb-3">
            {section.rounds && section.rounds > 1 && (
              <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300">
                {section.rounds} rounds
              </span>
            )}
            {section.rest_between_rounds && (
              <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300">
                Rest: {section.rest_between_rounds}s entre rounds
              </span>
            )}
            {section.focus && (
              <span className="px-2 py-0.5 bg-slate-700/50 rounded text-xs text-slate-300">
                Focus: {section.focus}
              </span>
            )}
          </div>

          {section.goal && (
            <p className="text-sm text-slate-400 mb-3">{section.goal}</p>
          )}
          {section.description && (
            <p className="text-sm text-slate-400 italic mb-3">{section.description}</p>
          )}

          {/* Exercises */}
          {section.exercises && section.exercises.length > 0 && (
            <div className="space-y-3 lg:space-y-4">
              {section.exercises.map((exercise, idx) => (
                <ExerciseDisplay key={idx} exercise={exercise} idx={idx} colors={colors} />
              ))}
            </div>
          )}
        </div>
      </div>

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
  const [activeTimerIndex, setActiveTimerIndex] = useState(0)
  const vibration = useTimerVibration()

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

  const timerConfigs = detectTimerConfigs(workout.blocks)
  const activeConfig = timerConfigs[activeTimerIndex] || null
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
                className={`p-1.5 lg:p-2 rounded-lg transition-colors ${soundEnabled ? 'bg-orange-500/20 text-orange-400' : 'bg-slate-800 text-slate-400'
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
                className={`flex-1 py-2.5 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base font-semibold transition-all ${workoutVersion === 'RX'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                  : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800'
                  }`}
              >
                RX
              </button>
              <button
                onClick={() => setWorkoutVersion('SCALED')}
                className={`flex-1 py-2.5 lg:py-3 px-4 lg:px-6 rounded-xl text-sm lg:text-base font-semibold transition-all ${workoutVersion === 'SCALED'
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
      {timerConfigs.length > 0 && (
        <div className="w-full lg:w-[450px] bg-slate-950/50 border-t lg:border-t-0 lg:border-l border-slate-700/50 flex flex-col items-center p-4 lg:p-8 backdrop-blur-sm order-1 lg:order-2 flex-shrink-0">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-center space-y-6 w-full flex flex-col flex-1"
          >
            {/* Timer tabs */}
            {timerConfigs.length > 1 && (
              <div className="flex gap-1 bg-slate-800/50 rounded-xl p-1">
                {timerConfigs.map((config, idx) => {
                  const tabColors = TIMER_TAB_COLORS[config.type] || TIMER_TAB_COLORS.for_time
                  const isActive = idx === activeTimerIndex
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveTimerIndex(idx)}
                      className={`flex-1 px-3 py-2 rounded-lg text-xs lg:text-sm font-semibold transition-all ${isActive ? tabColors.active : tabColors.inactive
                        }`}
                    >
                      {config.label}
                    </button>
                  )
                })}
              </div>
            )}

            {/* Active timer */}
            <div className="flex-1 flex items-center justify-center">
              {activeConfig && renderTimer(activeConfig)}
            </div>

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
          rounds={activeConfig?.type === 'amrap' ? amrapRounds : undefined}
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
