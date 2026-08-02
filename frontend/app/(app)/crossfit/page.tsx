'use client'

import Link from 'next/link'
import { formatResult, useCrossfitDashboard } from './_hooks/useCrossfitDashboard'

export default function CrossFitPage() {
  const { sessions, loading } = useCrossfitDashboard()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="eyebrow">Séances récentes</span>
        <Link href="/tracking" className="text-xs text-primary hover:underline underline-offset-2">Voir tout →</Link>
      </div>
      <div className="rule" />

      {loading ? (
        <div className="flex justify-center py-10">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="bg-card border border-border rounded-lg px-4 py-10 text-center">
          <p className="text-muted-foreground mb-3 text-sm">Aucune séance enregistrée</p>
          <Link href="/crossfit/log-workout" className="text-sm text-primary hover:underline underline-offset-2">
            Enregistrer mon premier WOD
          </Link>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          {sessions.map((session, i) => {
            const date = session.completed_at
              ? new Date(session.completed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
              : '—'
            const name = session.workout_name ?? 'WOD sans nom'
            const score = formatResult(session.results)
            const rating = session.results?.rating
            return (
              <div key={session.id}
                className={`flex items-center justify-between px-4 py-3 hover:bg-secondary/60 transition-colors ${i < sessions.length - 1 ? 'border-b border-border' : ''}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{date}</p>
                </div>
                <div className="text-right ml-4 flex-shrink-0">
                  <p className="text-sm font-mono text-primary">{score}</p>
                  {rating && <p className="text-xs text-muted-foreground">{'★'.repeat(rating)}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
