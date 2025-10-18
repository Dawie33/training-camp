'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { useState } from 'react'

export interface WorkoutFiltersState {
  search: string
  difficulty: string[]
  intensity: string[]
  minDuration?: number
  maxDuration?: number
}

interface WorkoutFiltersProps {
  filters: WorkoutFiltersState
  onFiltersChange: (filters: WorkoutFiltersState) => void
}

const difficulties = ['beginner', 'intermediate', 'advanced']
const intensities = ['low', 'moderate', 'high']

/**
 * Composant de filtres pour les workouts
 * Permet de rechercher et filtrer par difficulté, intensité et durée
 */
export function WorkoutFilters({ filters, onFiltersChange }: WorkoutFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value })
  }

  const toggleDifficulty = (difficulty: string) => {
    const newDifficulties = filters.difficulty.includes(difficulty)
      ? filters.difficulty.filter(d => d !== difficulty)
      : [...filters.difficulty, difficulty]
    onFiltersChange({ ...filters, difficulty: newDifficulties })
  }

  const toggleIntensity = (intensity: string) => {
    const newIntensities = filters.intensity.includes(intensity)
      ? filters.intensity.filter(i => i !== intensity)
      : [...filters.intensity, intensity]
    onFiltersChange({ ...filters, intensity: newIntensities })
  }

  const clearFilters = () => {
    onFiltersChange({
      search: '',
      difficulty: [],
      intensity: [],
      minDuration: undefined,
      maxDuration: undefined,
    })
  }

  const hasActiveFilters = filters.search || filters.difficulty.length > 0 || filters.intensity.length > 0

  return (
    <div className="space-y-4">
      {/* Barre de recherche */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Rechercher un workout..."
            value={filters.search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filtres
        </Button>
        {hasActiveFilters && (
          <Button variant="ghost" onClick={clearFilters} size="icon">
            <X className="w-4 h-4" />
          </Button>
        )}
      </div>

      {/* Filtres avancés */}
      {showAdvanced && (
        <div className="p-4 border rounded-lg space-y-4 bg-card">
          {/* Difficulté */}
          <div>
            <label className="text-sm font-medium mb-2 block">Difficulté</label>
            <div className="flex gap-2 flex-wrap">
              {difficulties.map((difficulty) => (
                <Button
                  key={difficulty}
                  variant={filters.difficulty.includes(difficulty) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleDifficulty(difficulty)}
                  className="capitalize"
                >
                  {difficulty}
                </Button>
              ))}
            </div>
          </div>

          {/* Intensité */}
          <div>
            <label className="text-sm font-medium mb-2 block">Intensité</label>
            <div className="flex gap-2 flex-wrap">
              {intensities.map((intensity) => (
                <Button
                  key={intensity}
                  variant={filters.intensity.includes(intensity) ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => toggleIntensity(intensity)}
                  className="capitalize"
                >
                  {intensity}
                </Button>
              ))}
            </div>
          </div>

          {/* Durée */}
          <div>
            <label className="text-sm font-medium mb-2 block">Durée (minutes)</label>
            <div className="flex gap-2 items-center">
              <Input
                type="number"
                placeholder="Min"
                value={filters.minDuration || ''}
                onChange={(e) => onFiltersChange({ ...filters, minDuration: e.target.value ? Number(e.target.value) : undefined })}
                className="w-24"
              />
              <span className="text-muted-foreground">à</span>
              <Input
                type="number"
                placeholder="Max"
                value={filters.maxDuration || ''}
                onChange={(e) => onFiltersChange({ ...filters, maxDuration: e.target.value ? Number(e.target.value) : undefined })}
                className="w-24"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
