'use client'

import { Dumbbell, Search, Sparkles } from 'lucide-react'
import { FormEvent } from 'react'
import { PersonalizedWorkoutList } from './PersonalizedWorkoutList'
import { WorkoutList } from './WorkoutList'
import { WorkoutFilterPanel } from '../WorkoutFilterPanel'
import { usePersonalizedWorkouts } from './usePersonalizedWorkouts'
import { useWorkoutLibrary } from './useWorkoutLibrary'

type LibraryHook = ReturnType<typeof useWorkoutLibrary>
type PersonalizedHook = ReturnType<typeof usePersonalizedWorkouts>

interface CrossfitTabProps {
  activeTab: 'library' | 'personalized'
  onTabChange: (tab: 'library' | 'personalized') => void
  library: LibraryHook
  personalized: PersonalizedHook
  selectedWorkoutId: string
  onSelectWorkout: (id: string) => void
  notes: string
  onNotesChange: (value: string) => void
  submitting: boolean
  onSubmit: (e: FormEvent) => void
  onCancel: () => void
}

export function CrossfitTab({
  activeTab,
  onTabChange,
  library,
  personalized,
  selectedWorkoutId,
  onSelectWorkout,
  notes,
  onNotesChange,
  submitting,
  onSubmit,
  onCancel,
}: CrossfitTabProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4 flex-1 overflow-hidden min-h-0">
      <div className="flex gap-1 bg-muted/60 rounded-md p-1">
        <button
          type="button"
          onClick={() => onTabChange('library')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'library' ? 'bg-primary/10 text-primary border border-primary/30' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Dumbbell className="h-4 w-4" />
          Bibliothèque
        </button>
        <button
          type="button"
          onClick={() => onTabChange('personalized')}
          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all ${activeTab === 'personalized' ? 'bg-blue-600/10 text-blue-700 border border-blue-600/30' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Sparkles className="h-4 w-4" />
          Personnalisés
        </button>
      </div>

      {activeTab === 'library' && (
        <>
          <WorkoutFilterPanel
            searchQuery={library.searchQuery}
            onSearchChange={library.setSearchQuery}
            selectedType={library.selectedType}
            onTypeChange={library.setSelectedType}
            selectedDifficulty={library.selectedDifficulty}
            onDifficultyChange={library.setSelectedDifficulty}
            showFilters={library.showFilters}
            onToggleFilters={() => library.setShowFilters(f => !f)}
            totalCount={library.totalCount}
          />
          <WorkoutList
            workouts={library.workouts}
            selectedId={selectedWorkoutId}
            onSelect={onSelectWorkout}
            loading={library.loading}
            hasMore={library.hasMore}
            onLoadMore={library.loadMore}
          />
        </>
      )}
      {activeTab === 'personalized' && (
        <>
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Rechercher un workout personnalisé..."
                value={personalized.search}
                onChange={e => personalized.setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600/30"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              {personalized.totalCount} workout{personalized.totalCount > 1 ? 's' : ''} personnalisé
              {personalized.totalCount > 1 ? 's' : ''}
            </p>
          </div>
          <PersonalizedWorkoutList
            workouts={personalized.workouts}
            selectedId={selectedWorkoutId}
            onSelect={onSelectWorkout}
            loading={personalized.loading}
            hasMore={personalized.hasMore}
            onLoadMore={personalized.loadMore}
          />
        </>
      )}

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes (optionnel)</label>
        <textarea
          placeholder="Ajouter des notes..."
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>
      <div className="flex justify-end gap-2 pt-1 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={!selectedWorkoutId || submitting}
          className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${!selectedWorkoutId || submitting ? 'bg-muted text-muted-foreground cursor-not-allowed' : activeTab === 'personalized' ? 'bg-blue-600 hover:bg-blue-700 text-primary-foreground' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
        >
          {submitting ? 'Planification...' : 'Planifier'}
        </button>
      </div>
    </form>
  )
}
