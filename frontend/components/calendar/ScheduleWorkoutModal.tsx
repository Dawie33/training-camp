'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { workoutsApi } from '@/lib/api/workouts'
import { Workouts } from '@/lib/types/workout'
import { useEffect, useState } from 'react'
import { Check, Clock, Dumbbell, Filter, Search, TrendingUp, X } from 'lucide-react'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Badge } from '@/components/ui/badge'

interface ScheduleWorkoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  onSchedule: (workoutId: string, notes?: string) => Promise<void>
}

export function ScheduleWorkoutModal({
  open,
  onOpenChange,
  selectedDate,
  onSchedule,
}: ScheduleWorkoutModalProps) {
  const [workouts, setWorkouts] = useState<Workouts[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedWorkoutId, setSelectedWorkoutId] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('')
  const [selectedType, setSelectedType] = useState<string>('')
  const [totalCount, setTotalCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)

  const LIMIT = 20

  useEffect(() => {
    if (open) {
      loadWorkouts(true)
    } else {
      // Reset on close
      setWorkouts([])
      setSearchQuery('')
      setSelectedDifficulty('')
      setSelectedType('')
      setHasMore(true)
    }
  }, [open])

  useEffect(() => {
    if (open) {
      loadWorkouts(true)
    }
  }, [searchQuery, selectedDifficulty, selectedType])

  const loadWorkouts = async (reset = false) => {
    try {
      setLoading(true)
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
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWorkoutId) return

    try {
      setSubmitting(true)
      await onSchedule(selectedWorkoutId, notes || undefined)
      // Reset form
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

  const clearFilters = () => {
    setSelectedDifficulty('')
    setSelectedType('')
  }

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
      case 'beginner':
        return 'text-green-600 bg-green-50 dark:text-green-400 dark:bg-green-950'
      case 'intermediate':
        return 'text-yellow-600 bg-yellow-50 dark:text-yellow-400 dark:bg-yellow-950'
      case 'advanced':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950'
      default:
        return 'text-gray-600 bg-gray-50 dark:text-gray-400 dark:bg-gray-950'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Planifier un workout</DialogTitle>
          <DialogDescription>
            Planifier un workout pour le {selectedDate.toLocaleDateString('fr-FR', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* Search bar and filters */}
          <div className="space-y-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher par nom..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="relative">
                    <Filter className="h-4 w-4" />
                    {activeFiltersCount > 0 && (
                      <Badge
                        variant="destructive"
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Filtres</h4>
                      {activeFiltersCount > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearFilters}
                          className="h-auto p-1 text-xs"
                        >
                          Réinitialiser
                        </Button>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Type de workout</Label>
                      <div className="flex flex-wrap gap-2">
                        {workoutTypes.map((type) => (
                          <Badge
                            key={type.value}
                            variant={selectedType === type.value ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setSelectedType(selectedType === type.value ? '' : type.value)}
                          >
                            {type.label}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Difficulté</Label>
                      <div className="flex flex-wrap gap-2">
                        {difficulties.map((diff) => (
                          <Badge
                            key={diff.value}
                            variant={selectedDifficulty === diff.value ? "default" : "outline"}
                            className="cursor-pointer"
                            onClick={() => setSelectedDifficulty(selectedDifficulty === diff.value ? '' : diff.value)}
                          >
                            {diff.label}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            {/* Active filters display */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedType && (
                  <Badge variant="secondary" className="gap-1">
                    {workoutTypes.find(t => t.value === selectedType)?.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedType('')}
                    />
                  </Badge>
                )}
                {selectedDifficulty && (
                  <Badge variant="secondary" className="gap-1">
                    {difficulties.find(d => d.value === selectedDifficulty)?.label}
                    <X
                      className="h-3 w-3 cursor-pointer"
                      onClick={() => setSelectedDifficulty('')}
                    />
                  </Badge>
                )}
              </div>
            )}

            {/* Results count */}
            <div className="text-xs text-muted-foreground">
              {totalCount} workout{totalCount > 1 ? 's' : ''} trouvé{totalCount > 1 ? 's' : ''}
            </div>
          </div>

          {/* Workout selection */}
          <div className="space-y-2 flex-1 overflow-hidden flex flex-col">
            <Label>Sélectionner un workout</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-y-auto pr-2 space-y-2 flex-1" style={{ maxHeight: '300px' }}>
                {workouts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    Aucun workout trouvé
                  </div>
                ) : (
                  <>
                    {workouts.map((workout) => (
                    <button
                      key={workout.id}
                      type="button"
                      onClick={() => setSelectedWorkoutId(workout.id)}
                      className={`
                        w-full p-3 rounded-lg border-2 text-left transition-all
                        hover:border-primary hover:bg-accent/50
                        ${selectedWorkoutId === workout.id
                          ? 'border-primary bg-accent'
                          : 'border-border bg-card'
                        }
                      `}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-sm truncate">{workout.name}</h4>
                            {selectedWorkoutId === workout.id && (
                              <Check className="h-4 w-4 text-primary flex-shrink-0" />
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {workout.workout_type && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                                <Dumbbell className="h-3 w-3" />
                                <span className="capitalize">{workout.workout_type.replace(/_/g, ' ')}</span>
                              </div>
                            )}

                            {workout.difficulty && (
                              <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${getDifficultyColor(workout.difficulty)}`}>
                                <TrendingUp className="h-3 w-3" />
                                <span className="capitalize">{workout.difficulty}</span>
                              </div>
                            )}

                            {workout.estimated_duration && (
                              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-gray-50 text-gray-700 dark:bg-gray-950 dark:text-gray-400">
                                <Clock className="h-3 w-3" />
                                <span>{workout.estimated_duration} min</span>
                              </div>
                            )}
                          </div>

                          {workout.description && (
                            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                              {workout.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                    ))}

                    {/* Load more button */}
                    {hasMore && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => loadWorkouts(false)}
                        disabled={loading}
                      >
                        {loading ? 'Chargement...' : 'Charger plus'}
                      </Button>
                    )}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Ajouter des notes pour cette séance..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setSelectedWorkoutId('')
                setNotes('')
                setSearchQuery('')
                onOpenChange(false)
              }}
              disabled={submitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={!selectedWorkoutId || submitting}>
              {submitting ? 'Planification...' : 'Planifier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
