'use client'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  Clock,
  Dumbbell,
  Eye,
  Star,
  Trash2
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { WorkoutSession } from '@/domain/entities/workout'
import { sessionService } from '@/services/sessions'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface WorkoutHistoryListProps {
  sportId?: string
  limit?: number
}

export function WorkoutHistoryList({ sportId, limit = 10 }: WorkoutHistoryListProps) {
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)

  const totalPages = Math.ceil(totalCount / limit)

  // Charger les sessions avec pagination
  useEffect(() => {
    const loadSessions = async () => {
      try {
        setLoading(true)
        const result = await sessionService.getAll({ limit, offset: page * limit })
        setWorkoutSessions(result.rows)
        setTotalCount(result.count)
      } catch (error) {
        toast.error('Erreur lors du chargement des sessions')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }
    loadSessions()
  }, [page, limit])

  // Filtrer les sessions selon sportId si nécessaire
  const filteredSessions = workoutSessions
    .filter(session => !sportId || session.workout_id === sportId)

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) {
      return
    }

    try {
      setDeletingId(id)
      await sessionService.deleteSession(id)
      toast.success('Session supprimée')

      // Mettre à jour la liste en retirant la session supprimée
      setWorkoutSessions(workoutSessions.filter(s => s.id !== id))
      setTotalCount(prev => prev - 1)
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      console.error(error)
    } finally {
      setDeletingId(null)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return "Aujourd'hui"
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Hier'
    }

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <>
      {/* Vue Desktop - Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Durée</TableHead>
              <TableHead>Exercices</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Dumbbell className="w-8 h-8 text-muted-foreground animate-pulse" />
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : filteredSessions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Dumbbell className="w-8 h-8 text-muted-foreground opacity-50" />
                    <p className="text-sm text-muted-foreground">Aucune session trouvée</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredSessions.map((session) => {
              const isCompleted = !!session.completed_at
              const duration = isCompleted
                ? Math.floor((new Date(session.completed_at!).getTime() - new Date(session.started_at).getTime()) / 1000)
                : 0

              const rating = session.results?.rating || 0
              const blockProgress = session.results?.block_progress || {}
              const completedBlocks = Object.values(blockProgress).filter(Boolean).length
              const totalBlocks = Object.keys(blockProgress).length

              return (
                <TableRow key={session.id}>
                  <TableCell className="font-medium">
                    {formatDate(session.started_at)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={isCompleted ? "default" : "outline"}
                      className="text-xs"
                    >
                      {isCompleted ? "Complété" : "En cours"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {isCompleted ? (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        {formatDuration(duration)}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {totalBlocks > 0 ? (
                      <div className="flex items-center gap-2">
                        <Dumbbell className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {completedBlocks}/{totalBlocks}
                        </span>
                        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${(completedBlocks / totalBlocks) * 100}%` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {isCompleted && rating > 0 ? (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-3.5 h-3.5',
                              i < rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
                            )}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setSelectedSession(session)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDelete(session.id)}
                        disabled={deletingId === session.id}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )
            })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Vue Mobile - Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Dumbbell className="w-8 h-8 text-muted-foreground animate-pulse" />
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Dumbbell className="w-8 h-8 text-muted-foreground opacity-50" />
            <p className="text-sm text-muted-foreground">Aucune session trouvée</p>
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isCompleted = !!session.completed_at
            const duration = isCompleted
              ? Math.floor((new Date(session.completed_at!).getTime() - new Date(session.started_at).getTime()) / 1000)
              : 0

            const rating = session.results?.rating || 0
            const blockProgress = session.results?.block_progress || {}
            const completedBlocks = Object.values(blockProgress).filter(Boolean).length
            const totalBlocks = Object.keys(blockProgress).length

            return (
              <div
                key={session.id}
                className="bg-card border rounded-lg p-4 space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={isCompleted ? "default" : "outline"}
                        className="text-xs"
                      >
                        {isCompleted ? "Complété" : "En cours"}
                      </Badge>
                    </div>
                    <p className="text-sm font-medium mt-1">
                      {formatDate(session.started_at)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setSelectedSession(session)}
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => handleDelete(session.id)}
                      disabled={deletingId === session.id}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-3">
                  {/* Duration */}
                  {isCompleted && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{formatDuration(duration)}</span>
                    </div>
                  )}

                  {/* Exercises Progress */}
                  {totalBlocks > 0 && (
                    <div className="flex items-center gap-2 text-sm">
                      <Dumbbell className="w-4 h-4 text-muted-foreground" />
                      <span>{completedBlocks}/{totalBlocks}</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {totalBlocks > 0 && (
                  <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(completedBlocks / totalBlocks) * 100}%` }}
                    />
                  </div>
                )}

                {/* Rating */}
                {isCompleted && rating > 0 && (
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          'w-4 h-4',
                          i < rating ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
                        )}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          {totalCount > 0 ? (
            <>
              Affichage de {page * limit + 1} à {Math.min((page + 1) * limit, totalCount)} sur {totalCount} sessions
            </>
          ) : (
            <>Aucune session</>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Précédent
            </Button>
            <div className="text-sm text-muted-foreground px-2">
              Page {page + 1} / {totalPages}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        )}
      </div>

      {/* Dialog pour les détails */}
      <Dialog open={!!selectedSession} onOpenChange={() => setSelectedSession(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails de la session</DialogTitle>
          </DialogHeader>
          {selectedSession && (
            <div className="space-y-4">
              {/* Informations générales */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-1">Date de début</h4>
                  <p className="text-sm">{new Date(selectedSession.started_at).toLocaleString('fr-FR')}</p>
                </div>
                {selectedSession.completed_at && (
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-1">Date de fin</h4>
                    <p className="text-sm">{new Date(selectedSession.completed_at).toLocaleString('fr-FR')}</p>
                  </div>
                )}
              </div>

              {/* Notes */}
              {selectedSession.notes && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Notes</h4>
                  <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {selectedSession.notes}
                  </p>
                </div>
              )}

              {/* Métriques */}
              {selectedSession.results?.metrics && Object.keys(selectedSession.results.metrics).length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">Métriques</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSession.results.metrics.calories && (
                      <div className="text-sm bg-muted rounded p-3">
                        <span className="text-muted-foreground">Calories:</span>{' '}
                        <span className="font-medium">{selectedSession.results.metrics.calories}</span>
                      </div>
                    )}
                    {selectedSession.results.metrics.avg_heart_rate && (
                      <div className="text-sm bg-muted rounded p-3">
                        <span className="text-muted-foreground">FC Moy:</span>{' '}
                        <span className="font-medium">{selectedSession.results.metrics.avg_heart_rate} bpm</span>
                      </div>
                    )}
                    {selectedSession.results.metrics.max_heart_rate && (
                      <div className="text-sm bg-muted rounded p-3">
                        <span className="text-muted-foreground">FC Max:</span>{' '}
                        <span className="font-medium">{selectedSession.results.metrics.max_heart_rate} bpm</span>
                      </div>
                    )}
                    {selectedSession.results.metrics.perceived_effort && (
                      <div className="text-sm bg-muted rounded p-3">
                        <span className="text-muted-foreground">Effort perçu:</span>{' '}
                        <span className="font-medium">{selectedSession.results.metrics.perceived_effort}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Note et progression */}
              <div className="grid grid-cols-2 gap-4">
                {selectedSession.results?.rating && selectedSession.results.rating > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Note</h4>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={cn(
                            'w-5 h-5',
                            i < selectedSession.results!.rating! ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'
                          )}
                        />
                      ))}
                    </div>
                  </div>
                )}
                {selectedSession.results?.block_progress && Object.keys(selectedSession.results.block_progress).length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Progression</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{
                            width: `${(Object.values(selectedSession.results.block_progress).filter(Boolean).length /
                              Object.keys(selectedSession.results.block_progress).length) * 100}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {Object.values(selectedSession.results.block_progress).filter(Boolean).length}/
                        {Object.keys(selectedSession.results.block_progress).length}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}
