'use client'

import { PersonalizedWorkout } from '@/domain/entities/workout'
import { PersonalizedWorkoutListItem } from '../PersonalizedWorkoutListItem'

interface PersonalizedWorkoutListProps {
  workouts: PersonalizedWorkout[]
  selectedId: string
  onSelect: (id: string) => void
  loading: boolean
  hasMore: boolean
  onLoadMore: () => void
}

export function PersonalizedWorkoutList({
  workouts,
  selectedId,
  onSelect,
  loading,
  hasMore,
  onLoadMore,
}: PersonalizedWorkoutListProps) {
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
