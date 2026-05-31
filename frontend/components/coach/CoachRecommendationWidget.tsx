'use client'

import { useRecommendation } from '@/hooks/useRecommendation'
import { RecommendedSport } from '@/services/recommendations'
import { motion } from 'framer-motion'
import {
  Activity, AlertTriangle, ArrowRight, Brain,
  Dumbbell, Heart, RefreshCw, Zap,
} from 'lucide-react'
import Link from 'next/link'

// ─── Config par sport ──────────────────────────────────────────────────────────

const SPORT_CONFIG: Record<RecommendedSport, {
  label: string
  icon: React.ReactNode
  color: string
  border: string
  bg: string
  href: string
}> = {
  crossfit: {
    label: 'CrossFit',
    icon: <Zap className="w-4 h-4" />,
    color: 'text-orange-400',
    border: 'border-orange-500/40',
    bg: 'bg-orange-500/10',
    href: '/workouts/generate-ai',
  },
  running: {
    label: 'Running',
    icon: <Activity className="w-4 h-4" />,
    color: 'text-cyan-400',
    border: 'border-cyan-500/40',
    bg: 'bg-cyan-500/10',
    href: '/running/generate',
  },
  hyrox: {
    label: 'Hyrox',
    icon: <Zap className="w-4 h-4" />,
    color: 'text-yellow-400',
    border: 'border-yellow-500/40',
    bg: 'bg-yellow-500/10',
    href: '/hyrox/generate',
  },
  strength: {
    label: 'Musculation',
    icon: <Dumbbell className="w-4 h-4" />,
    color: 'text-purple-400',
    border: 'border-purple-500/40',
    bg: 'bg-purple-500/10',
    href: '/strength/generate',
  },
  athx: {
    label: 'ATHX',
    icon: <Activity className="w-4 h-4" />,
    color: 'text-blue-400',
    border: 'border-blue-500/40',
    bg: 'bg-blue-500/10',
    href: '/athx/generate',
  },
  rest: {
    label: 'Récupération',
    icon: <Heart className="w-4 h-4" />,
    color: 'text-green-400',
    border: 'border-green-500/40',
    bg: 'bg-green-500/10',
    href: '#',
  },
}

const URGENCY_CONFIG = {
  high: { label: 'Prioritaire', color: 'text-red-400', bg: 'bg-red-500/15', border: 'border-red-500/30', icon: <AlertTriangle className="w-3 h-3" /> },
  medium: { label: 'Recommandé', color: 'text-orange-400', bg: 'bg-orange-500/15', border: 'border-orange-500/30', icon: <Zap className="w-3 h-3" /> },
  low: { label: 'Suggestion', color: 'text-green-400', bg: 'bg-green-500/15', border: 'border-green-500/30', icon: <ArrowRight className="w-3 h-3" /> },
}

// ─── Composant ─────────────────────────────────────────────────────────────────

export function CoachRecommendationWidget() {
  const { data, loading, refreshing, error, refresh } = useRecommendation()

  // ── Loading ──
  if (loading) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 animate-pulse">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-white/10" />
          <div className="h-4 w-40 bg-white/10 rounded" />
        </div>
        <div className="h-5 w-3/4 bg-white/10 rounded mb-2" />
        <div className="h-4 w-full bg-white/10 rounded mb-1" />
        <div className="h-4 w-2/3 bg-white/10 rounded" />
      </div>
    )
  }

  // ── Erreur ──
  if (error || !data) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-slate-500" />
          <p className="text-sm text-slate-400">Recommandation Coach IA indisponible</p>
        </div>
        <Link href="/workouts/generate-ai" className="px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500/10 border border-orange-500/25 text-orange-300 hover:bg-orange-500/20 transition-colors whitespace-nowrap">
          Générer une séance
        </Link>
      </div>
    )
  }

  const { recommendation: rec, session_stats: stats } = data
  const sport = SPORT_CONFIG[rec.recommended_sport]
  const urgency = URGENCY_CONFIG[rec.urgency]

  const typeLabel = rec.recommended_type.replace(/_/g, ' ')

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={`rounded-2xl border ${sport.border} ${sport.bg} p-5 space-y-4`}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${sport.bg} border ${sport.border}`}>
            <Brain className={`w-4 h-4 ${sport.color}`} />
          </div>
          <div>
            <p className="text-xs text-slate-400 leading-none">Coach IA</p>
            <p className="text-sm font-semibold text-white leading-tight">Séance recommandée</p>
          </div>
        </div>

        <button
          onClick={refresh}
          disabled={refreshing}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/5 transition-all disabled:opacity-40"
          title="Nouvelle suggestion"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Recommandation principale */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          {/* Badge urgence */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${urgency.bg} ${urgency.border} ${urgency.color}`}>
            {urgency.icon}
            {urgency.label}
          </span>

          {/* Sport + type */}
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${sport.bg} ${sport.border} ${sport.color}`}>
            {sport.icon}
            {sport.label} — {typeLabel}
          </span>

          {/* Durée suggérée */}
          <span className="text-[11px] text-slate-500">{rec.suggested_duration} min</span>
        </div>

        {/* Raison directe */}
        <p className="text-sm text-white font-medium leading-snug">{rec.reason}</p>

        {/* Insight coach */}
        <p className="text-xs text-slate-400 leading-relaxed">{rec.coaching_insight}</p>
      </div>

      {/* Stats rapides */}
      <div className="flex gap-3 flex-wrap">
        {(['crossfit', 'running', 'hyrox', 'strength', 'athx'] as const).map((s) => {
          const days = stats.days_since_last[s]
          const count = stats.by_sport[s] ?? 0
          const isActive = s === rec.recommended_sport
          return (
            <div
              key={s}
              className={`flex flex-col items-center px-2 py-1 rounded-lg border text-center ${isActive ? `${SPORT_CONFIG[s].bg} ${SPORT_CONFIG[s].border}` : 'border-white/5 bg-white/3'}`}
            >
              <span className={`text-[10px] font-medium ${isActive ? SPORT_CONFIG[s].color : 'text-slate-500'}`}>
                {SPORT_CONFIG[s].label}
              </span>
              <span className={`text-[10px] ${isActive ? 'text-white' : 'text-slate-600'}`}>
                {days === null ? '—' : days === 0 ? "auj." : `${days}j`}
              </span>
              <span className={`text-[9px] ${isActive ? 'text-slate-400' : 'text-slate-700'}`}>
                {count}x/3sem
              </span>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      {rec.recommended_sport !== 'rest' ? (
        <Link
          href={sport.href}
          className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border font-semibold text-sm transition-all ${sport.bg} ${sport.border} ${sport.color} hover:brightness-110`}
        >
          <ArrowRight className="w-4 h-4" />
          Générer cette séance
        </Link>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-green-500/20 bg-green-500/5 text-green-400 text-sm font-semibold">
            <Heart className="w-4 h-4" />
            Repos actif recommandé — prends soin de toi
          </div>
          <Link
            href="/workouts/generate-ai"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-xl border border-white/10 bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-colors text-sm"
          >
            <ArrowRight className="w-3.5 h-3.5" />
            Générer quand même une séance
          </Link>
        </div>
      )}
    </motion.div>
  )
}
