'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { WorkoutHistoryService } from '@/lib/services/workout-history.service'
import { WorkoutResult } from '@/lib/types/workout-history'
import { cn } from '@/lib/utils'
import { fadeInUp } from '@/lib/animations'
import { motion } from 'framer-motion'
import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock,
  Dumbbell,
  Frown,
  Meh,
  Smile,
  Sparkles,
  Trash2
} from 'lucide-react'
import { useEffect, useState } from 'react'

interface WorkoutHistoryListProps {
  sportId?: string
  limit?: number
}

const difficultyColors = {
  easy: 'bg-green-500/10 text-green-500 border-green-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  hard: 'bg-red-500/10 text-red-500 border-red-500/20'
}

const feelingIcons = {
  bad: Frown,
  ok: Meh,
  good: Smile,
  great: Sparkles
}

const feelingColors = {
  bad: 'text-red-500',
  ok: 'text-yellow-500',
  good: 'text-green-500',
  great: 'text-blue-500'
}

export function WorkoutHistoryList({ sportId, limit }: WorkoutHistoryListProps) {
  const [workouts, setWorkouts] = useState<WorkoutResult[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadWorkouts = () => {
    let results: WorkoutResult[]
    if (sportId) {
      results = WorkoutHistoryService.getWorkoutsBySport(sportId)
    } else {
      results = WorkoutHistoryService.getAllWorkouts()
    }

    if (limit) {
      results = results.slice(0, limit)
    }

    setWorkouts(results)
  }

  useEffect(() => {
    loadWorkouts()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sportId])

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce workout ?')) {
      WorkoutHistoryService.deleteWorkout(id)
      loadWorkouts()
    }
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui"
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier'
    }

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    })
  }

  if (workouts.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Dumbbell className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>Aucun workout enregistré</p>
        <p className="text-sm mt-2">Complète un workout pour voir ton historique ici</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {workouts.map((workout, index) => {
        const isExpanded = expandedId === workout.id
        const FeelingIcon = feelingIcons[workout.feeling]

        return (
          <motion.div
            key={workout.id}
            variants={fadeInUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: index * 0.05 }}
            className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
          >
            {/* Header - Always visible */}
            <div
              className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => toggleExpand(workout.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg">
                      {workout.workoutName || workout.timerType}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {workout.timerType}
                    </Badge>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(workout.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{formatDuration(workout.duration)}</span>
                    </div>
                    {workout.completedRounds && workout.totalRounds && (
                      <div className="flex items-center gap-1">
                        <Dumbbell className="w-4 h-4" />
                        <span>
                          {workout.completedRounds}/{workout.totalRounds} rounds
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge className={cn('text-xs', difficultyColors[workout.difficulty])}>
                      {workout.difficulty}
                    </Badge>
                    <div className="flex items-center gap-1">
                      <FeelingIcon className={cn('w-4 h-4', feelingColors[workout.feeling])} />
                      <span className="text-xs text-muted-foreground capitalize">
                        {workout.feeling}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDelete(workout.id)
                    }}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                  )}
                </div>
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="border-t bg-muted/30"
              >
                <div className="p-4 space-y-4">
                  {/* Notes */}
                  {workout.notes && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Notes</h4>
                      <p className="text-sm text-muted-foreground">{workout.notes}</p>
                    </div>
                  )}

                  {/* Exercises */}
                  {workout.exercises && workout.exercises.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Exercices</h4>
                      <div className="space-y-2">
                        {workout.exercises.map((exercise, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm bg-background rounded p-2"
                          >
                            <span className="font-medium">{exercise.name}</span>
                            <div className="flex items-center gap-3 text-muted-foreground">
                              {exercise.sets && <span>{exercise.sets} sets</span>}
                              {exercise.reps && <span>{exercise.reps} reps</span>}
                              {exercise.weight && <span>{exercise.weight} kg</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Personal Records */}
                  {workout.personalRecords && workout.personalRecords.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-yellow-500" />
                        Records Personnels
                      </h4>
                      <div className="space-y-2">
                        {workout.personalRecords.map((pr, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between text-sm bg-yellow-500/10 border border-yellow-500/20 rounded p-2"
                          >
                            <span className="font-medium">{pr.type}</span>
                            <span className="text-yellow-600 dark:text-yellow-400 font-bold">
                              {pr.value} {pr.unit}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="text-xs text-muted-foreground pt-2 border-t">
                    <p>Créé le {new Date(workout.createdAt).toLocaleString('fr-FR')}</p>
                    {workout.updatedAt !== workout.createdAt && (
                      <p>Modifié le {new Date(workout.updatedAt).toLocaleString('fr-FR')}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        )
      })}
    </div>
  )
}
