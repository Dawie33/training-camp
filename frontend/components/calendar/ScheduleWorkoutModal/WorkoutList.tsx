'use client'

import { Workouts } from '@/domain/entities/workout'
import { WorkoutListItem } from '../WorkoutListItem'

interface WorkoutListProps {
  workouts: Workouts[]
  selectedId: string
  onSelect: (id: string) => void
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
}

export function WorkoutList({ workouts, selectedId, onSelect, loading, hasMore, onLoadMore }: WorkoutListProps) {
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
