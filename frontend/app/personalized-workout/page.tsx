'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { workoutsService } from '@/lib/api'
import { Workouts } from '@/lib/types/workout'
import { ArrowLeft, Eye, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

const ITEMS_PER_PAGE = 10

function PersonalizedWorkoutsContent() {
  const [workouts, setWorkouts] = useState<Workouts[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(0)
  const [totalWorkouts, setTotalWorkouts] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setCurrentPage(0)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  useEffect(() => {
    const fetchPersonalizedWorkouts = async () => {
      try {
        setLoading(true)
        const offset = currentPage * ITEMS_PER_PAGE

        const response = await workoutsService.getPersonalizedWorkouts(
          ITEMS_PER_PAGE,
          offset,
          debouncedSearch || undefined
        )

        // Parser les workouts depuis plan_json
        const parsedWorkouts = response.rows.map((workout) => {
          const parsedWorkout = typeof workout.plan_json === 'string'
            ? JSON.parse(workout.plan_json)
            : workout.plan_json
          return {
            ...parsedWorkout,
            id: workout.id,
          }
        })

        setWorkouts(parsedWorkouts)
        setTotalWorkouts(response.count)
      } catch (error) {
        toast.error(`Erreur lors du chargement des workouts personnalisés: ${error}`)
      } finally {
        setLoading(false)
      }
    }

    fetchPersonalizedWorkouts()
  }, [currentPage, debouncedSearch])

  const handleDelete = async (id: string, name?: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le workout "${name || 'ce workout'}" ?`)) {
      return
    }

    try {
      await workoutsService.deletePersonalizedWorkout(id)
      toast.success('Workout supprimé avec succès')

      // Rafraîchir la liste
      const offset = currentPage * ITEMS_PER_PAGE
      const response = await workoutsService.getPersonalizedWorkouts(
        ITEMS_PER_PAGE,
        offset,
        debouncedSearch || undefined
      )

      const parsedWorkouts = response.rows.map((workout) => {
        const parsedWorkout = typeof workout.plan_json === 'string'
          ? JSON.parse(workout.plan_json)
          : workout.plan_json
        return {
          ...parsedWorkout,
          id: workout.id,
        }
      })

      setWorkouts(parsedWorkouts)
      setTotalWorkouts(response.count)
    } catch (error) {
      toast.error(`Erreur lors de la suppression: ${error}`)
    }
  }

  const getDifficultyVariant = (difficulty: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (difficulty) {
      case 'beginner':
        return 'default'
      case 'intermediate':
        return 'secondary'
      case 'advanced':
        return 'destructive'
      default:
        return 'outline'
    }
  }

  const pageCount = Math.ceil(totalWorkouts / ITEMS_PER_PAGE)

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Back Button */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
        Retour au dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Mes Workouts Personnalisés</h1>
          <p className="text-muted-foreground">Total: {totalWorkouts}</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un workout..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
            disabled={currentPage === 0}
          >
            Précédent
          </Button>
          <div className="text-sm font-medium">
            Page {currentPage + 1} sur {pageCount || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.min(pageCount - 1, prev + 1))}
            disabled={currentPage >= pageCount - 1}
          >
            Suivant
          </Button>
        </div>
      </div>

      {/* Vue Desktop - Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nom</TableHead>
              <TableHead>Difficulté</TableHead>
              <TableHead>Intensité</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center">
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : workouts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                  Aucun workout trouvé
                </TableCell>
              </TableRow>
            ) : (
              workouts.map((workout) => (
                <TableRow
                  key={workout.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    window.location.href = `/personalized-workout/${workout.id}`
                  }}
                >
                  <TableCell className="font-medium">{workout.name}</TableCell>
                  <TableCell>
                    <Badge variant={getDifficultyVariant(workout.difficulty)}>
                      {workout.difficulty}
                    </Badge>
                  </TableCell>
                  <TableCell className="capitalize">{workout.intensity}</TableCell>
                  <TableCell>{workout.estimated_duration || 'N/A'} min</TableCell>
                  <TableCell
                    className="text-right"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex justify-end gap-2">
                      <Link href={`/personalized-workout/${workout.id}`}>
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(workout.id, workout.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Vue Mobile - Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="bg-card border rounded-lg p-6 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        ) : workouts.length === 0 ? (
          <div className="bg-card border rounded-lg p-6 text-center text-muted-foreground">
            Aucun workout trouvé
          </div>
        ) : (
          workouts.map((workout) => {
            const difficultyColors = {
              beginner: "bg-green-50 text-green-700 border-green-200",
              intermediate: "bg-yellow-50 text-yellow-700 border-yellow-200",
              advanced: "bg-red-50 text-red-700 border-red-200",
            }

            return (
              <div
                key={workout.id}
                className="bg-card border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  window.location.href = `/personalized-workout/${workout.id}`
                }}
              >
                {/* Header avec nom et actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-1">{workout.name}</h3>
                  </div>
                  <div
                    className="flex gap-1 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={`/personalized-workout/${workout.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(workout.id, workout.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Difficulté</p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${difficultyColors[workout.difficulty as keyof typeof difficultyColors] || ''}`}
                    >
                      {workout.difficulty}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Intensité</p>
                    <p className="text-sm font-medium capitalize">{workout.intensity || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Durée</p>
                    <p className="text-sm font-medium">{workout.estimated_duration || 'N/A'} min</p>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default function PersonalizedWorkoutsPage() {
  return (
    <ProtectedRoute>
      <PersonalizedWorkoutsContent />
    </ProtectedRoute>
  )
}
