'use client'

import { Filter, Search, X } from 'lucide-react'

interface WorkoutFilterPanelProps {
  searchQuery: string
  onSearchChange: (value: string) => void
  selectedType: string
  onTypeChange: (value: string) => void
  selectedDifficulty: string
  onDifficultyChange: (value: string) => void
  showFilters: boolean
  onToggleFilters: () => void
  totalCount: number
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

export function WorkoutFilterPanel({
  searchQuery,
  onSearchChange,
  selectedType,
  onTypeChange,
  selectedDifficulty,
  onDifficultyChange,
  showFilters,
  onToggleFilters,
  totalCount,
}: WorkoutFilterPanelProps) {
  const activeFiltersCount = [selectedDifficulty, selectedType].filter(Boolean).length

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <button
          type="button"
          onClick={onToggleFilters}
          className={`relative flex items-center gap-1.5 px-3 py-2 rounded-md border text-sm font-medium transition-all ${
            activeFiltersCount > 0 || showFilters
              ? 'bg-primary/10 text-primary border-primary/30'
              : 'bg-card text-muted-foreground border-border hover:border-primary'
          }`}
        >
          <Filter className="h-4 w-4" />
          Filtres
          {activeFiltersCount > 0 && (
            <span className="ml-0.5 w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center font-bold">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {showFilters && (
        <div className="bg-card border border-border rounded-md p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Filtres</span>
            {activeFiltersCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  onDifficultyChange('')
                  onTypeChange('')
                }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Réinitialiser
              </button>
            )}
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Type</p>
            <div className="flex flex-wrap gap-1.5">
              {workoutTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => onTypeChange(selectedType === type.value ? '' : type.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                    selectedType === type.value
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-muted/60 text-muted-foreground border-border hover:border-primary'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Difficulté</p>
            <div className="flex flex-wrap gap-1.5">
              {difficulties.map(diff => (
                <button
                  key={diff.value}
                  type="button"
                  onClick={() => onDifficultyChange(selectedDifficulty === diff.value ? '' : diff.value)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${
                    selectedDifficulty === diff.value
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-muted/60 text-muted-foreground border-border hover:border-primary'
                  }`}
                >
                  {diff.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeFiltersCount > 0 && !showFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedType && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/30">
              {workoutTypes.find(t => t.value === selectedType)?.label}
              <button type="button" onClick={() => onTypeChange('')}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {selectedDifficulty && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary border border-primary/30">
              {difficulties.find(d => d.value === selectedDifficulty)?.label}
              <button type="button" onClick={() => onDifficultyChange('')}>
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {totalCount} workout{totalCount > 1 ? 's' : ''} trouvé{totalCount > 1 ? 's' : ''}
      </p>
    </div>
  )
}
