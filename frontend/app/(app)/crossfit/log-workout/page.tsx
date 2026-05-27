'use client'

import { PersonalizedWorkout, Workouts } from '@/domain/entities/workout'
import { Exercise } from '@/domain/entities/workout-structure'
import { StarRating } from '@/components/ui/star-rating'
import { TimeInput } from '@/components/ui/time-input'
import { parseFitFiles, MultiActivityFitData, HrZoneData, getSportLabel } from '@/services/fit-import'
import { sessionService, workoutsService } from '@/services'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

const ZONE_COLORS = ['#64748b', '#22c55e', '#3b82f6', '#f97316', '#ef4444']

function HrZonesChart({ zones, totalSeconds }: { zones: HrZoneData[]; totalSeconds: number }) {
  const total = totalSeconds || zones.reduce((s, z) => s + z.seconds, 0)
  return (
    <div className="space-y-2 pt-1">
      <p className="text-xs text-slate-400 font-medium">Zones de fréquence cardiaque</p>
      {zones.map((z, i) => {
        const pct = total > 0 ? Math.round((z.seconds / total) * 100) : 0
        const mm = Math.floor(z.seconds / 60)
        const ss = String(Math.floor(z.seconds % 60)).padStart(2, '0')
        return (
          <div key={z.zone} className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-20 shrink-0">{z.label}</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: ZONE_COLORS[i] }}
              />
            </div>
            <span className="text-xs text-slate-400 w-16 text-right shrink-0">{mm}:{ss} ({pct}%)</span>
          </div>
        )
      })}
    </div>
  )
}

