'use client'

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
import { workoutsService } from '@/services'
import { Workouts } from '@/domain/entities/workout'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { motion } from 'framer-motion'
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

  const pageCount = Math.ceil(totalWorkouts / ITEMS_PER_PAGE)

  const getDifficultyStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-primary/20 text-primary border-primary/30'
      case 'intermediate':
        return 'bg-secondary text-foreground border-border'
      case 'advanced':
        return 'bg-destructive/20 text-destructive border-destructive/30'
      default:
        return 'bg-card text-foreground border-border'
    }
  }

  return (
    <motion.div
      className="min-h-screen bg-background text-foreground"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Back Button */}
        <motion.div variants={fadeInUp}>
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            Retour au dashboard
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="font-display text-4xl sm:text-6xl font-semibold">
              <span className="text-foreground">Mes Workouts Personnalisés</span>
            </h1>
            <p className="text-muted-foreground mt-1">Total: {totalWorkouts}</p>
          </div>
        </motion.div>

        {/* Filters & Controls */}
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              aria-label="Rechercher un workout"
              placeholder="Rechercher un workout..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-border"
            />
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(0, prev - 1))}
              disabled={currentPage === 0}
              className="bg-card border-border text-foreground hover:bg-card disabled:opacity-50"
            >
              Précédent
            </Button>
            <div className="text-sm font-medium text-foreground">
              Page {currentPage + 1} sur {pageCount || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.min(pageCount - 1, prev + 1))}
              disabled={currentPage >= pageCount - 1}
              className="bg-card border-border text-foreground hover:bg-card disabled:opacity-50"
            >
              Suivant
            </Button>
          </div>
        </motion.div>

        {/* Vue Desktop - Table */}
        <motion.div variants={fadeInUp} className="hidden md:block rounded-lg border border-border bg-card backdrop-blur-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="border-border hover:bg-card">
                <TableHead className="text-foreground">Nom</TableHead>
                <TableHead className="text-foreground">Difficulté</TableHead>
                <TableHead className="text-foreground">Intensité</TableHead>
                <TableHead className="text-foreground">Durée</TableHead>
                <TableHead className="text-right text-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-border">
                  <TableCell colSpan={5} className="h-24 text-center">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : workouts.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                    Aucun workout trouvé
                  </TableCell>
                </TableRow>
              ) : (
                workouts.map((workout) => (
                  <TableRow
                    key={workout.id}
                    className="cursor-pointer border-border hover:bg-card transition-colors"
                    onClick={() => {
                      window.location.href = `/personalized-workout/${workout.id}`
                    }}
                  >
                    <TableCell className="font-medium text-foreground">{workout.name}</TableCell>
                    <TableCell>
                      <Badge className={`${getDifficultyStyle(workout.difficulty)} border`}>
                        {workout.difficulty}
                      </Badge>
                    </TableCell>
                    <TableCell className="capitalize text-foreground">{workout.intensity}</TableCell>
                    <TableCell className="text-foreground">{workout.estimated_duration || 'N/A'} min</TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex justify-end gap-2">
                        <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-card">
                          <Link href={`/personalized-workout/${workout.id}`} aria-label={`Voir ${workout.name}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Supprimer ${workout.name}`}
                          onClick={() => handleDelete(workout.id, workout.name)}
                          className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
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
        </motion.div>

        {/* Vue Mobile - Cards */}
        <motion.div variants={fadeInUp} className="md:hidden space-y-3">
          {loading ? (
            <div className="bg-card backdrop-blur-xl border border-border rounded-lg p-6 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            </div>
          ) : workouts.length === 0 ? (
            <div className="bg-card backdrop-blur-xl border border-border rounded-lg p-6 text-center text-muted-foreground">
              Aucun workout trouvé
            </div>
          ) : (
            workouts.map((workout) => (
              <motion.div
                key={workout.id}
                className="bg-card backdrop-blur-xl border border-border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-card transition-all"
                onClick={() => {
                  window.location.href = `/personalized-workout/${workout.id}`
                }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {/* Header avec nom et actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm text-foreground line-clamp-1">{workout.name}</h3>
                  </div>
                  <div
                    className="flex gap-1 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-card">
                      <Link href={`/personalized-workout/${workout.id}`} aria-label={`Voir ${workout.name}`}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={`Supprimer ${workout.name}`}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      onClick={() => handleDelete(workout.id, workout.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Difficulté</p>
                    <Badge className={`text-xs ${getDifficultyStyle(workout.difficulty)} border`}>
                      {workout.difficulty}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Intensité</p>
                    <p className="text-sm font-medium capitalize text-foreground">{workout.intensity || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Durée</p>
                    <p className="text-sm font-medium text-foreground">{workout.estimated_duration || 'N/A'} min</p>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function PersonalizedWorkoutsPage() {
  return     <PersonalizedWorkoutsContent />
}
