'use client'

import { Workouts } from '@/domain/entities/workout'
import { Clock, Dumbbell, TrendingUp } from 'lucide-react'

interface WorkoutListItemProps {
  workout: Workouts
  selected: boolean
  onSelect: () => void
}

const difficultyColors: Record<string, string> = {
  beginner: 'text-green-700 bg-green-600/10 border-green-600/30',
  intermediate: 'text-yellow-700 bg-yellow-600/10 border-yellow-600/30',
  advanced: 'text-red-700 bg-red-600/10 border-red-600/30',
}

const difficultyLabels: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
}

export function WorkoutListItem({ workout, selected, onSelect }: WorkoutListItemProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full p-3 rounded-md border text-left transition-all ${
        selected
          ? 'border-primary/50 bg-primary/10'
          : 'border-border bg-card hover:border-primary hover:bg-muted/60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <h4 className="font-semibold text-sm text-foreground truncate">{workout.name}</h4>
            {selected && (
              <svg className="h-4 w-4 text-primary flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {workout.workout_type && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-700 border border-blue-600/30">
                <Dumbbell className="h-3 w-3" />
                {workout.workout_type.replace(/_/g, ' ')}
              </span>
            )}
            {workout.difficulty && (
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${difficultyColors[workout.difficulty] || 'text-muted-foreground bg-muted/60 border-border'}`}
              >
                <TrendingUp className="h-3 w-3" />
                {difficultyLabels[workout.difficulty] || workout.difficulty}
              </span>
            )}
            {workout.estimated_duration && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border">
                <Clock className="h-3 w-3" />
                {workout.estimated_duration} min
              </span>
            )}
          </div>
          {workout.description && <p className="text-xs text-muted-foreground mt-1.5 line-clamp-1">{workout.description}</p>}
        </div>
      </div>
    </button>
  )
}