function getAllExercises(workout: Workouts): Exercise[] {
  const exercises: Exercise[] = []
  const collectExercises = (sections: Workouts['blocks']['sections']) => {
    for (const section of sections) {
      if (section.type === 'warmup' || section.type === 'cooldown') continue
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
  const searchParams = useSearchParams()

  const [workouts, setWorkouts] = useState<Workouts[]>([])
  const [personalizedWorkouts, setPersonalizedWorkouts] = useState<PersonalizedWorkout[]>([])
  const [loadingWorkouts, setLoadingWorkouts] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedWorkout, setSelectedWorkout] = useState<(Workouts & { personalized_id?: string }) | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const [exerciseNotes, setWeightsUsed] = useState<Record<number, string>>({})

  const [timeMinutes, setTimeMinutes] = useState('')
  const [timeSeconds, setTimeSeconds] = useState('')
  const [capAtteint, setCapAtteint] = useState(false)
  const [capScore, setCapScore] = useState('')
  const [rounds, setRounds] = useState('')
  const [bonusReps, setBonusReps] = useState('')
  const [rating, setRating] = useState<number>(0)
  const [notes, setNotes] = useState('')
  const [wodDate, setWodDate] = useState(() => new Date().toISOString().slice(0, 16))

  const [fitData, setFitData] = useState<MultiActivityFitData | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const fitInputRef = useRef<HTMLInputElement>(null)

  const [isSaving, setIsSaving] = useState(false)

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
      } catch {
        toast.error('Erreur lors du chargement des workouts')
      } finally {
        setLoadingWorkouts(false)
      }
    }
    fetchWorkouts()
  }, [])

  useEffect(() => {
    const presetWorkoutId = searchParams.get('workoutId')
    const presetPersonalizedId = searchParams.get('personalizedWorkoutId')
    const presetTime = searchParams.get('time')

    if (presetTime) {
      const parts = presetTime.split(':')
      if (parts.length === 2) {
        setTimeMinutes(parts[0])
        setTimeSeconds(parts[1])
      } else if (parts.length === 3) {
        const totalMin = parseInt(parts[0]) * 60 + parseInt(parts[1])
        setTimeMinutes(String(totalMin))
        setTimeSeconds(parts[2])
      }
    }

    if (presetWorkoutId) {
      workoutsService.getById(presetWorkoutId).then((found) => {
        setSelectedWorkout({ ...found, personalized_id: undefined })
        setSearch(found.name || '')
      }).catch(() => {})
    }

    if (presetPersonalizedId) {
      workoutsService.getPersonalizedWorkout(presetPersonalizedId).then((found) => {
        setSelectedWorkout({ ...found.plan_json, personalized_id: found.id })
        setSearch(found.plan_json.name || '')
      }).catch(() => {})
    }
  }, [searchParams])

  const allWorkoutsList = useMemo(() => {
    const regular = workouts.map(w => ({ ...w, personalized_id: undefined as string | undefined }))
    const fromPersonalized = personalizedWorkouts.map(pw => ({
      ...pw.plan_json,
      personalized_id: pw.id,
      created_at: pw.created_at
    }))
    return [...regular, ...fromPersonalized].sort((a, b) => b.created_at.localeCompare(a.created_at))
  }, [workouts, personalizedWorkouts])

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
    setCapAtteint(false)
    setCapScore('')
  }, [])

  const handleFitFiles = async (files: FileList) => {
    const fileArray = Array.from(files)
    try {
      setIsParsing(true)
      const data = await parseFitFiles(fileArray)
      setFitData(data)
      if (data.totals.duration_seconds) {
        const totalMin = Math.floor(data.totals.duration_seconds / 60)
        const totalSec = Math.floor(data.totals.duration_seconds % 60)
        setTimeMinutes(String(totalMin))
        setTimeSeconds(String(totalSec).padStart(2, '0'))
      }
      const runCount = data.activities.filter(a => a.sport?.toLowerCase().includes('run')).length
      const label = fileArray.length > 1
        ? `${fileArray.length} activités importées (${runCount} course${runCount > 1 ? 's' : ''})`
        : 'Activité .fit importée'
      toast.success(label)
    } catch {
      toast.error('Impossible de lire le(s) fichier(s) .fit')
    } finally {
      setIsParsing(false)
    }
  }

  const handleExerciseNoteChange = useCallback((idx: number, value: string) => {
    setWeightsUsed(prev => ({ ...prev, [idx]: value }))
  }, [])

  const handleSave = async () => {
    const totalSeconds = (parseInt(timeMinutes || '0') * 60) + parseInt(timeSeconds || '0')
    if (!isAmrap && !capAtteint && totalSeconds === 0) {
      toast.error('Saisis un temps ou coche "Cap atteint"')
      return
    }
    if (isAmrap && !rounds && !bonusReps) {
      toast.error('Saisis un score AMRAP')
      return
    }

    try {
      setIsSaving(true)

      const completedAt = new Date(wodDate)
      const startedAt = new Date(completedAt.getTime() - totalSeconds * 1000)

      const sessionData: { workout_id?: string; personalized_workout_id?: string; started_at: string } = {
        started_at: startedAt.toISOString()
      }
      if (selectedWorkout?.personalized_id) {
        sessionData.personalized_workout_id = selectedWorkout.personalized_id
      } else {
        sessionData.workout_id = selectedWorkout?.id
      }
      const session = await sessionService.startSession(sessionData)

      const cleanNotes: Record<string, string> = {}
      for (const [idxStr, note] of Object.entries(exerciseNotes)) {
        if (note.trim()) {
          const exercise = exercises[parseInt(idxStr)]
          const label = exercises.filter((e, i) => e.name === exercise.name && i < parseInt(idxStr)).length > 0
            ? `${exercise.name} (${parseInt(idxStr) + 1})`
            : exercise.name
          cleanNotes[label] = note.trim()
        }
      }

      const resultPayload: Record<string, unknown> = {
        rounds: rounds ? parseInt(rounds) : undefined,
        reps: bonusReps ? parseInt(bonusReps) : undefined,
        rating: rating > 0 ? rating : undefined,
        exercise_details: Object.keys(cleanNotes).length > 0 ? cleanNotes : undefined,
        ...(fitData && {
          coros: {
            activities: fitData.activities,
            totals: fitData.totals,
          },
        }),
      }
      if (!isAmrap) {
        if (capAtteint) {
          resultPayload.cap_reached = true
          if (capScore) resultPayload.reps_at_cap = parseInt(capScore, 10)
        } else if (totalSeconds > 0) {
          resultPayload.elapsed_time_seconds = totalSeconds
        }
      }

      await sessionService.updateSession(session.id, {
        completed_at: completedAt.toISOString(),
        notes: notes || undefined,
        results: resultPayload,
      })

      toast.success('WOD enregistré !')
      router.push('/crossfit')
    } catch {
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
            href="/crossfit"
            className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-slate-800 transition-colors text-slate-400 hover:text-white"
          >
            &larr;
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">Enregistrer un WOD</span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">Log un workout CrossFit réalisé</p>
          </div>
        </div>

        {/* Workout Selection */}
        <div className="relative z-10 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4 overflow-visible">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Quel WOD as-tu fait ?</h2>
            <Link href="/crossfit/workouts">
              <button className="p-3.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-semibold shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all">
                Ajouter un wod
              </button>
            </Link>
          </div>

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
                ) : allWorkoutsList.length === 0 ? (
                  <div className="p-4 text-center text-slate-400">Aucun workout trouvé</div>
                ) : (
                  allWorkoutsList.map((w, idx) => (
                    <button
                      key={`${w.personalized_id || w.id}-${idx}`}
                      className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/30 last:border-0"
                      onClick={() => handleSelectWorkout(w)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{w.name}</span>
                        {w.personalized_id && (
                          <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-semibold rounded">Perso</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {w.workout_type && <span className="text-xs text-orange-400">{w.workout_type.replace(/_/g, ' ')}</span>}
                        {w.estimated_duration && <span className="text-xs text-slate-500">{w.estimated_duration} min</span>}
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
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white">{selectedWorkout.name}</p>
                  {selectedWorkout.personalized_id && (
                    <span className="px-1.5 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-semibold rounded">Perso</span>
                  )}
                </div>
                <div className="flex gap-2 mt-0.5">
                  {selectedWorkout.workout_type && <span className="text-xs text-orange-400">{selectedWorkout.workout_type.replace(/_/g, ' ')}</span>}
                  {selectedWorkout.difficulty && <span className="text-xs text-slate-400">{selectedWorkout.difficulty}</span>}
                </div>
              </div>
              <button
                onClick={() => { setSelectedWorkout(null); setSearch(''); setWeightsUsed({}) }}
                className="text-slate-400 hover:text-white transition-colors text-lg"
              >
                &times;
              </button>
            </div>
          )}
        </div>

        {/* Exercise Details */}
        {selectedWorkout && exercises.length > 0 && (
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-white">Détails des exercices</h2>
              <p className="text-xs text-slate-500 mt-0.5">Poids, distance, scaling, variante...</p>
            </div>
            <div className="space-y-3">
              {exercises.map((exercise, idx) => {
                const hints: string[] = []
                if (exercise.weight) hints.push(exercise.weight)
                if (exercise.distance) hints.push(exercise.distance)
                if (exercise.details) {
                  const scaledMatch = exercise.details.match(/Scaled:\s*([^|]+)/i)
                  if (scaledMatch) hints.push(`Scaled: ${scaledMatch[1].trim()}`)
                }
                const placeholder = hints.length > 0 ? hints.join(' / ') : 'ex: 60kg, Scaled, 500m...'
                return (
                  <div key={`${exercise.name}-${idx}`} className="flex items-start gap-3">
                    <div className="w-8 h-8 bg-orange-500/20 rounded-lg flex items-center justify-center text-orange-400 font-bold text-sm flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{exercise.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {exercise.reps && <span className="text-xs text-slate-500">{exercise.reps} reps</span>}
                        {exercise.duration && <span className="text-xs text-slate-500">{exercise.duration}</span>}
                      </div>
                      <input
                        type="text"
                        value={exerciseNotes[idx] || ''}
                        onChange={(e) => handleExerciseNoteChange(idx, e.target.value)}
                        placeholder={placeholder}
                        className="w-full mt-1.5 px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500/50 transition-all"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Import Coros .fit */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Données Coros</h2>
              <p className="text-xs text-slate-500 mt-0.5">Optionnel — importe ton .fit pour enrichir le log</p>
            </div>
            {fitData && (
              <button
                onClick={() => {
                  setFitData(null)
                  setTimeMinutes('')
                  setTimeSeconds('')
                  if (fitInputRef.current) fitInputRef.current.value = ''
                }}
                className="text-slate-400 hover:text-white transition-colors text-xl leading-none"
              >
                &times;
              </button>
            )}
          </div>

          {!fitData ? (
            <button
              onClick={() => fitInputRef.current?.click()}
              disabled={isParsing}
              className="w-full flex items-center justify-center gap-3 py-4 border border-dashed border-slate-600 hover:border-orange-500/50 hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white disabled:opacity-50"
            >
              <input
                ref={fitInputRef}
                type="file"
                accept=".fit"
                multiple
                className="hidden"
                onChange={(e) => { if (e.target.files?.length) handleFitFiles(e.target.files) }}
              />
              {isParsing ? (
                <>
                  <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Analyse en cours...</span>
                </>
              ) : (
                <div className="text-left">
                  <p className="text-sm font-medium">Importer des fichiers .fit</p>
                  <p className="text-xs text-slate-500">1 fichier ou plusieurs (ex: Murph = course + muscu + course)</p>
                </div>
              )}
            </button>
          ) : (
            <div className="space-y-3">
              {/* Activités séparées */}
              {fitData.activities.map((activity, idx) => {
                const isRun = activity.sport?.toLowerCase().includes('run')
                const label = getSportLabel(activity.sport, idx, fitData.activities.length)
                const dur = activity.duration_seconds
                  ? `${Math.floor(activity.duration_seconds / 60)}:${String(Math.floor(activity.duration_seconds % 60)).padStart(2, '0')}`
                  : null
                return (
                  <div key={idx} className={`rounded-xl p-3 border ${isRun ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-sm font-semibold ${isRun ? 'text-green-300' : 'text-slate-200'}`}>{label}</span>
                      {dur && <span className="ml-auto text-xs text-slate-400">{dur}</span>}
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {isRun && activity.avg_pace_min_km && (
                        <div className="bg-white/5 rounded-lg p-2 text-center col-span-1">
                          <p className="text-sm font-bold text-green-400">
                            {Math.floor(activity.avg_pace_min_km)}:{String(Math.round((activity.avg_pace_min_km % 1) * 60)).padStart(2, '0')}
                          </p>
                          <p className="text-slate-500 text-xs">min/km</p>
                        </div>
                      )}
                      {isRun && activity.distance_meters && activity.distance_meters > 0 && (
                        <div className="bg-white/5 rounded-lg p-2 text-center">
                          <p className="text-sm font-bold text-blue-400">{(activity.distance_meters / 1000).toFixed(2)} km</p>
                          <p className="text-slate-500 text-xs">Distance</p>
                        </div>
                      )}
                      {activity.avg_heart_rate && (
                        <div className="bg-white/5 rounded-lg p-2 text-center">
                          <p className="text-sm font-bold text-rose-400">{activity.avg_heart_rate} bpm</p>
                          <p className="text-slate-500 text-xs">FC moy.</p>
                        </div>
                      )}
                      {activity.max_heart_rate && (
                        <div className="bg-white/5 rounded-lg p-2 text-center">
                          <p className="text-sm font-bold text-rose-300">{activity.max_heart_rate} bpm</p>
                          <p className="text-slate-500 text-xs">FC max</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}

              {/* Totaux */}
              <div className="pt-1 border-t border-white/10">
                <p className="text-xs text-slate-500 mb-2">Totaux</p>
                <div className="grid grid-cols-3 gap-2">
                  {fitData.totals.calories && (
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-orange-400">{fitData.totals.calories}</p>
                      <p className="text-slate-500 text-xs mt-0.5">Calories</p>
                    </div>
                  )}
                  {fitData.totals.distance_meters && fitData.totals.distance_meters > 0 && (
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-blue-400">{(fitData.totals.distance_meters / 1000).toFixed(2)} km</p>
                      <p className="text-slate-500 text-xs mt-0.5">Distance</p>
                    </div>
                  )}
                  {fitData.totals.duration_seconds > 0 && (
                    <div className="bg-white/5 rounded-xl p-3 text-center">
                      <p className="text-lg font-bold text-slate-300">
                        {Math.floor(fitData.totals.duration_seconds / 60)}:{String(Math.floor(fitData.totals.duration_seconds % 60)).padStart(2, '0')}
                      </p>
                      <p className="text-slate-500 text-xs mt-0.5">Durée totale</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Zones HR cumulées */}
              {fitData.totals.hr_zones && fitData.totals.hr_zones.length > 0 && (
                <HrZonesChart zones={fitData.totals.hr_zones} totalSeconds={fitData.totals.duration_seconds} />
              )}
            </div>
          )}
        </div>

        {/* Results */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-5">
          <h2 className="text-lg font-semibold text-white">Résultats</h2>

          <div>
            <label className="block text-sm text-slate-400 mb-2">Date et heure du WOD</label>
            <input
              type="datetime-local"
              value={wodDate}
              onChange={(e) => setWodDate(e.target.value)}
              className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white focus:outline-none focus:border-orange-500/50 transition-all [color-scheme:dark]"
            />
          </div>

          {!isAmrap && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm text-slate-400">Temps réalisé</label>
                <button
                  onClick={() => setCapAtteint(!capAtteint)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${
                    capAtteint
                      ? 'bg-red-500/20 border-red-500/50 text-red-400'
                      : 'bg-slate-800 border-white/10 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Cap atteint
                </button>
              </div>
              {!capAtteint ? (
                <TimeInput
                  minutes={timeMinutes}
                  seconds={timeSeconds}
                  onMinutesChange={setTimeMinutes}
                  onSecondsChange={setTimeSeconds}
                />
              ) : (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  <input
                    type="number"
                    min="0"
                    value={capScore}
                    onChange={(e) => setCapScore(e.target.value)}
                    placeholder="0"
                    className="w-24 bg-transparent text-white text-center text-xl font-mono outline-none"
                  />
                  <span className="text-red-400 text-sm">reps au cap (score officiel)</span>
                </div>
              )}
            </div>
          )}

          {isAmrap && (
            <div>
              <label className="block text-sm text-slate-400 mb-2">Score AMRAP</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={rounds}
                  onChange={(e) => setRounds(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-28 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-center text-xl font-mono focus:outline-none focus:border-orange-500/50 transition-all"
                />
                <span className="text-slate-400 font-semibold">rounds +</span>
                <input
                  type="number"
                  value={bonusReps}
                  onChange={(e) => setBonusReps(e.target.value)}
                  placeholder="0"
                  min="0"
                  className="w-28 px-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white text-center text-xl font-mono focus:outline-none focus:border-orange-500/50 transition-all"
                />
                <span className="text-slate-400">reps</span>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm text-slate-400 mb-2">Comment tu t&apos;es senti ?</label>
            <StarRating rating={rating} onChange={setRating} />
          </div>

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
            href="/crossfit"
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

export default function CrossfitLogWorkoutPage() {
  return <LogWorkoutContent />
}
