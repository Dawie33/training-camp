'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { PersonalizedWorkout, Workouts } from '@/domain/entities/workout'
import { activitiesApi } from '@/services/activities'
import { BIKE_TYPE_LABELS, BikeType } from '@/services/biking'
import { RUN_TYPE_LABELS, RunType } from '@/services/running'
import { SESSION_GOAL_LABELS, StrengthSession, strengthService } from '@/services/strength'
import { workoutsApi, workoutsService } from '@/services/workouts'
import { Activity, Bike, Dumbbell, Footprints, Search, Sparkles } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { PersonalizedWorkoutListItem } from './PersonalizedWorkoutListItem'
import { WorkoutFilterPanel } from './WorkoutFilterPanel'
import { WorkoutListItem } from './WorkoutListItem'

type SportTab = 'crossfit' | 'running' | 'biking' | 'strength'

const SPORT_TABS: { id: SportTab; label: string; icon: React.ReactNode; color: string; activeColor: string }[] = [
  { id: 'crossfit', label: 'CrossFit', icon: <Activity className="h-4 w-4" />, color: 'text-muted-foreground', activeColor: 'bg-primary/10 text-primary border-primary/30' },
  { id: 'running', label: 'Running', icon: <Footprints className="h-4 w-4" />, color: 'text-muted-foreground', activeColor: 'bg-green-600/10 text-green-700 border-green-600/30' },
  { id: 'biking', label: 'Vélo', icon: <Bike className="h-4 w-4" />, color: 'text-muted-foreground', activeColor: 'bg-blue-600/10 text-blue-700 border-blue-600/30' },
  { id: 'strength', label: 'Force', icon: <Dumbbell className="h-4 w-4" />, color: 'text-muted-foreground', activeColor: 'bg-red-600/10 text-red-700 border-red-600/30' },
]

interface ScheduleWorkoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  onSchedule: (payload: { workout_id?: string; personalized_workout_id?: string }, notes?: string) => Promise<void>
  onActivityScheduled?: () => void
}

const LIMIT = 20

