'use client'

import { fadeInUp, staggerContainer } from '@/lib/animations'
import { MUSCLE_LABELS, SESSION_GOAL_LABELS } from '@/services/strength'
import { motion } from 'framer-motion'
import { BookOpen, Clipboard, Dumbbell, PenLine, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { useStrengthDashboard } from './_hooks/useStrengthDashboard'

const LINK_ACTIONS = [
  {
    href: '/strength/log',
    label: 'Enregistrer',
    description: 'Loguer une séance réalisée',
    icon: PenLine,
    color: 'from-violet-500 to-purple-500',
    shadow: 'shadow-violet-500/20',
  },
  {
    href: '/strength/generate',
    label: 'Générer avec IA',
    description: 'Créer une séance personnalisée',
    icon: Sparkles,
    color: 'from-emerald-500 to-teal-500',
    shadow: 'shadow-emerald-500/20',
  },
  {
    href: '/strength/library',
    label: 'Bibliothèque',
    description: 'Parcourir toutes tes séances',
    icon: BookOpen,
    color: 'from-blue-500 to-indigo-500',
    shadow: 'shadow-blue-500/20',
  },
]

export default function StrengthPage() {
  const { sessions, loading } = useStrengthDashboard()
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
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/30">
            <Dumbbell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Force</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">Séances de musculation adaptées à ton matériel</p>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div variants={fadeInUp}>
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500 mb-3">Actions</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {LINK_ACTIONS.map((action) => {
              const Icon = action.icon
              return (
                <Link
                  key={action.href}
                  href={action.href}
                  className={`group relative bg-white/5 border border-white/10 rounded-2xl p-4 hover:bg-white/10 transition-all duration-300 hover:shadow-lg ${action.shadow}`}
                >
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <p className="font-semibold text-white text-sm">{action.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{action.description}</p>
                </Link>
              )
            })}
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-400" />
            </div>
          ) : sessions.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center">
              <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">Aucune séance enregistrée</p>
              <Link href="/strength/log" className="inline-flex px-4 py-2 bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-lg hover:bg-violet-500/30 transition-colors text-sm">
                Enregistrer ma première séance
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {sessions.slice(0, 10).map((session) => {
                const date = new Date(session.session_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                const name = session.ai_plan?.session_name ?? 'Séance de force'
                const muscles = session.target_muscles.slice(0, 2)
                return (
                  <div key={session.id} className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-xl px-4 py-3 hover:bg-white/8 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-violet-500/10 flex items-center justify-center flex-shrink-0">
                      <Dumbbell className="w-4 h-4 text-violet-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white text-sm truncate">{name}</p>
                      <p className="text-xs text-slate-500">
                        {date}
                        {muscles.length > 0 && ` · ${muscles.map(m => MUSCLE_LABELS[m as keyof typeof MUSCLE_LABELS] ?? m).join(', ')}`}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-violet-400">{SESSION_GOAL_LABELS[session.session_goal]}</p>
                      {session.duration_minutes && (
                        <p className="text-xs text-slate-500">{session.duration_minutes} min</p>
                      )}
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
            <p className="text-xs text-slate-400">Colle ton programme — l&apos;IA va l&apos;analyser et créer ta séance.</p>
            <textarea
              rows={6}
              placeholder="Ex: Back squat 5×5 @ 80%, Romanian deadlift 4×8..."
              value={pasteText}
              onChange={e => setPasteText(e.target.value)}
              className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-violet-500 placeholder:text-slate-600 resize-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setPasteOpen(false)} className="flex-1 py-2 bg-white/5 border border-white/10 text-slate-300 rounded-lg hover:bg-white/10 transition-colors text-sm">
                Annuler
              </button>
              <Link
                href={`/strength/generate?context=${encodeURIComponent(pasteText)}`}
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
