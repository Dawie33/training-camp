'use client'

import { formatDuration, formatPace, RUN_TYPE_LABELS } from '@/services/running'
import Link from 'next/link'
import { useState } from 'react'
import { useRunningDashboard } from './_hooks/useRunningDashboard'

export default function RunningPage() {
  const { sessions, loading } = useRunningDashboard()
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Sorties récentes</h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-cyan-400" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-10 text-center">
              <p className="text-slate-500 mb-3 text-sm">Aucune sortie enregistrée</p>
              <Link href="/running/log" className="text-sm text-cyan-400 hover:text-cyan-300 underline underline-offset-2">
                Enregistrer ma première sortie
              </Link>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
              {sessions.slice(0, 10).map((session, i) => {
                const date = new Date(session.session_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                const name = session.ai_plan?.name ?? RUN_TYPE_LABELS[session.run_type]
                const duration = formatDuration(session.duration_seconds)
                const pace = formatPace(session.avg_pace_seconds_per_km)
                const count = Math.min(sessions.length, 10)
                return (
                  <div key={session.id}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors ${i < count - 1 ? 'border-b border-slate-700/40' : ''}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {date}
                        {session.distance_km && ` · ${Number(session.distance_km).toFixed(1)} km`}
                      </p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-sm font-mono text-cyan-400">{duration}</p>
                      {pace !== '--' && <p className="text-xs text-slate-500">{pace}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {pasteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPasteOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-5 space-y-4">
            <h2 className="font-semibold text-white">Coller un plan</h2>
            <textarea
              rows={6}
              placeholder="Ex: 2km échauffement + 6×800m @ allure 5'/km + 2km retour au calme..."
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setPasteOpen(false)} className="flex-1 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors text-sm">
                Annuler
              </button>
              <Link
                href={`/running/generate?context=${encodeURIComponent(pasteText)}`}
                className="flex-1 py-2 bg-cyan-600 text-white font-medium rounded-lg hover:bg-cyan-500 transition-colors text-sm text-center"
                onClick={() => setPasteOpen(false)}
              >
                Analyser avec l&apos;IA
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
