'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { PersonalizedWorkout, Workouts } from '@/domain/entities/workout'
import { workoutsApi, workoutsService } from '@/services/workouts'
import { Check, Clock, Dumbbell, Filter, Search, Sparkles, TrendingUp, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ScheduleWorkoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  onSchedule: (payload: { workout_id?: string; personalized_workout_id?: string }, notes?: string) => Promise<void>
}

export function ScheduleWorkoutModal({
  open,
  onOpenChange,
  selectedDate,
  onSchedule,
}: ScheduleWorkoutModalProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'personalized'>('library')

  // Library tab state
  const [workouts, setWorkouts] = useState<Workouts[]>([])
  const [loadingWorkouts, setLoadingWorkouts] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  // Personalized tab state
  const [personalizedWorkouts, setPersonalizedWorkouts] = useState<PersonalizedWorkout[]>([])
  const [loadingPersonalized, setLoadingPersonalized] = useState(false)
  const [personalizedSearch, setPersonalizedSearch] = useState('')
  const [personalizedTotal, setPersonalizedTotal] = useState(0)
  const [personalizedHasMore, setPersonalizedHasMore] = useState(true)

  // Common state
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const LIMIT = 20

  useEffect(() => {
    if (open) {
      loadWorkouts(true)
    } else {
      setWorkouts([])
      setPersonalizedWorkouts([])
      setSearchQuery('')
      setPersonalizedSearch('')
      setSelectedDifficulty('')
      setSelectedType('')
      setHasMore(true)
      setPersonalizedHasMore(true)
      setSelectedWorkoutId('')
      setActiveTab('library')
      setShowFilters(false)
    }
  }, [open])

  useEffect(() => {
    if (open && activeTab === 'library') {
      loadWorkouts(true)
    }
  }, [searchQuery, selectedDifficulty, selectedType, activeTab])

  useEffect(() => {
    if (open && activeTab === 'personalized') {
      loadPersonalizedWorkouts(true)
    }
  }, [personalizedSearch, activeTab])

  const loadWorkouts = async (reset = false) => {
    try {
      setLoadingWorkouts(true)
      const offset = reset ? 0 : workouts.length
      const data = await workoutsApi.getAll({
        limit: LIMIT,
        offset,
        status: 'published',
        search: searchQuery || undefined,
        difficulty: selectedDifficulty || undefined,
        workout_type: selectedType || undefined,
      })
      if (reset) {
        setWorkouts(data.rows)
      } else {
        setWorkouts(prev => [...prev, ...data.rows])
      }
      setTotalCount(data.count)
      setHasMore((reset ? 0 : workouts.length) + data.rows.length < data.count)
    } catch (error) {
      console.error('Error loading workouts:', error)
    } finally {
      setLoadingWorkouts(false)
    }
  }

  const loadPersonalizedWorkouts = async (reset = false) => {
    try {
      setLoadingPersonalized(true)
      const offset = reset ? 0 : personalizedWorkouts.length
      const data = await workoutsService.getPersonalizedWorkouts(
        LIMIT,
        offset,
        personalizedSearch || undefined,
      )
      if (reset) {
        setPersonalizedWorkouts(data.rows)
      } else {
        setPersonalizedWorkouts(prev => [...prev, ...data.rows])
      }
      setPersonalizedTotal(data.count)
      setPersonalizedHasMore((reset ? 0 : personalizedWorkouts.length) + data.rows.length < data.count)
    } catch (error) {
      console.error('Error loading personalized workouts:', error)
    } finally {
      setLoadingPersonalized(false)
    }
  }

  const handleTabChange = (tab: 'library' | 'personalized') => {
    setActiveTab(tab)
    setSelectedWorkoutId('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWorkoutId) return
    try {
      setSubmitting(true)
      if (activeTab === 'library') {
        await onSchedule({ workout_id: selectedWorkoutId }, notes || undefined)
      } else {
        await onSchedule({ personalized_workout_id: selectedWorkoutId }, notes || undefined)
      }
      setSelectedWorkoutId('')
      setNotes('')
      setSearchQuery('')
      onOpenChange(false)
    } catch (error) {
      console.error('Error scheduling workout:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const activeFiltersCount = [selectedDifficulty, selectedType].filter(Boolean).length

  const workoutTypes = [
    { value: 'for_time', label: 'For Time' },
    { value: 'amrap', label: 'AMRAP' },
    { value: 'emom', label: 'EMOM' },
    { value: 'chipper', label: 'Chipper' },
    { value: 'benchmark', label: 'Benchmark' },
    { value: 'strength', label: 'Strength' },
    { value: 'skill_work', label: 'Skill Work' },
    { value: 'custom', label: 'Custom' },
  ]

  const difficulties = [
    { value: 'beginner', label: 'Débutant' },
    { value: 'intermediate', label: 'Intermédiaire' },
    { value: 'advanced', label: 'Avancé' },
  ]

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'beginner': return 'text-green-400 bg-green-500/20 border-green-500/30'
      case 'intermediate': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
      case 'advanced': return 'text-red-400 bg-red-500/20 border-red-500/30'
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Planifier un workout</DialogTitle>
          <DialogDescription className="text-slate-400">
            {selectedDate.toLocaleDateString('fr-FR', {
              weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
            })}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-1 bg-slate-800/60 rounded-xl p-1">
          <button
            type="button"
            onClick={() => handleTabChange('library')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'library'
                ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Dumbbell className="h-4 w-4" />
            Bibliothèque
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('personalized')}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'personalized'
                ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="h-4 w-4" />
            Personnalisés
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1 overflow-hidden min-h-0">

          {/* LIBRARY TAB */}
          {activeTab === 'library' && (
            <>
              {/* Search + filter toggle */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Rechercher par nom..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/50"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowFilters(f => !f)}
                    className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                      activeFiltersCount > 0 || showFilters
                        ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                        : 'bg-slate-800/50 text-slate-400 border-white/10 hover:border-white/20'
                    }`}
                  >
                    <Filter className="h-4 w-4" />
                    Filtres
                    {activeFiltersCount > 0 && (
                      <span className="ml-0.5 w-5 h-5 rounded-full bg-orange-500 text-white text-xs flex items-center justify-center font-bold">
                        {activeFiltersCount}
                      </span>
                    )}
                  </button>
                </div>

                {/* Inline filter panel */}
                {showFilters && (
                  <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-300">Filtres</span>
                      {activeFiltersCount > 0 && (
                        <button
                          type="button"
                          onClick={() => { setSelectedDifficulty(''); setSelectedType('') }}
                          className="text-xs text-slate-400 hover:text-white transition-colors"
                        >
                          Réinitialiser
                        </button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Type</p>
                      <div className="flex flex-wrap gap-1.5">
                        {workoutTypes.map((type) => (
                          <button
                            key={type.value}
                            type="button"
                            onClick={() => setSelectedType(selectedType === type.value ? '' : type.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                              selectedType === type.value
                                ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                : 'bg-slate-700/50 text-slate-400 border-white/10 hover:border-white/20'
                            }`}
                          >
                            {type.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs text-slate-500 uppercase tracking-wider">Difficulté</p>
                      <div className="flex flex-wrap gap-1.5">
                        {difficulties.map((diff) => (
                          <button
                            key={diff.value}
                            type="button"
                            onClick={() => setSelectedDifficulty(selectedDifficulty === diff.value ? '' : diff.value)}
                            className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                              selectedDifficulty === diff.value
                                ? 'bg-orange-500/20 text-orange-400 border-orange-500/30'
                                : 'bg-slate-700/50 text-slate-400 border-white/10 hover:border-white/20'
                            }`}
                          >
                            {diff.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Active filter chips */}
                {activeFiltersCount > 0 && !showFilters && (
                  <div className="flex flex-wrap gap-2">
                    {selectedType && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        {workoutTypes.find(t => t.value === selectedType)?.label}
                        <button type="button" onClick={() => setSelectedType('')}><X className="h-3 w-3" /></button>
                      </span>
                    )}
                    {selectedDifficulty && (
                      <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
                        {difficulties.find(d => d.value === selectedDifficulty)?.label}
                        <button type="button" onClick={() => setSelectedDifficulty('')}><X className="h-3 w-3" /></button>
                      </span>
                    )}
                  </div>
                )}

                <p className="text-xs text-slate-500">
                  {totalCount} workout{totalCount > 1 ? 's' : ''} trouvé{totalCount > 1 ? 's' : ''}
                </p>
              </div>

              {/* Workout list */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0" style={{ maxHeight: '280px' }}>
                {loadingWorkouts ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-400"></div>
                  </div>
                ) : workouts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">Aucun workout trouvé</div>
                ) : (
                  <>
                    {workouts.map((workout) => (
                      <button
                        key={workout.id}
                        type="button"
                        onClick={() => setSelectedWorkoutId(workout.id)}
                        className={`w-full p-3 rounded-xl border text-left transition-all ${
                          selectedWorkoutId === workout.id
                            ? 'border-orange-500/50 bg-orange-500/10'
                            : 'border-white/10 bg-slate-800/40 hover:border-white/20 hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1.5">
                              <h4 className="font-semibold text-sm text-white truncate">{workout.name}</h4>
                              {selectedWorkoutId === workout.id && (
                                <Check className="h-4 w-4 text-orange-400 flex-shrink-0" />
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 text-xs">
                              {workout.workout_type && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                  <Dumbbell className="h-3 w-3" />
                                  {workout.workout_type.replace(/_/g, ' ')}
                                </span>
                              )}
                              {workout.difficulty && (
                                <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${getDifficultyColor(workout.difficulty)}`}>
                                  <TrendingUp className="h-3 w-3" />
                                  {workout.difficulty}
                                </span>
                              )}
                              {workout.estimated_duration && (
                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-white/10">
                                  <Clock className="h-3 w-3" />
                                  {workout.estimated_duration} min
                                </span>
                              )}
                            </div>
                            {workout.description && (
                              <p className="text-xs text-slate-500 mt-1.5 line-clamp-1">{workout.description}</p>
                            )}
                          </div>
                        </div>
                      </button>
                    ))}
                    {hasMore && (
                      <button
                        type="button"
                        onClick={() => loadWorkouts(false)}
                        disabled={loadingWorkouts}
                        className="w-full py-2 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all"
                      >
                        {loadingWorkouts ? 'Chargement...' : 'Charger plus'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* PERSONALIZED TAB */}
          {activeTab === 'personalized' && (
            <>
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Rechercher un workout personnalisé..."
                    value={personalizedSearch}
                    onChange={(e) => setPersonalizedSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {personalizedTotal} workout{personalizedTotal > 1 ? 's' : ''} personnalisé{personalizedTotal > 1 ? 's' : ''}
                </p>
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0" style={{ maxHeight: '280px' }}>
                {loadingPersonalized ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400"></div>
                  </div>
                ) : personalizedWorkouts.length === 0 ? (
                  <div className="text-center py-8 text-slate-500 text-sm">Aucun workout personnalisé trouvé</div>
                ) : (
                  <>
                    {personalizedWorkouts.map((pw) => {
                      const plan = pw.plan_json
                      return (
                        <button
                          key={pw.id}
                          type="button"
                          onClick={() => setSelectedWorkoutId(pw.id)}
                          className={`w-full p-3 rounded-xl border text-left transition-all ${
                            selectedWorkoutId === pw.id
                              ? 'border-blue-500/50 bg-blue-500/10'
                              : 'border-white/10 bg-slate-800/40 hover:border-white/20 hover:bg-slate-800/60'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1.5">
                                <Sparkles className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                                <h4 className="font-semibold text-sm text-white truncate">{plan?.name || 'Workout Personnalisé'}</h4>
                                {selectedWorkoutId === pw.id && (
                                  <Check className="h-4 w-4 text-blue-400 flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                                {plan?.workout_type && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                                    <Dumbbell className="h-3 w-3" />
                                    {plan.workout_type.replace(/_/g, ' ')}
                                  </span>
                                )}
                                {plan?.difficulty && (
                                  <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${getDifficultyColor(plan.difficulty)}`}>
                                    <TrendingUp className="h-3 w-3" />
                                    {plan.difficulty}
                                  </span>
                                )}
                                {plan?.estimated_duration && (
                                  <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400 border border-white/10">
                                    <Clock className="h-3 w-3" />
                                    {plan.estimated_duration} min
                                  </span>
                                )}
                                {pw.wod_date && (
                                  <span className="text-slate-500">
                                    {new Date(pw.wod_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                    {personalizedHasMore && (
                      <button
                        type="button"
                        onClick={() => loadPersonalizedWorkouts(false)}
                        disabled={loadingPersonalized}
                        className="w-full py-2 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all"
                      >
                        {loadingPersonalized ? 'Chargement...' : 'Charger plus'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Notes (optionnel)</label>
            <textarea
              placeholder="Ajouter des notes pour cette séance..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => { setSelectedWorkoutId(''); setNotes(''); setSearchQuery(''); onOpenChange(false) }}
              disabled={submitting}
              className="px-4 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!selectedWorkoutId || submitting}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                !selectedWorkoutId || submitting
                  ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  : activeTab === 'personalized'
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/20'
              }`}
            >
              {submitting ? 'Planification...' : 'Planifier'}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
