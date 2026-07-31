'use client'

import { cn } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { WorkoutSession } from '@/domain/entities/workout'
import { sessionService, type WodAnalysis } from '@/services/sessions'
import { PostWodAnalysisModal } from '@/components/workout/PostWodAnalysisModal'
import { Brain, ClipboardList, Dumbbell, Timer, X } from 'lucide-react'

interface WorkoutHistoryListProps {
  limit?: number
}

export function WorkoutHistoryList({ limit = 10 }: WorkoutHistoryListProps) {
  const [workoutSessions, setWorkoutSessions] = useState<WorkoutSession[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedSession, setSelectedSession] = useState<WorkoutSession | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [page, setPage] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [analysisOpen, setAnalysisOpen] = useState(false)
  const [analysis, setAnalysis] = useState<WodAnalysis | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [analysisWorkoutName, setAnalysisWorkoutName] = useState('')
  const [analysisSessionId, setAnalysisSessionId] = useState<string | null>(null)

  const totalPages = Math.ceil(totalCount / limit)

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

  const filteredSessions = workoutSessions

  const handleDelete = async (id: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette session ?')) return

    try {
      setDeletingId(id)
      await sessionService.deleteSession(id)
      toast.success('Session supprimée')
      setWorkoutSessions(workoutSessions.filter(s => s.id !== id))
      setTotalCount(prev => prev - 1)
    } catch (error) {
      toast.error('Erreur lors de la suppression')
      console.error(error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleAnalyze = async (session: WorkoutSession) => {
    setAnalysisWorkoutName(session.workout_name ?? 'WOD')
    setAnalysisSessionId(session.id)
    setAnalysis(null)
    setAnalysisOpen(true)
    setAnalysisLoading(true)
    try {
      const result = await sessionService.analyzeSession(session.id)
      setAnalysis(result)
    } catch {
      toast.error("Impossible de générer l'analyse")
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handleRegenerate = async () => {
    if (!analysisSessionId) return
    setAnalysis(null)
    setAnalysisLoading(true)
    try {
      const result = await sessionService.analyzeSession(analysisSessionId, true)
      setAnalysis(result)
    } catch {
      toast.error("Impossible de régénérer l'analyse")
    } finally {
      setAnalysisLoading(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    if (hours > 0) return `${hours}h ${minutes}m`
    if (minutes > 0) return `${minutes}m ${secs}s`
    return `${secs}s`
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return "Aujourd'hui"
    if (date.toDateString() === yesterday.toDateString()) return 'Hier'

    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center gap-0.5">
        {[...Array(5)].map((_, i) => (
          <span
            key={i}
            className={cn(
              'text-sm',
              i < rating ? 'text-amber-500' : 'text-border'
            )}
          >
            ★
          </span>
        ))}
      </div>
    )
  }

  return (
    <>
      {/* Vue Desktop - Table */}
      <div className="hidden md:block rounded-lg overflow-hidden border border-border">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-secondary">
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Date</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Statut</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Durée</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Blocs</th>
              <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Note</th>
              <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-orange-600/15 animate-pulse" />
                    <p className="text-sm text-muted-foreground">Chargement...</p>
                  </div>
                </td>
              </tr>
            ) : filteredSessions.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-32 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <Dumbbell className="w-6 h-6 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Aucune session trouvée</p>
                  </div>
                </td>
              </tr>
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
                  <tr key={session.id} className="border-b border-border hover:bg-secondary/60 transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-foreground">{session.workout_name ?? '—'}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(session.started_at)}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        isCompleted
                          ? 'bg-emerald-600/10 text-emerald-600'
                          : 'bg-secondary text-muted-foreground border border-border'
                      )}>
                        {isCompleted ? 'Complété' : 'En cours'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-foreground">
                      {isCompleted ? formatDuration(duration) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-3">
                      {totalBlocks > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-foreground">{completedBlocks}/{totalBlocks}</span>
                          <div className="w-16 h-1.5 bg-border rounded-full overflow-hidden">
                            <div
                              className="h-full bg-orange-600 transition-all"
                              style={{ width: `${(completedBlocks / totalBlocks) * 100}%` }}
                            />
                          </div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {isCompleted && rating > 0 ? renderStars(rating) : <span className="text-muted-foreground">-</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          className="px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                          onClick={() => setSelectedSession(session)}
                        >
                          Voir
                        </button>
                        {isCompleted && (
                          <button
                            className="px-2 py-1 rounded-lg text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-600/10 transition-colors flex items-center gap-1"
                            onClick={() => handleAnalyze(session)}
                          >
                            <Brain className="w-3 h-3" />
                            IA
                          </button>
                        )}
                        <button
                          className="px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          onClick={() => handleDelete(session.id)}
                          disabled={deletingId === session.id}
                        >
                          {deletingId === session.id ? '...' : 'Suppr.'}
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Vue Mobile - Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <div className="w-8 h-8 rounded-lg bg-orange-600/15 animate-pulse" />
            <p className="text-sm text-muted-foreground">Chargement...</p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12">
            <Dumbbell className="w-6 h-6 text-muted-foreground" />
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
                className="bg-card border border-border rounded-lg p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        isCompleted
                          ? 'bg-emerald-600/10 text-emerald-600'
                          : 'bg-secondary text-muted-foreground border border-border'
                      )}>
                        {isCompleted ? 'Complété' : 'En cours'}
                      </span>
                    </div>
                    <p className="text-sm font-medium mt-1 text-foreground">
                      {session.workout_name ?? '—'}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(session.started_at)}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      className="px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                      onClick={() => setSelectedSession(session)}
                    >
                      Voir
                    </button>
                    {isCompleted && (
                      <button
                        className="px-2 py-1 rounded-lg text-xs text-purple-600 hover:text-purple-700 hover:bg-purple-600/10 transition-colors flex items-center gap-1"
                        onClick={() => handleAnalyze(session)}
                      >
                        <Brain className="w-3 h-3" />
                        IA
                      </button>
                    )}
                    <button
                      className="px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => handleDelete(session.id)}
                      disabled={deletingId === session.id}
                    >
                      {deletingId === session.id ? '...' : 'Suppr.'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {isCompleted && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Timer className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{formatDuration(duration)}</span>
                    </div>
                  )}
                  {totalBlocks > 0 && (
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <ClipboardList className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{completedBlocks}/{totalBlocks}</span>
                    </div>
                  )}
                </div>

                {totalBlocks > 0 && (
                  <div className="w-full h-2 bg-border rounded-full overflow-hidden">
                    <div
                      className="h-full bg-orange-600 transition-all"
                      style={{ width: `${(completedBlocks / totalBlocks) * 100}%` }}
                    />
                  </div>
                )}

                {isCompleted && rating > 0 && renderStars(rating)}
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-muted-foreground">
          {totalCount > 0 ? (
            <>Affichage de {page * limit + 1} à {Math.min((page + 1) * limit, totalCount)} sur {totalCount} sessions</>
          ) : (
            <>Aucune session</>
          )}
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <button
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              ← Précédent
            </button>
            <div className="text-sm text-muted-foreground px-2">
              Page {page + 1} / {totalPages}
            </div>
            <button
              className="px-3 py-1.5 rounded-lg text-sm font-medium border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page === totalPages - 1}
            >
              Suivant →
            </button>
          </div>
        )}
      </div>

      <PostWodAnalysisModal
        open={analysisOpen}
        onOpenChange={setAnalysisOpen}
        analysis={analysis}
        loading={analysisLoading}
        workoutName={analysisWorkoutName}
        onRegenerate={handleRegenerate}
      />

      {/* Dialog détails */}
      {selectedSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSelectedSession(null)}>
          <div
            className="bg-card border border-border rounded-lg shadow-2xl w-full max-w-2xl mx-4 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h3 className="font-display text-lg font-semibold">Détails de la session</h3>
              <button
                onClick={() => setSelectedSession(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Date de début</h4>
                  <p className="text-sm text-foreground">{new Date(selectedSession.started_at).toLocaleString('fr-FR')}</p>
                </div>
                {selectedSession.completed_at && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Date de fin</h4>
                    <p className="text-sm text-foreground">{new Date(selectedSession.completed_at).toLocaleString('fr-FR')}</p>
                  </div>
                )}
              </div>

              {selectedSession.notes && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Notes</h4>
                  <p className="text-sm text-foreground bg-secondary border border-border p-3 rounded-lg">
                    {selectedSession.notes}
                  </p>
                </div>
              )}

              {selectedSession.results?.metrics && Object.keys(selectedSession.results.metrics).length > 0 && (
                <div>
                  <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Métriques</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedSession.results.metrics.calories && (
                      <div className="text-sm bg-secondary border border-border rounded-lg p-3">
                        <span className="text-muted-foreground">Calories:</span>{' '}
                        <span className="font-medium text-foreground">{selectedSession.results.metrics.calories}</span>
                      </div>
                    )}
                    {selectedSession.results.metrics.avg_heart_rate && (
                      <div className="text-sm bg-secondary border border-border rounded-lg p-3">
                        <span className="text-muted-foreground">FC Moy:</span>{' '}
                        <span className="font-medium text-foreground">{selectedSession.results.metrics.avg_heart_rate} bpm</span>
                      </div>
                    )}
                    {selectedSession.results.metrics.max_heart_rate && (
                      <div className="text-sm bg-secondary border border-border rounded-lg p-3">
                        <span className="text-muted-foreground">FC Max:</span>{' '}
                        <span className="font-medium text-foreground">{selectedSession.results.metrics.max_heart_rate} bpm</span>
                      </div>
                    )}
                    {selectedSession.results.metrics.perceived_effort && (
                      <div className="text-sm bg-secondary border border-border rounded-lg p-3">
                        <span className="text-muted-foreground">Effort perçu:</span>{' '}
                        <span className="font-medium text-foreground">{selectedSession.results.metrics.perceived_effort}/10</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                {selectedSession.results?.rating && selectedSession.results.rating > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Note</h4>
                    {renderStars(selectedSession.results.rating)}
                  </div>
                )}
                {selectedSession.results?.block_progress && Object.keys(selectedSession.results.block_progress).length > 0 && (
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">Progression</h4>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-600 transition-all"
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
          </div>
        </div>
      )}
    </>
  )
}
