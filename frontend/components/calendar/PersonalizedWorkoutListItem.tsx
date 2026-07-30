'use client'

import { Sparkles } from 'lucide-react'
import { Check } from 'lucide-react'

interface PersonalizedWorkoutListItemProps {
  workout: {
    id: string
    wod_date?: string | null
    plan_json?: {
      name?: string
      workout_type?: string
      difficulty?: string
      estimated_duration?: number
    }
  }
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

export function PersonalizedWorkoutListItem({ workout, selected, onSelect }: PersonalizedWorkoutListItemProps) {
  const plan = workout.plan_json

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full p-3 rounded-md border text-left transition-all ${
        selected
          ? 'border-blue-600/50 bg-blue-600/10'
          : 'border-border bg-card hover:border-primary hover:bg-muted/60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="h-3.5 w-3.5 text-blue-700 flex-shrink-0" />
            <h4 className="font-semibold text-sm text-foreground truncate">{plan?.name || 'Workout Personnalisé'}</h4>
            {selected && <Check className="h-4 w-4 text-blue-700 flex-shrink-0" />}
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            {plan?.workout_type && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-700 border border-blue-600/30">
                {plan.workout_type.replace(/_/g, ' ')}
              </span>
            )}
            {plan?.difficulty && (
              <span
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${difficultyColors[plan.difficulty] || 'text-muted-foreground bg-muted/60 border-border'}`}
              >
                {difficultyLabels[plan.difficulty] || plan.difficulty}
              </span>
            )}
            {plan?.estimated_duration && (
              <span className="px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground border border-border">
                {plan.estimated_duration} min
              </span>
            )}
            {workout.wod_date && (
              <span className="text-muted-foreground">
                {new Date(workout.wod_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  )
}
