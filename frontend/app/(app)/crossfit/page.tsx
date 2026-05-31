'use client'

import Link from 'next/link'
import { formatResult, useCrossfitDashboard } from './_hooks/useCrossfitDashboard'

export default function CrossFitPage() {
  const { sessions, loading } = useCrossfitDashboard()

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">Séances récentes</h2>
          <Link href="/tracking" className="text-xs text-orange-400 hover:text-orange-300 transition-colors">Voir tout →</Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-10">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-400" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-10 text-center">
            <p className="text-slate-500 mb-3 text-sm">Aucune séance enregistrée</p>
            <Link href="/crossfit/log-workout" className="text-sm text-orange-400 hover:text-orange-300 underline underline-offset-2">
              Enregistrer mon premier WOD
            </Link>
          </div>
        ) : (
          <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
            {sessions.map((session, i) => {
              const date = session.completed_at
                ? new Date(session.completed_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                : '—'
              const name = session.workout_name ?? 'WOD sans nom'
              const score = formatResult(session.results)
              const rating = session.results?.rating
              return (
                <div key={session.id}
                  className={`flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors ${i < sessions.length - 1 ? 'border-b border-slate-700/40' : ''}`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{name}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{date}</p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-sm font-mono text-orange-400">{score}</p>
                    {rating && <p className="text-xs text-slate-600">{'★'.repeat(rating)}</p>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
