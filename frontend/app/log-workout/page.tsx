'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { PersonalizedWorkout, Workouts } from '@/domain/entities/workout'
import { Exercise } from '@/domain/entities/workout-structure'
import { sessionService, workoutsService } from '@/services'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

function getAllExercises(workout: Workouts): Exercise[] {
  const exercises: Exercise[] = []
  const collectExercises = (sections: Workouts['blocks']['sections']) => {
    for (const section of sections) {
      if (section.exercises) {
        exercises.push(...section.exercises)
      }
      if (section.sections) {
        collectExercises(section.sections)
      }
    }
  }
  if (workout.blocks?.sections) {
    collectExercises(workout.blocks.sections)
  }
  return exercises
}

function LogWorkoutContent() {
  const router = useRouter()

  // Workout selection
  const [workouts, setWorkouts] = useState<Workouts[]>([])
  const [personalizedWorkouts, setPersonalizedWorkouts] = useState<PersonalizedWorkout[]>([])
  const [loadingWorkouts, setLoadingWorkouts] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedWorkout, setSelectedWorkout] = useState<Workouts | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)

  // Exercise weights
  const [weightsUsed, setWeightsUsed] = useState<Record<string, string>>({})

  // Results
  const [timeMinutes, setTimeMinutes] = useState('')
  const [timeSeconds, setTimeSeconds] = useState('')
  const [rounds, setRounds] = useState('')
  const [version, setVersion] = useState<'RX' | 'SCALED'>('RX')
  const [rating, setRating] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [wodDate, setWodDate] = useState(() => {
    const now = new Date()
    return now.toISOString().slice(0, 16) // YYYY-MM-DDTHH:mm format
  })

  // Saving
  const [isSaving, setIsSaving] = useState(false)

  // Fetch workouts
  useEffect(() => {
    const fetchWorkouts = async () => {
      try {
        setLoadingWorkouts(true)
        const [allWorkouts, personalizedResult] = await Promise.all([
          workoutsService.getAll({ limit: 100 }),
          workoutsService.getPersonalizedWorkouts(100)
        ])
        setWorkouts(allWorkouts.rows)
        setPersonalizedWorkouts(personalizedResult.rows)
      } catch (error) {
        console.error('Error fetching workouts:', error)
        toast.error('Erreur lors du chargement des workouts')
      } finally {
        setLoadingWorkouts(false)
      }
    }
    fetchWorkouts()
  }, [])

  // Combined workout list for search
  const allWorkoutsList = useMemo(() => {
    const fromPersonalized = personalizedWorkouts.map(pw => pw.plan_json)
    return [...workouts, ...fromPersonalized]
  }, [workouts, personalizedWorkouts])

  const filteredWorkouts = useMemo(() => {
    if (!search.trim()) return allWorkoutsList.slice(0, 20)
    const q = search.toLowerCase()
    return allWorkoutsList.filter(w =>
      w.name?.toLowerCase().includes(q) ||
      w.workout_type?.toLowerCase().includes(q) ||
      w.tags?.some(t => t.toLowerCase().includes(q))
    ).slice(0, 20)
  }, [allWorkoutsList, search])

  // Exercises from selected workout
  const exercises = useMemo(() => {
    if (!selectedWorkout) return []
    return getAllExercises(selectedWorkout)
  }, [selectedWorkout])

  const isAmrap = useMemo(() => {
    if (!selectedWorkout) return false
    return selectedWorkout.workout_type?.toLowerCase().includes('amrap') ||
      selectedWorkout.blocks?.sections?.some(s =>
        s.type === 'amrap' || s.format?.toLowerCase().includes('amrap')
      )
  }, [selectedWorkout])

  const handleSelectWorkout = useCallback((workout: Workouts) => {
    setSelectedWorkout(workout)
    setSearch(workout.name || '')
    setShowDropdown(false)
    setWeightsUsed({})
  }, [])

  const handleWeightChange = useCallback((exerciseName: string, value: string) => {
    setWeightsUsed(prev => ({ ...prev, [exerciseName]: value }))
  }, [])

  const handleSave = async () => {
    if (!selectedWorkout) {
      toast.error('Sélectionne un workout')
      return
    }

    const totalSeconds = (parseInt(timeMinutes || '0') * 60) + parseInt(timeSeconds || '0')
    if (totalSeconds === 0 && !rounds) {
      toast.error('Saisis un temps ou un nombre de rounds')
      return
    }

    try {
      setIsSaving(true)

      const completedAt = new Date(wodDate)
      const startedAt = new Date(completedAt.getTime() - totalSeconds * 1000)

      // Create session
      const session = await sessionService.startSession({
        workout_id: selectedWorkout.id,
        started_at: startedAt.toISOString()
      })

      // Clean weights (remove empty values)
      const cleanWeights: Record<string, string> = {}
      for (const [name, weight] of Object.entries(weightsUsed)) {
        if (weight.trim()) {
          cleanWeights[name] = weight.trim()
        }
      }

      // Update with results
      await sessionService.updateSession(session.id, {
        completed_at: completedAt.toISOString(),
        notes: notes || undefined,
        results: {
          elapsed_time_seconds: totalSeconds,
          rounds: rounds ? parseInt(rounds) : undefined,
          version,
          rating: rating > 0 ? rating : undefined,
          weights_used: Object.keys(cleanWeights).length > 0 ? cleanWeights : undefined,
        }
      })

      toast.success('WOD enregistré !')
      router.push('/tracking')
    } catch (error) {
      console.error('Error saving workout:', error)
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Link
            href="/tracking"
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
          >
            &larr;
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">Enregistrer un WOD</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Log un workout réalisé manuellement</p>
          </div>
        </div>

        {/* Workout Selection */}
        <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4 overflow-visible">
          <h2 className="text-lg font-semibold text-white">Quel WOD as-tu fait ?</h2>

          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value)
                setShowDropdown(true)
                if (selectedWorkout && e.target.value !== selectedWorkout.name) {
                  setSelectedWorkout(null)
                }
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Rechercher un workout..."
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/30 transition-all"
            />

            {showDropdown && !selectedWorkout && (
              <div className="absolute z-50 mt-2 w-full max-h-60 overflow-y-auto bg-slate-800 border border-slate-700/50 rounded-xl shadow-2xl">
                {loadingWorkouts ? (
                  <div className="p-4 text-center text-slate-400">Chargement...</div>
                ) : filteredWorkouts.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">Aucun workout trouvé</div>
                ) : (
                  filteredWorkouts.map((w, idx) => (
                    <button
                      key={`${w.id}-${idx}`}
                      className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 last:border-0"
                      onClick={() => handleSelectWorkout(w)}
                    >
                      <div className="font-medium text-white">{w.name}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {w.workout_type && (
                          <span className="text-xs text-orange-400">{w.workout_type.replace(/_/g, ' ')}</span>
                        )}
                        {w.estimated_duration && (
                          <span className="text-xs text-slate-500">{w.estimated_duration} min</span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedWorkout && (
            <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
              <div className="w-1.5 h-8 bg-orange-500 rounded-full" />
              <div className="flex-1">
                <p className="font-semibold text-white">{selectedWorkout.name}</p>
                <div className="flex gap-2 mt-0.5">
                  {selectedWorkout.workout_type && (
                    <span className="text-xs text-orange-400">{selectedWorkout.workout_type.replace(/_/g, ' ')}</span>
                  )}
                  {selectedWorkout.difficulty && (
                    <span className="text-xs text-slate-400">{selectedWorkout.difficulty}</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedWorkout(null)
                  setSearch('')
                  setWeightsUsed({})
                }}
                className="text-slate-400 hover:text-white transition-colors text-lg"
              >
                &times;
              </button>
            </div>
          )}
        </div>

        {/* Exercise Weights */}
        {selectedWorkout && exercises.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-semibold text-white">Poids utilisés</h2>
            <div className="space-y-3">
              {exercises.map((exercise, idx) => (
                <div key={`${exercise.name}-${idx}`} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-400 font-bold text-sm flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{exercise.name}</p>
                    {exercise.reps && (
                      <p className="text-xs text-slate-500">{exercise.reps} reps</p>
                    )}
                  </div>
                  <input
                    type="text"
                    value={weightsUsed[exercise.name] || ''}
                    onChange={(e) => handleWeightChange(exercise.name, e.target.value)}
                    placeholder={exercise.weight || 'ex: 60kg'}
                    className="w-28 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-all text-right"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-5">
          <h2 className="text-lg font-semibold text-white">Résultats</h2>

          {/* Date */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Date et heure du WOD</label>
            <input
              type="datetime-local"
              value={wodDate}
              onChange={(e) => setWodDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-orange-500/50 transition-all [color-scheme:dark]"
            />
          </div>

          {/* Time */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Temps réalisé</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={timeMinutes}
                onChange={(e) => setTimeMinutes(e.target.value)}
                placeholder="00"
                min="0"
                max="999"
                className="w-24 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-center text-xl font-mono focus:outline-none focus:border-orange-500/50 transition-all"
              />
              <span className="text-2xl font-bold text-slate-500">:</span>
              <input
                type="number"
                value={timeSeconds}
                onChange={(e) => setTimeSeconds(e.target.value)}
                placeholder="00"
                min="0"
                max="59"
                className="w-24 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-center text-xl font-mono focus:outline-none focus:border-orange-500/50 transition-all"
              />
              <span className="text-sm text-slate-500 ml-2">min : sec</span>
            </div>
          </div>

          {/* Rounds (if AMRAP) */}
          {isAmrap && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">Rounds complétés</label>
              <input
                type="number"
                value={rounds}
                onChange={(e) => setRounds(e.target.value)}
                placeholder="0"
                min="0"
                className="w-32 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-center text-xl font-mono focus:outline-none focus:border-orange-500/50 transition-all"
              />
            </div>
          )}

          {/* Version RX/SCALED */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Version</label>
            <div className="flex gap-3">
              <button
                onClick={() => setVersion('RX')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                  version === 'RX'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
                }`}
              >
                RX
              </button>
              <button
                onClick={() => setVersion('SCALED')}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-semibold transition-all ${
                  version === 'SCALED'
                    ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                    : 'bg-slate-800/50 text-slate-400 hover:bg-slate-800 border border-slate-700/50'
                }`}
              >
                SCALED
              </button>
            </div>
          </div>

          {/* Rating */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Comment tu t'es senti ?</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star === rating ? 0 : star)}
                  className={`text-3xl transition-all ${
                    star <= rating
                      ? 'text-yellow-500 scale-110'
                      : 'text-slate-600 hover:text-yellow-400 hover:scale-105'
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm text-slate-400 mb-2">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comment s'est passé ton WOD ?"
              rows={3}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 resize-none focus:outline-none focus:border-orange-500/50 transition-all"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-20 sm:pb-8">
          <Link
            href="/tracking"
            className="flex-1 py-3.5 text-center border border-slate-700/50 bg-slate-800/50 text-slate-300 rounded-xl font-medium hover:bg-slate-700/50 transition-colors"
          >
            Annuler
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving || !selectedWorkout}
            className="flex-1 py-3.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer le WOD'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function LogWorkoutPage() {
  return (
    <ProtectedRoute>
      <LogWorkoutContent />
    </ProtectedRoute>
  )
}
