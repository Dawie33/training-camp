'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PersonalizedWorkout, Workouts } from '@/domain/entities/workout'
import { workoutsApi, workoutsService } from '@/services/workouts'
import { Dumbbell, Search, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { WorkoutFilterPanel } from './WorkoutFilterPanel'
import { WorkoutListItem } from './WorkoutListItem'
import { PersonalizedWorkoutListItem } from './PersonalizedWorkoutListItem'

interface ScheduleWorkoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  onSchedule: (payload: { workout_id?: string; personalized_workout_id?: string }, notes?: string) => Promise<void>
}

const LIMIT = 20

export function ScheduleWorkoutModal({ open, onOpenChange, selectedDate, onSchedule }: ScheduleWorkoutModalProps) {
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

  useEffect(() => {
    if (open) {
      loadWorkouts(true)
    } else {
      resetState()
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

  const resetState = () => {
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
    setNotes('')
  }

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
      setHasMore(offset + data.rows.length < data.count)
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
      const data = await workoutsService.getPersonalizedWorkouts(LIMIT, offset, personalizedSearch || undefined)
      if (reset) {
        setPersonalizedWorkouts(data.rows)
      } else {
        setPersonalizedWorkouts(prev => [...prev, ...data.rows])
      }
      setPersonalizedTotal(data.count)
      setPersonalizedHasMore(offset + data.rows.length < data.count)
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
      resetState()
      onOpenChange(false)
    } catch (error) {
      console.error('Error scheduling workout:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Planifier un workout</DialogTitle>
          <DialogDescription className="text-slate-400">
            {selectedDate.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
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
              <WorkoutFilterPanel
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                selectedType={selectedType}
                onTypeChange={setSelectedType}
                selectedDifficulty={selectedDifficulty}
                onDifficultyChange={setSelectedDifficulty}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters(f => !f)}
                totalCount={totalCount}
              />

              {/* Workout list */}
              <WorkoutList
                workouts={workouts}
                selectedId={selectedWorkoutId}
                onSelect={setSelectedWorkoutId}
                loading={loadingWorkouts}
                hasMore={hasMore}
                onLoadMore={() => loadWorkouts(false)}
              />
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
                    onChange={e => setPersonalizedSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
                  />
                </div>
                <p className="text-xs text-slate-500">
                  {personalizedTotal} workout{personalizedTotal > 1 ? 's' : ''} personnalisé
                  {personalizedTotal > 1 ? 's' : ''}
                </p>
              </div>

              <PersonalizedWorkoutList
                workouts={personalizedWorkouts}
                selectedId={selectedWorkoutId}
                onSelect={setSelectedWorkoutId}
                loading={loadingPersonalized}
                hasMore={personalizedHasMore}
                onLoadMore={() => loadPersonalizedWorkouts(false)}
              />
            </>
          )}

          {/* Notes */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">Notes (optionnel)</label>
            <textarea
              placeholder="Ajouter des notes pour cette séance..."
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 bg-slate-800/50 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none"
            />
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2 pt-1 border-t border-white/10">
            <button
              type="button"
              onClick={() => {
                resetState()
                onOpenChange(false)
              }}
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

function WorkoutList({
  workouts,
  selectedId,
  onSelect,
  loading,
  hasMore,
  onLoadMore,
}: {
  workouts: Workouts[]
  selectedId: string
  onSelect: (id: string) => void
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
}) {
  return (
    <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0" style={{ maxHeight: '280px' }}>
      {loading && workouts.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-400" />
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">Aucun workout trouvé</div>
      ) : (
        <>
          {workouts.map(workout => (
            <WorkoutListItem
              key={workout.id}
              workout={workout}
              selected={selectedId === workout.id}
              onSelect={() => onSelect(workout.id)}
            />
          ))}
          {hasMore && (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loading}
              className="w-full py-2 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all"
            >
              {loading ? 'Chargement...' : 'Charger plus'}
            </button>
          )}
        </>
      )}
    </div>
  )
}

function PersonalizedWorkoutList({
  workouts,
  selectedId,
  onSelect,
  loading,
  hasMore,
  onLoadMore,
}: {
  workouts: PersonalizedWorkout[]
  selectedId: string
  onSelect: (id: string) => void
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
}) {
  return (
    <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0" style={{ maxHeight: '280px' }}>
      {loading && workouts.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-400" />
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-8 text-slate-500 text-sm">Aucun workout personnalisé trouvé</div>
      ) : (
        <>
          {workouts.map(pw => (
            <PersonalizedWorkoutListItem
              key={pw.id}
              workout={pw}
              selected={selectedId === pw.id}
              onSelect={() => onSelect(pw.id)}
            />
          ))}
          {hasMore && (
            <button
              type="button"
              onClick={onLoadMore}
              disabled={loading}
              className="w-full py-2 text-sm text-slate-400 hover:text-white border border-white/10 hover:border-white/20 rounded-xl transition-all"
            >
              {loading ? 'Chargement...' : 'Charger plus'}
            </button>
          )}
        </>
      )}
    </div>
  )
}
