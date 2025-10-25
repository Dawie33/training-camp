'use client'

import { Button } from '@/components/ui/button'
import { WorkoutCard } from '@/components/workout/WorkoutCard'
import { Workouts } from '@/lib/types/workout'
import { ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react'
import Link from 'next/link'

interface WorkoutGridProps {
  workouts: Workouts[]
  loading?: boolean
  currentPage: number
  totalPages: number
  totalWorkouts?: number
  onPageChange: (page: number) => void
  basePath?: string
}

/**
 * Grille d'affichage des workouts avec pagination
 * Affiche les workouts sous forme de grille responsive
 */
export function WorkoutGrid({
  workouts,
  loading = false,
  currentPage,
  totalPages,
  totalWorkouts = 0,
  onPageChange,
  basePath = '/workout',
}: WorkoutGridProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">Chargement des workouts...</p>
        </div>
      </div>
    )
  }

  if (workouts.length === 0) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center space-y-4 max-w-md animate-in fade-in duration-500">
          <div className="w-20 h-20 mx-auto rounded-full bg-muted flex items-center justify-center">
            <Dumbbell className="w-10 h-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <p className="text-xl font-semibold">Aucun workout trouvé</p>
            <p className="text-sm text-muted-foreground">
              Essayez de modifier vos filtres ou votre recherche pour découvrir plus de workouts
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Grille de workouts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {workouts.map((workout, index) => (
          <div
            key={workout.id}
            className="animate-in fade-in slide-in-from-bottom-4"
            style={{
              animationDelay: `${index * 50}ms`,
              animationFillMode: 'backwards',
            }}
          >
            <Link href={`${basePath}/${workout.id}`}>

              <WorkoutCard workout={workout} />
            </Link>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
              // Afficher les 3 premières pages, les 3 dernières pages, et les pages autour de la page courante
              const showPage =
                page === 1 ||
                page === totalPages ||
                (page >= currentPage - 1 && page <= currentPage + 1)

              if (!showPage) {
                // Afficher "..." entre les groupes de pages
                if (page === 2 || page === totalPages - 1) {
                  return (
                    <span key={page} className="px-2 text-muted-foreground">
                      ...
                    </span>
                  )
                }
                return null
              }

              return (
                <Button
                  key={page}
                  variant={currentPage === page ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => onPageChange(page)}
                  className="w-10 h-10"
                >
                  {page}
                </Button>
              )
            })}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Info pagination */}
      {totalWorkouts > 0 && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Affichage de {((currentPage - 1) * workouts.length) + 1} à {((currentPage - 1) * workouts.length) + workouts.length} sur {totalWorkouts} workout{totalWorkouts > 1 ? 's' : ''}
          </p>
        </div>
      )}
    </div>
  )
}
