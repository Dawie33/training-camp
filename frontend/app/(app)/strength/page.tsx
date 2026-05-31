'use client'

import { MUSCLE_LABELS, SESSION_GOAL_LABELS } from '@/services/strength'
import Link from 'next/link'
import { useState } from 'react'
import { useStrengthDashboard } from './_hooks/useStrengthDashboard'

export default function StrengthPage() {
  const { sessions, loading } = useStrengthDashboard()
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500 mb-3">Séances récentes</h2>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-violet-400" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl px-4 py-10 text-center">
              <p className="text-slate-500 mb-3 text-sm">Aucune séance enregistrée</p>
              <Link href="/strength/log" className="text-sm text-violet-400 hover:text-violet-300 underline underline-offset-2">
                Enregistrer ma première séance
              </Link>
            </div>
          ) : (
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
              {sessions.slice(0, 10).map((session, i) => {
                const date = new Date(session.session_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                const name = session.ai_plan?.session_name ?? 'Séance de force'
                const muscles = session.target_muscles.slice(0, 2)
                const count = Math.min(sessions.length, 10)
                return (
                  <div key={session.id}
                    className={`flex items-center justify-between px-4 py-3 hover:bg-slate-700/30 transition-colors ${i < count - 1 ? 'border-b border-slate-700/40' : ''}`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {date}
                        {muscles.length > 0 && ` · ${muscles.map(m => MUSCLE_LABELS[m as keyof typeof MUSCLE_LABELS] ?? m).join(', ')}`}
                      </p>
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      <p className="text-xs text-violet-400">{SESSION_GOAL_LABELS[session.session_goal]}</p>
                      {session.duration_minutes && (
                        <p className="text-xs text-slate-600">{session.duration_minutes} min</p>
                      )}
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
            <h2 className="font-semibold text-white">Coller un programme</h2>
            <textarea
              rows={6}
              placeholder="Ex: Back squat 5×5 @ 80%, Romanian deadlift 4×8..."
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 placeholder:text-slate-600 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setPasteOpen(false)} className="flex-1 py-2 border border-slate-700 text-slate-300 rounded-lg hover:bg-slate-800 transition-colors text-sm">
                Annuler
              </button>
              <Link
                href={`/strength/generate?context=${encodeURIComponent(pasteText)}`}
                className="flex-1 py-2 bg-violet-600 text-white font-medium rounded-lg hover:bg-violet-500 transition-colors text-sm text-center"
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
