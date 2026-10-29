'use client'

import { RpeSelector } from '@/components/ui/rpe-selector'
import { StarRating } from '@/components/ui/star-rating'
import { TimeInput } from '@/components/ui/time-input'
import { ExerciseResult, PersonalizedWorkout, Workouts } from '@/domain/entities/workout'
import { Exercise, SectionType, WorkoutSection } from '@/domain/entities/workout-structure'
import { scheduleApi, sessionService, workoutsService } from '@/services'
import { FitDataSummary } from '@/components/fit-import/FitDataSummary'
import {
  FitFileTooLargeError,
  MultiActivityFitData,
  parseFitFiles,
} from '@/services/fit-import'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'sonner'

const CONDITIONING_SECTION_TYPES: SectionType[] = [
  'metcon', 'amrap', 'emom', 'for_time', 'circuit', 'intervals', 'tabata', 'finisher'
]

const SECTION_TYPE_LABELS: Partial<Record<SectionType, string>> = {
  strength: 'Force',
  accessory: 'Accessoire',
  skill_work: 'Technique',
  core: 'Core',
  mobility: 'Mobilité',
  cardio: 'Cardio',
  intervals: 'Cardio',
  metcon: 'WOD',
  amrap: 'WOD',
  emom: 'WOD',
  for_time: 'WOD',
  circuit: 'WOD',
  tabata: 'WOD',
  finisher: 'Finisher',
}

/**
 * Extrait une charge en kg depuis le poids prescrit d'un exercice ("42.5kg", "95/65 lb", "60% 1RM").
 * Retourne null quand la prescription est relative ou non numérique : on pré-remplit ce qu'on sait
 * lire, on ne devine jamais une charge à la place de l'athlète.
 */
