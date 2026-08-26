'use client'

import { useRecommendation } from '@/hooks/useRecommendation'
import { RecommendedSport } from '@/services/recommendations'
import { motion } from 'framer-motion'
import {
  Activity, ArrowRight, Bike, Brain,
  Dumbbell, Heart, RefreshCw, Zap,
} from 'lucide-react'
import Link from 'next/link'

// ─── Config par sport ──────────────────────────────────────────────────────────

const SPORT_CONFIG: Record<RecommendedSport, {
  label: string
  icon: React.ReactNode
  href: string
}> = {
  crossfit: { label: 'CrossFit', icon: <Zap className="w-4 h-4" />, href: '/crossfit/generate' },
  running: { label: 'Running', icon: <Activity className="w-4 h-4" />, href: '/running/generate' },
  biking: { label: 'Vélo', icon: <Bike className="w-4 h-4" />, href: '/biking/generate' },
  strength: { label: 'Force', icon: <Dumbbell className="w-4 h-4" />, href: '/force/generate' },
  rest: { label: 'Récupération', icon: <Heart className="w-4 h-4" />, href: '#' },
}

const URGENCY_LABELS: Record<'high' | 'medium' | 'low', string> = {
  high: 'Prioritaire',
  medium: 'Recommandé',
  low: 'Suggestion',
}

// ─── Composant ─────────────────────────────────────────────────────────────────

export function CoachRecommendationWidget() {
  const { data, loading, refreshing, error, refresh } = useRecommendation()

  // ── Loading ──
  if (loading) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 animate-pulse">
        <div className="h-3 w-24 bg-muted rounded mb-4" />
        <div className="h-5 w-3/4 bg-muted rounded mb-2" />
        <div className="h-4 w-full bg-muted rounded mb-1" />
        <div className="h-4 w-2/3 bg-muted rounded" />
      </div>
    )
  }

  // ── Erreur ──
  if (error || !data) {
    return (
      <div className="rounded-lg border border-border bg-card p-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Recommandation Coach IA indisponible</p>
        </div>
        <Link
          href="/crossfit/generate"
          className="px-3 py-1.5 rounded-md text-xs font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          Générer une séance
        </Link>
      </div>
    )
  }

  const { recommendation: rec, session_stats: stats } = data
  const sport = SPORT_CONFIG[rec.recommended_sport]
  const typeLabel = rec.recommended_type.replace(/_/g, ' ')

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="rounded-lg border border-border bg-card p-5 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary" />
          <span className="eyebrow">Coach IA · Séance recommandée</span>
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-all disabled:opacity-40"
          title="Nouvelle suggestion"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <div className="rule-strong" />

      {/* Recommandation principale */}
      <div className="space-y-2">
        <div className="flex items-center gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1.5 font-display text-2xl font-semibold">
            {sport.icon}
            {sport.label}
          </span>
          <span className="text-sm text-muted-foreground capitalize">— {typeLabel}</span>
          <span className="eyebrow ml-auto">{URGENCY_LABELS[rec.urgency]} · {rec.suggested_duration} min</span>
        </div>

        <p className="text-sm text-foreground font-medium leading-snug">{rec.reason}</p>
        <p className="text-xs text-muted-foreground leading-relaxed">{rec.coaching_insight}</p>
      </div>

      {/* Stats rapides */}
      <div className="flex gap-2 flex-wrap">
        {(['crossfit', 'running', 'biking', 'strength'] as const).map((s) => {
          const days = stats.days_since_last[s]
          const count = stats.by_sport[s] ?? 0
          const isActive = s === rec.recommended_sport
          return (
            <div
              key={s}
              className={`flex flex-col items-center px-3 py-1.5 rounded-md border text-center ${isActive ? 'border-primary bg-primary/5' : 'border-border'}`}
            >
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {SPORT_CONFIG[s].label}
              </span>
              <span className="text-[11px] text-foreground">
                {days === null ? '—' : days === 0 ? 'auj.' : `${days}j`}
              </span>
              <span className="text-[9px] text-muted-foreground">{count}x/3sem</span>
            </div>
          )
        })}
      </div>

      {/* CTA */}
      {rec.recommended_sport !== 'rest' ? (
        <Link
          href={sport.href}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-full bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          Générer cette séance
          <ArrowRight className="w-4 h-4" />
        </Link>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2 w-full py-2.5 rounded-md border border-border text-foreground text-sm font-semibold">
            <Heart className="w-4 h-4 text-primary" />
            Repos actif recommandé — prends soin de toi
          </div>
          <Link
            href="/crossfit/generate"
            className="flex items-center justify-center gap-2 w-full py-2 rounded-md text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            Générer quand même une séance
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </motion.div>
  )
}
