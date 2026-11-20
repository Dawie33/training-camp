'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { exercisesApi } from '@/services/exercises'
import type { Exercise } from '@/domain/entities/exercise'
import { Search, Plus, Dumbbell } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ExercisesSidebarProps {
  isOpen: boolean
  onClose: () => void
  onAddExercise: (exercise: Exercise) => void
}

const CATEGORY_LABELS: Record<string, string> = {
  strength: 'Force',
  cardio: 'Cardio',
  gymnastics: 'Gymnastique',
  olympic_lifting: 'Haltérophilie',
  powerlifting: 'Powerlifting',
  endurance: 'Endurance',
  mobility: 'Mobilité',
}

const CATEGORY_COLORS: Record<string, string> = {
  strength: 'bg-primary text-primary-foreground border-primary',
  cardio: 'bg-destructive/10 text-destructive border-destructive/30',
  gymnastics: 'bg-primary text-primary-foreground border-primary',
  olympic_lifting: 'bg-secondary text-foreground border-border',
  powerlifting: 'bg-primary text-primary-foreground border-primary',
  endurance: 'bg-primary text-primary-foreground border-primary',
  mobility: 'bg-primary text-primary-foreground border-primary',
}

/**
 * Panneau latéral listant les exercices du référentiel (recherche + filtre par
 * catégorie) pour les ajouter à la section active du `BlocksEditor`.
 */
export function ExercisesSidebar({ isOpen, onClose, onAddExercise }: ExercisesSidebarProps) {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true)
        const { rows } = await exercisesApi.getAll({ limit: 500 })
        setExercises(rows)
      } catch (error) {
        console.error('Error fetching exercises:', error)
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchExercises()
    }
  }, [isOpen])

  // Filter exercises
  const filteredExercises = exercises.filter((exercise) => {
    const matchesSearch = exercise.name.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || exercise.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  // Group by category
  const categories = Array.from(new Set(exercises.map((e) => e.category)))

  if (!isOpen) return null

  return (
    <Sheet open={isOpen} onOpenChange={open => { if (!open) onClose() }}>
      <SheetContent aria-describedby={undefined} className="w-full max-w-sm gap-0">
        {/* Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <SheetTitle className="font-display text-2xl font-semibold flex items-center gap-2">
              <Dumbbell className="h-5 w-5" />
              Exercices
            </SheetTitle>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Rechercher un exercice"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un exercice..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Category filter */}
        <div className="p-4 border-b">
          <div className="flex flex-wrap gap-2">
            <Button variant="ghost"
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-background border-border hover:bg-muted'
              }`}
            >
              Tous ({exercises.length})
            </Button>
            {categories.map((category) => (
              <Button variant="ghost"
                type="button"
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-3 py-1 text-xs rounded-full border transition-colors ${
                  selectedCategory === category
                    ? CATEGORY_COLORS[category] || 'bg-primary text-primary-foreground'
                    : 'bg-background border-border hover:bg-muted'
                }`}
              >
                {CATEGORY_LABELS[category] || category}
              </Button>
            ))}
          </div>
        </div>

        {/* Exercises list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement des exercices...
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun exercice trouvé
            </div>
          ) : (
            filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="group p-3 border rounded-lg hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer"
                onClick={() => onAddExercise(exercise)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm mb-1 truncate">
                      {exercise.name}
                    </h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`inline-block px-2 py-0.5 text-xs rounded-full border ${
                          CATEGORY_COLORS[exercise.category] || 'bg-card text-muted-foreground'
                        }`}
                      >
                        {CATEGORY_LABELS[exercise.category] || exercise.category}
                      </span>
                      {exercise.difficulty && (
                        <span className="text-xs text-muted-foreground">
                          {exercise.difficulty}
                        </span>
                      )}
                      {exercise.bodyweight_only && (
                        <span className="text-xs text-muted-foreground">
                          Sans équipement
                        </span>
                      )}
                    </div>
                    {exercise.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {exercise.description}
                      </p>
                    )}
                  </div>
                  <Button
                    aria-label={`Ajouter ${exercise.name}`}
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      onAddExercise(exercise)
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="p-4 border-t bg-muted/50">
          <p className="text-xs text-muted-foreground text-center">
            Cliquez sur un exercice pour l'ajouter à la section active
          </p>
        </div>
      </SheetContent>
    </Sheet>
  )
}