export function ScheduleWorkoutModal({ open, onOpenChange, selectedDate, onSchedule, onActivityScheduled }: ScheduleWorkoutModalProps) {
  const [sportTab, setSportTab] = useState<SportTab>('crossfit')
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

  // Sport-specific state
  const [runType, setRunType] = useState<RunType>('easy')
  const [bikeType, setBikeType] = useState<BikeType>('endurance')

  // Force
  const [strengthSessions, setStrengthSessions] = useState<StrengthSession[]>([])
  const [loadingStrength, setLoadingStrength] = useState(false)
  const [selectedStrengthId, setSelectedStrengthId] = useState<string>('')
  const [strengthSearch, setStrengthSearch] = useState('')
  const [strengthGoalFilter, setStrengthGoalFilter] = useState<string>('')

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

  useEffect(() => {
    if (open && sportTab === 'strength' && strengthSessions.length === 0) {
      setLoadingStrength(true)
      strengthService.getSessions({ limit: 30 })
        .then(data => setStrengthSessions(data.rows))
        .catch(() => { })
        .finally(() => setLoadingStrength(false))
    }
  }, [open, sportTab])

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
    setSportTab('crossfit')
    setShowFilters(false)
    setNotes('')
    setRunType('easy')
    setBikeType('endurance')
    setStrengthSessions([])
    setSelectedStrengthId('')
    setStrengthSearch('')
    setStrengthGoalFilter('')
  }

  const handleSubmitSportActivity = async () => {
    const activityTypeMap: Record<Exclude<SportTab, 'crossfit'>, 'running' | 'biking' | 'strength'> = {
      running: 'running',
      biking: 'biking',
      strength: 'strength',
    }
    if (sportTab === 'crossfit') return
    setSubmitting(true)
    try {
      await activitiesApi.create({
        activity_type: activityTypeMap[sportTab],
        scheduled_date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
        activity_id: sportTab === 'strength' ? selectedStrengthId || undefined : undefined,
        notes: notes || undefined,
      })
      toast.success('Séance planifiée !')
      onActivityScheduled?.()
      resetState()
      onOpenChange(false)
    } catch {
      toast.error('Erreur lors de la planification')
    } finally {
      setSubmitting(false)
    }
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

  const activeSport = SPORT_TABS.find(t => t.id === sportTab)!

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">Planifier une séance</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </DialogDescription>
        </DialogHeader>

        {/* Sélecteur de sport */}
        <div className="flex gap-1 bg-muted/60 rounded-md p-1">
          {SPORT_TABS.map(tab => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setSportTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-all border ${sportTab === tab.id ? `${tab.activeColor} border` : 'text-muted-foreground hover:text-foreground border-transparent'
                }`}
            >
              {tab.icon}{tab.label}
            </button>
          ))}
        </div>

        {/* --- CROSSFIT --- */}
        {sportTab === 'crossfit' && (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1 overflow-hidden min-h-0">
            <div className="flex gap-1 bg-muted/60 rounded-md p-1">
              <button type="button" onClick={() => handleTabChange('library')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'library' ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground'}`}>
                <Dumbbell className="h-4 w-4" />Bibliothèque
              </button>
              <button type="button" onClick={() => handleTabChange('personalized')}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'personalized' ? 'bg-blue-600/10 text-blue-700 border border-blue-600/30' : 'text-muted-foreground hover:text-foreground'}`}>
                <Sparkles className="h-4 w-4" />Personnalisés
              </button>
            </div>

            {activeTab === 'library' && (
              <>
                <WorkoutFilterPanel searchQuery={searchQuery} onSearchChange={setSearchQuery} selectedType={selectedType} onTypeChange={setSelectedType} selectedDifficulty={selectedDifficulty} onDifficultyChange={setSelectedDifficulty} showFilters={showFilters} onToggleFilters={() => setShowFilters(f => !f)} totalCount={totalCount} />
                <WorkoutList workouts={workouts} selectedId={selectedWorkoutId} onSelect={setSelectedWorkoutId} loading={loadingWorkouts} hasMore={hasMore} onLoadMore={() => loadWorkouts(false)} />
              </>
            )}
            {activeTab === 'personalized' && (
              <>
                <div className="space-y-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input type="text" placeholder="Rechercher un workout personnalisé..." value={personalizedSearch} onChange={e => setPersonalizedSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600/30" />
                  </div>
                  <p className="text-xs text-muted-foreground">{personalizedTotal} workout{personalizedTotal > 1 ? 's' : ''} personnalisé{personalizedTotal > 1 ? 's' : ''}</p>
                </div>
                <PersonalizedWorkoutList workouts={personalizedWorkouts} selectedId={selectedWorkoutId} onSelect={setSelectedWorkoutId} loading={loadingPersonalized} hasMore={personalizedHasMore} onLoadMore={() => loadPersonalizedWorkouts(false)} />
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes (optionnel)</label>
              <textarea placeholder="Ajouter des notes..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            </div>
            <div className="flex justify-end gap-2 pt-1 border-t border-border">
              <button type="button" onClick={() => { resetState(); onOpenChange(false) }} disabled={submitting} className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Annuler</button>
              <button type="submit" disabled={!selectedWorkoutId || submitting} className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${!selectedWorkoutId || submitting ? 'bg-muted text-muted-foreground cursor-not-allowed' : activeTab === 'personalized' ? 'bg-blue-600 hover:bg-blue-700 text-primary-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                {submitting ? 'Planification...' : 'Planifier'}
              </button>
            </div>
          </form>
        )}

        {/* --- RUNNING / BIKING --- */}
        {sportTab !== 'crossfit' && sportTab !== 'strength' && (
          <div className="flex flex-col gap-4 flex-1">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type de séance</label>
              <div className="grid grid-cols-2 gap-2">
                {sportTab === 'running' && (Object.entries(RUN_TYPE_LABELS) as [RunType, string][]).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setRunType(value)}
                    className={`px-3 py-2.5 rounded-md border text-sm text-left transition-all ${runType === value ? activeSport.activeColor + ' border' : 'bg-card border-border text-foreground hover:bg-muted/60'}`}>
                    {label}
                  </button>
                ))}
                {sportTab === 'biking' && (Object.entries(BIKE_TYPE_LABELS) as [BikeType, string][]).map(([value, label]) => (
                  <button key={value} type="button" onClick={() => setBikeType(value)}
                    className={`px-3 py-2.5 rounded-md border text-sm text-left transition-all ${bikeType === value ? activeSport.activeColor + ' border' : 'bg-card border-border text-foreground hover:bg-muted/60'}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes (optionnel)</label>
              <textarea placeholder="Objectif, distance visée, intensité..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none" />
            </div>

            <div className="flex justify-end gap-2 mt-auto pt-1 border-t border-border">
              <button type="button" onClick={() => { resetState(); onOpenChange(false) }} disabled={submitting} className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Annuler</button>
              <button type="button" onClick={handleSubmitSportActivity} disabled={submitting}
                className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${submitting ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}>
                {submitting ? 'Planification...' : 'Planifier'}
              </button>
            </div>
          </div>
        )}

        {/* --- FORCE --- */}
        {sportTab === 'strength' && (
          <div className="flex flex-col gap-3 flex-1 overflow-hidden min-h-0">
            {/* Recherche + filtre objectif */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher une séance..."
                  value={strengthSearch}
                  onChange={e => setStrengthSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-600/30"
                />
              </div>
              <div className="flex gap-1.5 flex-wrap">
                {['', 'strength', 'hypertrophy', 'endurance', 'power'].map(goal => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => setStrengthGoalFilter(goal)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${strengthGoalFilter === goal ? 'bg-red-600/10 border-red-600/30 text-red-700' : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}
                  >
                    {goal === '' ? 'Tous' : SESSION_GOAL_LABELS[goal as keyof typeof SESSION_GOAL_LABELS]}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0" style={{ maxHeight: '240px' }}>
              {loadingStrength ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
                </div>
              ) : (() => {
                const filtered = strengthSessions.filter(s => {
                  const name = s.ai_plan?.session_name ?? ''
                  const matchSearch = strengthSearch === '' ||
                    name.toLowerCase().includes(strengthSearch.toLowerCase()) ||
                    s.target_muscles.some(m => m.toLowerCase().includes(strengthSearch.toLowerCase()))
                  const matchGoal = strengthGoalFilter === '' || s.session_goal === strengthGoalFilter
                  return matchSearch && matchGoal
                })
                if (strengthSessions.length === 0) return (
                  <div className="text-center py-8 text-muted-foreground text-sm space-y-2">
                    <Dumbbell className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p>Aucune séance force créée.</p>
                    <a href="/musculation/generate" className="text-red-700 hover:underline text-xs">Générer une séance →</a>
                  </div>
                )
                if (filtered.length === 0) return (
                  <p className="text-center py-6 text-muted-foreground text-sm">Aucun résultat</p>
                )
                return filtered.map(session => {
                  const name = session.ai_plan?.session_name ?? SESSION_GOAL_LABELS[session.session_goal]
                  const isSelected = selectedStrengthId === session.id
                  return (
                    <button
                      key={session.id}
                      type="button"
                      onClick={() => setSelectedStrengthId(session.id)}
                      className={`w-full text-left px-3 py-2.5 rounded-md border transition-all ${isSelected ? 'bg-red-600/10 border-red-600/30 text-red-700' : 'bg-card border-border text-foreground hover:bg-muted/60'}`}
                    >
                      <p className="font-semibold text-sm">{name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{session.target_muscles.join(', ')} · {SESSION_GOAL_LABELS[session.session_goal]}</p>
                    </button>
                  )
                })
              })()}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes (optionnel)</label>
              <textarea placeholder="Objectif, charge cible, intention..." value={notes} onChange={e => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-600/30 resize-none" />
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-border">
              <button type="button" onClick={() => { resetState(); onOpenChange(false) }} disabled={submitting} className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Annuler</button>
              <button type="button" onClick={handleSubmitSportActivity} disabled={submitting}
                className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${submitting ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-primary-foreground'}`}>
                {submitting ? 'Planification...' : 'Planifier'}
              </button>
            </div>
          </div>
        )}

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
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Aucun workout trouvé</div>
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
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground border border-border hover:border-primary rounded-md transition-all"
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
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground text-sm">Aucun workout personnalisé trouvé</div>
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
              className="w-full py-2 text-sm text-muted-foreground hover:text-foreground border border-border hover:border-primary rounded-md transition-all"
            >
              {loading ? 'Chargement...' : 'Charger plus'}
            </button>
          )}
        </>
      )}
    </div>
  )
}