'use client'

import { fadeInUp, staggerContainer } from '@/lib/animations'
import { formatDuration, formatPace, RUN_TYPE_LABELS } from '@/services/running'
import { motion } from 'framer-motion'
import { Activity, BookOpen, Clipboard, PenLine, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useRunningDashboard } from './_hooks/useRunningDashboard'

export default function RunningPage() {
  const { sessions, loading } = useRunningDashboard()
  const [pasteOpen, setPasteOpen] = useState(false)
  const [pasteText, setPasteText] = useState('')

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
      initial="hidden" animate="visible" variants={staggerContainer}
    >
      <div className="p-4 sm:p-6 lg:p-8 space-y-8">

        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Running</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Suivi de tes sorties et génération de séances IA</p>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div variants={fadeInUp}>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-3">Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <Link
              href="/running/log"
              className="group relative bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 hover:shadow-lg shadow-orange-500/20"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <PenLine className="w-5 h-5 text-white" />
              </div>
              <p className="font-semibold text-white text-sm">Enregistrer</p>
              <p className="text-xs text-slate-400 mt-0.5">Loguer une sortie réalisée</p>
            </Link>

            <Link
              href="/running/generate"
              className="group relative bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 hover:shadow-lg shadow-cyan-500/20"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <p className="font-semibold text-white text-sm">Générer avec IA</p>
              <p className="text-xs text-slate-400 mt-0.5">Créer une séance personnalisée</p>
            </Link>

            <Link
              href="/running/library"
              className="group relative bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 hover:shadow-lg shadow-blue-500/20"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <p className="font-semibold text-white text-sm">Bibliothèque</p>
              <p className="text-xs text-slate-400 mt-0.5">Parcourir toutes tes sorties</p>
            </Link>
          </div>
        </motion.div>

        {/* Coller un entraînement */}
        <motion.div variants={fadeInUp}>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-3">Coller un entraînement</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setPasteOpen(true)}
              className="group relative bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 hover:shadow-lg shadow-cyan-500/20 text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-sky-500 flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Clipboard className="w-5 h-5 text-white" />
              </div>
              <p className="font-semibold text-white text-sm">Coller un entraînement</p>
              <p className="text-xs text-slate-400 mt-0.5">Coller depuis un texte ou programme</p>
            </button>
          </div>
        </motion.div>

        {/* Séances récentes */}
        <motion.div variants={fadeInUp}>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-3">Séances récentes</h2>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-cyan-400" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <Activity className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">Aucune séance running pour l&apos;instant</p>
              <Link href="/running/generate" className="inline-flex px-4 py-2 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm">
                Générer avec l&apos;IA
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 10).map((session) => {
                const date = new Date(session.session_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                const name = session.ai_plan?.name ?? RUN_TYPE_LABELS[session.run_type]
                const duration = formatDuration(session.duration_seconds)
                const pace = formatPace(session.avg_pace_seconds_per_km)
                return (
                  <div key={session.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/8 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-cyan-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{name}</p>
                      <p className="text-xs text-slate-500">
                        {date}
                        {session.distance_km && ` · ${session.distance_km.toFixed(1)} km`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-mono font-bold text-cyan-400">{duration}</p>
                      {pace !== '--' && <p className="text-xs text-slate-500">{pace}</p>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </motion.div>

      </div>

      {/* Modal coller */}
      {pasteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPasteOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl p-5 space-y-4">
            <h2 className="font-semibold text-white">Coller un entraînement</h2>
            <p className="text-xs text-slate-400">Colle ton programme running — l&apos;IA va l&apos;analyser et créer ta séance.</p>
            <textarea
              rows={6}
              placeholder="Ex: 2km échauffement + 6×800m @ allure 5'/km + 2km retour au calme..."
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-cyan-500 placeholder:text-slate-600 resize-none"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setPasteOpen(false)}
                className="flex-1 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 transition-colors text-sm"
              >
                Annuler
              </button>
              <Link
                href={`/running/generate?context=${encodeURIComponent(pasteText)}`}
                className="flex-1 py-2 bg-gradient-to-r from-cyan-500 to-sky-500 text-white font-medium rounded-lg hover:opacity-90 transition-opacity text-sm text-center"
                onClick={() => setPasteOpen(false)}
              >
                Analyser avec l&apos;IA
              </Link>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
