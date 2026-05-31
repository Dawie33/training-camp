'use client'

import { formatTime, HYROX_SESSION_TYPE_LABELS } from '@/services/hyrox'
import Link from 'next/link'
import { useState } from 'react'
import { useHyroxDashboard } from './_hooks/useHyroxDashboard'

export default function HyroxPage() {
  const { sessions, loading } = useHyroxDashboard()
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Séances récentes</h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-10 text-center">
              <p className="text-slate-500 mb-3 text-sm">Aucune séance HYROX pour l&apos;instant</p>
              <Link href="/hyrox/generate" className="text-sm text-yellow-400 hover:text-yellow-300 underline underline-offset-2">
                Générer avec l&apos;IA
              </Link>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
              {sessions.slice(0, 10).map((session, i) => {
                const date = new Date(session.session_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                const name = session.ai_plan?.name ?? HYROX_SESSION_TYPE_LABELS[session.session_type]
                const totalTime = session.total_time_seconds ? formatTime(session.total_time_seconds) : null
                const count = Math.min(sessions.length, 10)
                return (
                  <div key={session.id}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors ${i < count - 1 ? 'border-b border-slate-700/40' : ''}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{date}</p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      {totalTime
                        ? <p className="text-sm font-mono text-yellow-400">{totalTime}</p>
                        : <p className="text-xs text-slate-600">—</p>
                      }
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
            <h2 className="font-semibold text-white">Coller un entraînement</h2>
            <textarea
              rows={6}
              placeholder="Ex: 1km run + SkiErg 1000m + 1km run + Sled Push 50m..."
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-yellow-500 placeholder:text-slate-600 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setPasteOpen(false)} className="flex-1 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors text-sm">
                Annuler
              </button>
              <Link
                href={`/hyrox/generate?context=${encodeURIComponent(pasteText)}`}
                className="flex-1 py-2 bg-yellow-500 text-slate-900 font-medium rounded-lg hover:bg-yellow-400 transition-colors text-sm text-center"
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