function parsePrescribedLoadKg(weight?: string): number | null {
  if (!weight || weight.includes('%')) return null
  const match = weight.match(/(\d+(?:[.,]\d+)?)/)
  if (!match) return null
  const value = parseFloat(match[1].replace(',', '.'))
  if (!Number.isFinite(value) || value <= 0) return null
  if (/lbs?|#/i.test(weight)) return Math.round(value * 0.4536 * 10) / 10
  return value
}

/** Nombre de reps prescrites, quand il est exploitable tel quel (un `21-15-9` reste à saisir à la main). */
function parsePrescribedReps(reps?: number | string): number | null {
  if (typeof reps === 'number') return Number.isInteger(reps) && reps > 0 ? reps : null
  if (!reps) return null
  const trimmed = reps.trim()
  const match = trimmed.match(/^(\d+)(?:\s*reps?)?$/i)
  if (!match) return null
  const value = parseInt(match[1], 10)
  return value > 0 ? value : null
}

interface ExerciseEntry {
  load: string
  reps: string
  scaled: boolean
  scalingNote: string
}

const EMPTY_ENTRY: ExerciseEntry = { load: '', reps: '', scaled: false, scalingNote: '' }

interface ExerciseGroup {
  section: WorkoutSection
  exercises: Exercise[]
}

type AmrapScoreMode = 'rounds' | 'split'

function getExerciseGroups(workout: Workouts): ExerciseGroup[] {
  const groups: ExerciseGroup[] = []
  const walk = (sections: WorkoutSection[]) => {
    for (const section of sections) {
      if (section.type === 'warmup' || section.type === 'cooldown') continue
      if (section.exercises?.length) {
        groups.push({ section, exercises: section.exercises })
      }
      if (section.sections) {
        walk(section.sections)
      }
    }
  }
  if (workout.blocks?.sections) {
    walk(workout.blocks.sections)
  }
  return groups
}

function isMaxRepExercise(exercise: Exercise): boolean {
  return /\bmax(?:imum)?\b/i.test(`${exercise.reps ?? ''} ${exercise.details ?? ''}`)
}

function getAmrapScoringExercises(workout: Workouts): Exercise[] {
  const groups = getExerciseGroups(workout)
  const amrapGroups = groups.filter(({ section }) =>
    section.type === 'amrap' || section.format?.toLowerCase().includes('amrap')
  )
  const conditioningGroups = groups.filter(({ section }) => CONDITIONING_SECTION_TYPES.includes(section.type))
  const scoreGroups = amrapGroups.length > 0
    ? amrapGroups
    : conditioningGroups.length > 0
      ? conditioningGroups
      : groups

  return scoreGroups.flatMap(group => group.exercises)
}

function getInitialAmrapScoreMode(workout: Workouts): AmrapScoreMode {
  const scoreExercises = getAmrapScoringExercises(workout)
  const openingReps = parsePrescribedReps(scoreExercises[0]?.reps)
  const hasMaxRepFollowUp = scoreExercises.slice(1).some(isMaxRepExercise)

  return openingReps !== null && hasMaxRepFollowUp ? 'split' : 'rounds'
}

function getAmrapDurationSeconds(workout: Workouts): number {
  const findDuration = (sections: WorkoutSection[]): number | undefined => {
    for (const section of sections) {
      const isAmrapSection = section.type === 'amrap' || section.format?.toLowerCase().includes('amrap')
      if (isAmrapSection && section.duration_min) return section.duration_min * 60
      if (section.sections) {
        const nestedDuration = findDuration(section.sections)
        if (nestedDuration) return nestedDuration
      }
    }
    return undefined
  }

  return findDuration(workout.blocks.sections) ?? 0
}

/**
 * Time cap du metcon, en secondes : celui écrit dans le format (« For Time (cap 12min) »),
 * sinon la durée de la section, qui porte le cap pour un For Time.
 * Renvoie 0 quand le workout n'en indique aucun.
 */
function getTimeCapSeconds(workout: Workouts): number {
  const findCap = (sections: WorkoutSection[]): number | undefined => {
    for (const section of sections) {
      if (CONDITIONING_SECTION_TYPES.includes(section.type)) {
        const capInFormat = section.format?.match(/cap\s*(\d+)\s*min/i)
        if (capInFormat) return parseInt(capInFormat[1], 10) * 60
        if (section.duration_min) return section.duration_min * 60
      }
      if (section.sections) {
        const nestedCap = findCap(section.sections)
        if (nestedCap) return nestedCap
      }
    }
    return undefined
  }

  return findCap(workout.blocks.sections) ?? 0
}

function hasConditioningSection(sections: WorkoutSection[]): boolean {
  for (const section of sections) {
    if (section.type === 'warmup' || section.type === 'cooldown') continue
    if (CONDITIONING_SECTION_TYPES.includes(section.type)) return true
    if (section.sections && hasConditioningSection(section.sections)) return true
  }
  return false
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
  const [exerciseEntries, setExerciseEntries] = useState<Record<number, ExerciseEntry>>({})

  const [timeMinutes, setTimeMinutes] = useState('')
  const [timeSeconds, setTimeSeconds] = useState('')
  const [capAtteint, setCapAtteint] = useState(false)
  const [capRounds, setCapRounds] = useState('')
  const [capNote, setCapNote] = useState('')
  const [rounds, setRounds] = useState('')
  const [bonusReps, setBonusReps] = useState('')
  const [amrapScoreMode, setAmrapScoreMode] = useState<AmrapScoreMode>('rounds')
  const [splitTimeMinutes, setSplitTimeMinutes] = useState('')
  const [splitTimeSeconds, setSplitTimeSeconds] = useState('')
  const [repsAfterSplit, setRepsAfterSplit] = useState('')
  const [rating, setRating] = useState<number>(0)
  const [rpe, setRpe] = useState<number>(0)
  // null tant que l'athlète n'a pas touché au champ : la durée affichée est alors déduite du contexte
  const [sessionMinutesInput, setSessionMinutesInput] = useState<string | null>(null)
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
        const workout = { ...found, personalized_id: undefined }
        setSelectedWorkout(workout)
        setAmrapScoreMode(getInitialAmrapScoreMode(workout))
        setSearch(found.name || '')
      }).catch(() => { })
    }

    if (presetPersonalizedId) {
      workoutsService.getPersonalizedWorkout(presetPersonalizedId).then((found) => {
        const workout = { ...found.plan_json, personalized_id: found.id }
        setSelectedWorkout(workout)
        setAmrapScoreMode(getInitialAmrapScoreMode(workout))
        setSearch(found.plan_json.name || '')
      }).catch(() => { })
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

  const exerciseGroups = useMemo(() => {
    if (!selectedWorkout) return []
    let cursor = 0
    return getExerciseGroups(selectedWorkout).map(group => {
      const startIndex = cursor
      cursor += group.exercises.length
      return { ...group, startIndex }
    })
  }, [selectedWorkout])

  const exercises = useMemo(
    () => exerciseGroups.flatMap(g => g.exercises),
    [exerciseGroups]
  )

  const splitScoreLabels = useMemo(() => {
    const scoreExercises = selectedWorkout ? getAmrapScoringExercises(selectedWorkout) : []
    const openingExercise = scoreExercises[0]
    const maxRepExercise = scoreExercises.slice(1).find(isMaxRepExercise) ?? scoreExercises[1]
    const openingReps = openingExercise ? parsePrescribedReps(openingExercise.reps) : null

    return {
      opening: openingExercise
        ? `${openingReps !== null ? `${openingReps} ` : ''}${openingExercise.name}`
        : 'première partie',
      following: maxRepExercise?.name ?? 'mouvement suivant',
    }
  }, [selectedWorkout])

  // Pré-remplit ce que la prescription donne déjà (charge absolue, reps fixes) pour que
  // l'athlète n'ait à corriger que ce qui a réellement différé du plan.
  useEffect(() => {
    setExerciseEntries(() => {
      const initial: Record<number, ExerciseEntry> = {}
      exercises.forEach((exercise, idx) => {
        const load = parsePrescribedLoadKg(exercise.weight)
        const reps = parsePrescribedReps(exercise.reps)
        initial[idx] = {
          ...EMPTY_ENTRY,
          load: load !== null ? String(load) : '',
          reps: reps !== null ? String(reps) : '',
        }
      })
      return initial
    })
  }, [exercises])

  const hasConditioning = useMemo(() => {
    if (!selectedWorkout?.blocks?.sections) return false
    return hasConditioningSection(selectedWorkout.blocks.sections)
  }, [selectedWorkout])

  const isAmrap = useMemo(() => {
    if (!selectedWorkout) return false
    return selectedWorkout.workout_type?.toLowerCase().includes('amrap') ||
      selectedWorkout.blocks?.sections?.some(s =>
        s.type === 'amrap' || s.format?.toLowerCase().includes('amrap')
      )
  }, [selectedWorkout])

  // Durée de toute la séance, pas du metcon : enregistrement .fit, sinon durée prévue du workout, sinon une séance type
  const defaultSessionMinutes = fitData?.totals.duration_seconds
    ? Math.round(fitData.totals.duration_seconds / 60)
    : selectedWorkout?.estimated_duration || 60
  const sessionMinutesValue = sessionMinutesInput ?? String(defaultSessionMinutes)

  const handleSelectWorkout = useCallback((workout: Workouts) => {
    setSelectedWorkout(workout)
    setSearch(workout.name || '')
    setShowDropdown(false)
    setExerciseEntries({})
    setAmrapScoreMode(getInitialAmrapScoreMode(workout))
    setRounds('')
    setBonusReps('')
    setSplitTimeMinutes('')
    setSplitTimeSeconds('')
    setRepsAfterSplit('')
    setCapAtteint(false)
    setCapRounds('')
    setCapNote('')
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
    } catch (error) {
      toast.error(error instanceof FitFileTooLargeError ? error.message : 'Impossible de lire le(s) fichier(s) .fit')
    } finally {
      setIsParsing(false)
    }
  }

  const handleEntryChange = useCallback((idx: number, patch: Partial<ExerciseEntry>) => {
    setExerciseEntries(prev => ({ ...prev, [idx]: { ...EMPTY_ENTRY, ...prev[idx], ...patch } }))
  }, [])

  const handleSave = async () => {
    const totalSeconds = (parseInt(timeMinutes || '0') * 60) + parseInt(timeSeconds || '0')
    // Sans chrono final (AMRAP, cap atteint), l'effort a duré le temps prévu par le workout :
    // c'est cet écart début/fin que le diagnostic lit pour classer la séance par filière.
    let sessionDurationSeconds = totalSeconds
    if (hasConditioning && selectedWorkout && isAmrap) {
      sessionDurationSeconds = getAmrapDurationSeconds(selectedWorkout) || totalSeconds
    } else if (hasConditioning && selectedWorkout && capAtteint) {
      sessionDurationSeconds = getTimeCapSeconds(selectedWorkout) || totalSeconds
    }
    const splitMinutesValue = Number(splitTimeMinutes || 0)
    const splitSecondsValue = Number(splitTimeSeconds || 0)
    const splitTimeSecondsValue = splitMinutesValue * 60 + splitSecondsValue
    const hasSplitTimeInput = splitTimeMinutes !== '' || splitTimeSeconds !== ''
    const hasValidSplitTime = hasSplitTimeInput &&
      Number.isInteger(splitMinutesValue) && splitMinutesValue >= 0 &&
      Number.isInteger(splitSecondsValue) && splitSecondsValue >= 0 && splitSecondsValue < 60 &&
      splitTimeSecondsValue > 0 && splitTimeSecondsValue <= 86400
    const splitRepsValue = Number(repsAfterSplit)
    const hasValidSplitReps = repsAfterSplit !== '' &&
      Number.isInteger(splitRepsValue) && splitRepsValue >= 0 && splitRepsValue <= 10000

    if (hasConditioning && !isAmrap && !capAtteint && totalSeconds === 0) {
      toast.error('Saisis un temps ou coche "Cap atteint"')
      return
    }
    const sessionMinutes = Number(sessionMinutesValue)
    if (!Number.isInteger(sessionMinutes) || sessionMinutes < 1 || sessionMinutes > 300) {
      toast.error('Saisis la durée totale de la séance, entre 1 et 300 min')
      return
    }
    if (hasConditioning && isAmrap) {
      if (amrapScoreMode === 'split' && (!hasValidSplitTime || !hasValidSplitReps)) {
        toast.error('Saisis le temps du split et les reps après le split')
        return
      }
      if (amrapScoreMode === 'rounds' && !rounds && !bonusReps) {
        toast.error('Saisis un score AMRAP')
        return
      }
    }

    try {
      setIsSaving(true)

      const completedAt = new Date(wodDate)
      const startedAt = new Date(completedAt.getTime() - sessionDurationSeconds * 1000)

      const sessionData: { workout_id?: string; personalized_workout_id?: string; started_at: string } = {
        started_at: startedAt.toISOString()
      }
      if (selectedWorkout?.personalized_id) {
        sessionData.personalized_workout_id = selectedWorkout.personalized_id
      } else {
        sessionData.workout_id = selectedWorkout?.id
      }
      const session = await sessionService.startSession(sessionData)

      const exerciseResults: ExerciseResult[] = exerciseGroups.flatMap(group =>
        group.exercises.flatMap((exercise, i) => {
          const idx = group.startIndex + i
          const entry = exerciseEntries[idx]
          if (!entry) return []

          const load = parseFloat(entry.load.replace(',', '.'))
          const reps = parseInt(entry.reps, 10)
          const result: ExerciseResult = {
            name: exercise.name,
            section_type: group.section.type,
            scaled: entry.scaled,
          }
          if (Number.isFinite(load) && load > 0) result.load_kg = load
          if (Number.isInteger(reps) && reps > 0) result.reps_completed = reps
          if (entry.scaled && entry.scalingNote.trim()) result.scaling_note = entry.scalingNote.trim()

          // Une entrée sans charge, sans reps et non scalée n'apporte rien à l'analyse
          const isEmpty = result.load_kg === undefined && result.reps_completed === undefined && !result.scaled
          return isEmpty ? [] : [result]
        })
      )

      const resultPayload: Record<string, unknown> = {
        rating: rating > 0 ? rating : undefined,
        rpe: rpe > 0 ? rpe : undefined,
        session_duration_minutes: sessionMinutes,
        exercise_results: exerciseResults.length > 0 ? exerciseResults : undefined,
        ...(fitData && {
          coros: {
            activities: fitData.activities,
            totals: fitData.totals,
          },
        }),
      }
      if (hasConditioning && isAmrap && amrapScoreMode === 'split') {
        resultPayload.split_time_seconds = splitTimeSecondsValue
        resultPayload.reps_after_split = splitRepsValue
      } else if (hasConditioning && isAmrap) {
        resultPayload.rounds = rounds ? parseInt(rounds, 10) : undefined
        resultPayload.reps = bonusReps ? parseInt(bonusReps, 10) : undefined
      }
      if (!isAmrap) {
        if (capAtteint) {
          resultPayload.cap_reached = true
          if (capRounds) resultPayload.rounds_completed = parseInt(capRounds, 10)
          if (capNote) resultPayload.partial_note = capNote
        } else if (totalSeconds > 0) {
          resultPayload.elapsed_time_seconds = totalSeconds
        }
      }

      await sessionService.updateSession(session.id, {
        completed_at: completedAt.toISOString(),
        notes: notes || undefined,
        results: resultPayload,
      })

      const scheduleId = searchParams.get('scheduleId')
      if (scheduleId) {
        await scheduleApi.markAsCompleted(scheduleId, session.id)
      }

      toast.success('Séance enregistrée !')
      router.push('/crossfit')
    } catch {
      toast.error('Erreur lors de l\'enregistrement')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-3xl space-y-6">
        {/* Workout Selection */}
        <div className="relative z-10 bg-card border border-border rounded-lg p-5 space-y-4 overflow-visible">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-foreground">Quelle séance as-tu faite ?</h2>
            <Link href="/crossfit/workouts">
              <button className="px-3.5 py-2.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all">
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
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all"
            />
            {showDropdown && !selectedWorkout && (
              <div className="absolute z-50 mt-2 w-full max-h-60 overflow-y-auto bg-card border border-border rounded-lg shadow-lg">
                {loadingWorkouts ? (
                  <div className="p-4 text-center text-muted-foreground">Chargement...</div>
                ) : allWorkoutsList.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">Aucun workout trouvé</div>
                ) : (
                  allWorkoutsList.map((w, idx) => (
                    <button
                      key={`${w.personalized_id || w.id}-${idx}`}
                      className="w-full text-left px-4 py-3 hover:bg-secondary/60 transition-colors border-b border-border last:border-0"
                      onClick={() => handleSelectWorkout(w)}
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-foreground">{w.name}</span>
                        {w.personalized_id && (
                          <span className="px-1.5 py-0.5 bg-secondary text-foreground text-[10px] font-semibold rounded border border-border">Perso</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {w.workout_type && <span className="text-xs text-primary">{w.workout_type.replace(/_/g, ' ')}</span>}
                        {w.estimated_duration && <span className="text-xs text-muted-foreground">{w.estimated_duration} min</span>}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {selectedWorkout && (
            <div className="flex items-center gap-3 p-3 bg-primary/10 border border-primary/20 rounded-lg">
              <div className="w-1.5 h-8 bg-primary rounded-full" />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-foreground">{selectedWorkout.name}</p>
                  {selectedWorkout.personalized_id && (
                    <span className="px-1.5 py-0.5 bg-secondary text-foreground text-[10px] font-semibold rounded border border-border">Perso</span>
                  )}
                </div>
                <div className="flex gap-2 mt-0.5">
                  {selectedWorkout.workout_type && <span className="text-xs text-primary">{selectedWorkout.workout_type.replace(/_/g, ' ')}</span>}
                  {selectedWorkout.difficulty && <span className="text-xs text-muted-foreground">{selectedWorkout.difficulty}</span>}
                </div>
              </div>
              <button
                onClick={() => { setSelectedWorkout(null); setSearch(''); setExerciseEntries({}) }}
                className="text-muted-foreground hover:text-foreground transition-colors text-lg"
              >
                &times;
              </button>
            </div>
          )}
        </div>

        {/* Exercise Details */}
        {selectedWorkout && exercises.length > 0 && (
          <div className="bg-card border border-border rounded-lg p-5 space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Détails des exercices</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Charge et reps réellement réalisées — pré-remplies depuis la prescription, corrige ce qui a changé.
              </p>
            </div>
            <div className="space-y-5">
              {exerciseGroups.map((group, groupIdx) => (
                <div key={`${group.section.title}-${groupIdx}`} className="space-y-3">
                  <p className="text-xs font-semibold text-primary uppercase tracking-wide">
                    {SECTION_TYPE_LABELS[group.section.type]
                      ? `${SECTION_TYPE_LABELS[group.section.type]} — ${group.section.title}`
                      : group.section.title}
                  </p>
                  <div className="space-y-3">
                    {group.exercises.map((exercise, i) => {
                      const idx = group.startIndex + i
                      const entry = exerciseEntries[idx] ?? EMPTY_ENTRY
                      const prescribed: string[] = []
                      if (exercise.reps) prescribed.push(`${exercise.reps} reps`)
                      if (exercise.sets) prescribed.push(`${exercise.sets} séries`)
                      if (exercise.weight) prescribed.push(exercise.weight)
                      if (exercise.distance) prescribed.push(exercise.distance)
                      if (exercise.duration) prescribed.push(exercise.duration)
                      return (
                        <div key={`${exercise.name}-${idx}`} className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 mt-0.5">
                            {idx + 1}
                          </div>
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <p className="text-sm font-medium text-foreground truncate">{exercise.name}</p>
                            {prescribed.length > 0 && (
                              <p className="text-xs text-muted-foreground">Prescrit : {prescribed.join(' · ')}</p>
                            )}
                            <div className="flex flex-wrap items-center gap-1.5">
                              <div className="relative">
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.5"
                                  min="0"
                                  value={entry.load}
                                  onChange={(e) => handleEntryChange(idx, { load: e.target.value })}
                                  placeholder="—"
                                  aria-label={`Charge utilisée sur ${exercise.name} en kg`}
                                  className="w-24 pl-3 pr-8 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">kg</span>
                              </div>
                              <div className="relative">
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  min="0"
                                  value={entry.reps}
                                  onChange={(e) => handleEntryChange(idx, { reps: e.target.value })}
                                  placeholder="—"
                                  aria-label={`Reps réalisées sur ${exercise.name}`}
                                  className="w-24 pl-3 pr-10 py-2 bg-background border border-border rounded-lg text-foreground text-sm text-right font-mono placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 transition-all"
                                />
                                <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">reps</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleEntryChange(idx, { scaled: !entry.scaled, scalingNote: entry.scaled ? '' : entry.scalingNote })}
                                aria-pressed={entry.scaled}
                                className={`px-3 py-2 rounded-lg border text-xs font-semibold transition-colors ${entry.scaled
                                    ? 'bg-orange-500/10 border-orange-500/40 text-orange-600'
                                    : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
                                  }`}
                              >
                                {entry.scaled ? 'Scaled' : 'RX'}
                              </button>
                            </div>
                            {entry.scaled && (
                              <input
                                type="text"
                                value={entry.scalingNote}
                                onChange={(e) => handleEntryChange(idx, { scalingNote: e.target.value })}
                                placeholder="Comment tu as scalé ? ex: bande verte, box HSPU, genoux..."
                                aria-label={`Détail du scaling sur ${exercise.name}`}
                                className="w-full px-3 py-2 bg-background border border-orange-500/30 rounded-lg text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:border-orange-500/60 transition-all"
                              />
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Import Coros .fit */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Données Coros</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Optionnel — importe ton .fit pour enrichir le log</p>
            </div>
            {fitData && (
              <button
                onClick={() => {
                  setFitData(null)
                  setTimeMinutes('')
                  setTimeSeconds('')
                  if (fitInputRef.current) fitInputRef.current.value = ''
                }}
                className="text-muted-foreground hover:text-foreground transition-colors text-xl leading-none"
              >
                &times;
              </button>
            )}
          </div>

          {!fitData ? (
            <button
              onClick={() => fitInputRef.current?.click()}
              disabled={isParsing}
              className="w-full flex items-center justify-center gap-3 py-4 border border-dashed border-border hover:border-primary/50 hover:bg-secondary/40 rounded-lg transition-all text-muted-foreground hover:text-foreground disabled:opacity-50"
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
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Analyse en cours...</span>
                </>
              ) : (
                <div className="text-left">
                  <p className="text-sm font-medium">Importer des fichiers .fit</p>
                  <p className="text-xs text-muted-foreground">1 fichier ou plusieurs (ex: Murph = course + muscu + course)</p>
                </div>
              )}
            </button>
          ) : (
            <FitDataSummary data={fitData} />
          )}
        </div>

        {/* Results */}
        <div className="bg-card border border-border rounded-lg p-5 space-y-5">
          <h2 className="text-lg font-semibold text-foreground">Résultats</h2>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">Date et heure de la séance</label>
            <input
              type="datetime-local"
              value={wodDate}
              onChange={(e) => setWodDate(e.target.value)}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>

          {hasConditioning && !isAmrap && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-sm text-muted-foreground">Temps réalisé</label>
                <button
                  onClick={() => setCapAtteint(!capAtteint)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors ${capAtteint
                      ? 'bg-destructive/10 border-destructive/40 text-destructive'
                      : 'bg-secondary border-border text-muted-foreground hover:text-foreground'
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
                <div className="space-y-2 bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      value={capRounds}
                      onChange={(e) => setCapRounds(e.target.value)}
                      placeholder="0"
                      className="w-24 bg-transparent text-foreground text-center text-xl font-mono outline-none"
                    />
                    <span className="text-destructive text-sm">tours complets</span>
                  </div>
                  <input
                    type="text"
                    value={capNote}
                    onChange={(e) => setCapNote(e.target.value)}
                    placeholder="Et ensuite : ex. 400m de course, 10 thrusters..."
                    className="w-full px-3 py-2 bg-background/60 border border-destructive/20 rounded-lg text-foreground text-sm placeholder:text-muted-foreground outline-none"
                  />
                </div>
              )}
            </div>
          )}

          {hasConditioning && isAmrap && (
            <div className="space-y-3">
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Type de score</label>
                <div className="flex gap-1 p-1 bg-muted/60 rounded-md" role="group" aria-label="Type de score AMRAP">
                  <button
                    type="button"
                    aria-pressed={amrapScoreMode === 'rounds'}
                    onClick={() => setAmrapScoreMode('rounds')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${amrapScoreMode === 'rounds'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Rounds + reps
                  </button>
                  <button
                    type="button"
                    aria-pressed={amrapScoreMode === 'split'}
                    onClick={() => setAmrapScoreMode('split')}
                    className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${amrapScoreMode === 'split'
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                      }`}
                  >
                    Temps + reps
                  </button>
                </div>
              </div>

              {amrapScoreMode === 'split' ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      Temps pour terminer {splitScoreLabels.opening}
                    </label>
                    <TimeInput
                      minutes={splitTimeMinutes}
                      seconds={splitTimeSeconds}
                      onMinutesChange={setSplitTimeMinutes}
                      onSecondsChange={setSplitTimeSeconds}
                      ariaLabel={`Temps pour terminer ${splitScoreLabels.opening}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-2">
                      {splitScoreLabels.following} après {splitScoreLabels.opening}
                    </label>
                    <div className="relative w-36">
                      <input
                        type="number"
                        inputMode="numeric"
                        step="1"
                        min="0"
                        max="10000"
                        value={repsAfterSplit}
                        onChange={(e) => setRepsAfterSplit(e.target.value)}
                        placeholder="0"
                        aria-label={`${splitScoreLabels.following} après ${splitScoreLabels.opening}`}
                        className="w-full px-4 py-3 pr-12 bg-background border border-border rounded-lg text-foreground text-center text-xl font-mono focus:outline-none focus:border-primary/50 transition-all"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                        reps
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">Score AMRAP</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={rounds}
                      onChange={(e) => setRounds(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-28 px-4 py-3 bg-background border border-border rounded-lg text-foreground text-center text-xl font-mono focus:outline-none focus:border-primary/50 transition-all"
                    />
                    <span className="text-muted-foreground font-semibold">rounds +</span>
                    <input
                      type="number"
                      value={bonusReps}
                      onChange={(e) => setBonusReps(e.target.value)}
                      placeholder="0"
                      min="0"
                      className="w-28 px-4 py-3 bg-background border border-border rounded-lg text-foreground text-center text-xl font-mono focus:outline-none focus:border-primary/50 transition-all"
                    />
                    <span className="text-muted-foreground">reps</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm text-muted-foreground mb-2">Comment tu t&apos;es senti ?</label>
            <StarRating rating={rating} onChange={setRating} />
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">
              Difficulté de toute la séance <span className="text-xs">(RPE)</span>
            </label>
            <RpeSelector value={rpe} onChange={setRpe} />
          </div>

          <div>
            <label htmlFor="session-duration" className="block text-sm text-muted-foreground mb-2">
              Durée totale de la séance
            </label>
            <div className="relative w-36">
              <input
                id="session-duration"
                type="number"
                inputMode="numeric"
                step="1"
                min="1"
                max="300"
                value={sessionMinutesValue}
                onChange={(e) => setSessionMinutesInput(e.target.value)}
                className="w-full px-4 py-3 pr-12 bg-background border border-border rounded-lg text-foreground text-center text-xl font-mono focus:outline-none focus:border-primary/50 transition-all"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground pointer-events-none">
                min
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1.5">
              Échauffement compris. Avec le RPE, elle mesure la charge de la séance.
            </p>
          </div>

          <div>
            <label className="block text-sm text-muted-foreground mb-2">Notes (optionnel)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Comment s'est passé ton WOD ?"
              rows={3}
              className="w-full px-4 py-3 bg-background border border-border rounded-lg text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:border-primary/50 transition-all"
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-3 pb-20 sm:pb-8">
          <Link
            href="/crossfit"
            className="flex-1 py-3.5 text-center border border-border bg-card text-foreground rounded-lg font-medium hover:bg-secondary/60 transition-colors"
          >
            Annuler
          </Link>
          <button
            onClick={handleSave}
            disabled={isSaving || !selectedWorkout}
            className="flex-1 py-3.5 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Enregistrement...' : 'Enregistrer la séance'}
          </button>
        </div>
      </div>
    </motion.div>
  )
}

export default function CrossfitLogWorkoutPage() {
  return <LogWorkoutContent />
}
