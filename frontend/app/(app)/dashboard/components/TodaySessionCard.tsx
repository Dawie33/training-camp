'use client'

import { CoachRecommendation, DailySessionResult, recommendationsService } from '@/services/recommendations'
import type { WorkoutSchedule } from '@/services/schedule'
import { ArrowRight, Brain, CheckCircle2, Heart } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const URGENCY_LABELS: Record<CoachRecommendation['urgency'], string> = {
  high: 'Prioritaire',
  medium: 'Recommandée',
  low: 'Suggestion',
}

function workoutHref(schedule: WorkoutSchedule): string | null {
  if (schedule.workout_id) return `/workout/${schedule.workout_id}`
  if (schedule.personalized_workout_id) return `/personalized-workout/${schedule.personalized_workout_id}`
  return null
}

/** Relie le log au créneau : la séance passe en « complétée » dans le calendrier. */
function logHref(schedule: WorkoutSchedule): string {
  const params = new URLSearchParams({ scheduleId: schedule.id })
  if (schedule.workout_id) params.set('workoutId', schedule.workout_id)
  if (schedule.personalized_workout_id) params.set('personalizedWorkoutId', schedule.personalized_workout_id)
  return `/crossfit/log-workout?${params.toString()}`
}

/** Le « pourquoi » du coach, affiché sous la séance ou le jour de repos. */
function CoachReason({ recommendation }: { recommendation: CoachRecommendation }) {
  return (
    <div className="space-y-1.5 border-l-2 border-primary/40 pl-3">
      <p className="flex items-center gap-1.5 eyebrow">
        <Brain className="w-3.5 h-3.5 text-primary" aria-hidden />
        Pourquoi cette séance
      </p>
      <p className="text-sm text-foreground font-medium leading-snug">{recommendation.reason}</p>
      <p className="text-xs text-muted-foreground leading-relaxed">{recommendation.coaching_insight}</p>
    </div>
  )
}

function PlannedSession({ schedule }: { schedule: WorkoutSchedule }) {
  const recommendation = schedule.coach_recommendation ?? null
  const completed = schedule.status === 'completed'
  const href = workoutHref(schedule)
  const duration = schedule.estimated_duration ?? recommendation?.suggested_duration
  const meta = [
    schedule.workout_type?.replace(/_/g, ' '),
    duration ? `${duration} min` : null,
    !completed && recommendation ? URGENCY_LABELS[recommendation.urgency] : null,
  ].filter(Boolean)

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-2xl font-semibold leading-tight">
          {schedule.workout_name ?? 'Séance du jour'}
        </h3>
        {meta.length > 0 && <p className="text-sm text-muted-foreground capitalize mt-1">{meta.join(' · ')}</p>}
      </div>

      {completed ? (
        <p className="flex items-center gap-2 text-sm text-foreground">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden />
          Séance faite. La récup commence maintenant : hydratation, protéines, sommeil.
        </p>
      ) : (
        recommendation && <CoachReason recommendation={recommendation} />
      )}

      <div className="flex flex-wrap gap-2">
        {!completed && (
          <Link
            href={logHref(schedule)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-opacity"
          >
            Logger ma séance
            <ArrowRight className="w-4 h-4" aria-hidden />
          </Link>
        )}
        {href && (
          <Link
            href={href}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-border text-sm font-semibold hover:bg-secondary transition-colors"
          >
            Voir la séance
          </Link>
        )}
      </div>
    </div>
  )
}

function RestDay({ recommendation }: { recommendation?: CoachRecommendation }) {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 font-display text-2xl font-semibold leading-tight">
          <Heart className="w-5 h-5 text-primary" aria-hidden />
          Jour de repos
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Le repos fait partie du programme : c&apos;est pendant la récupération que tu progresses.
        </p>
      </div>
      {recommendation && <CoachReason recommendation={recommendation} />}
      <Link
        href="/crossfit/generate"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        M&apos;entraîner quand même
        <ArrowRight className="w-3.5 h-3.5" aria-hidden />
      </Link>
    </div>
  )
}

function NoSession() {
  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div>
        <h3 className="font-display text-xl font-semibold leading-tight">Aucune séance prévue aujourd&apos;hui</h3>
        <p className="text-sm text-muted-foreground mt-1">Le coach n&apos;a pas pu préparer ta séance.</p>
      </div>
      <Link
        href="/crossfit/generate"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-primary-foreground font-display font-semibold text-sm hover:opacity-90 transition-opacity"
      >
        Générer une séance
        <ArrowRight className="w-4 h-4" aria-hidden />
      </Link>
    </div>
  )
}

// Un seul check à la fois : deux appels simultanés (StrictMode, double montage) lanceraient deux générations.
let pendingCheck: Promise<DailySessionResult> | null = null

function checkDailySessionOnce(): Promise<DailySessionResult> {
  pendingCheck ??= recommendationsService.checkDailySession().finally(() => {
    pendingCheck = null
  })
  return pendingCheck
}

/**
 * Séance du jour et explication du coach, réunies dans une seule carte.
 *
 * Le check backend crée la séance à la première visite de la journée à partir de la
 * recommandation, puis renvoie le créneau existant : l'explication affichée est celle
 * enregistrée avec la séance, jamais une recommandation régénérée entre-temps.
 */
export function TodaySessionCard() {
  const [result, setResult] = useState<DailySessionResult | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    checkDailySessionOnce()
      .then(data => {
        if (!cancelled) setResult(data)
      })
      .catch(() => {
        if (!cancelled) setResult({ generated: false, reason: 'failed', schedule: null })
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <div className="flex items-baseline justify-between gap-4">
        <span className="eyebrow">Séance du jour</span>
        <Link href="/calendar" className="text-sm text-primary hover:opacity-80 transition-opacity">
          Calendrier complet →
        </Link>
      </div>
      <div className="rule-strong" />

      {loading ? (
        <div className="space-y-2 animate-pulse" aria-label="Préparation de ta séance du jour">
          <div className="h-6 w-2/3 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-1/2 bg-muted rounded" />
        </div>
      ) : result?.schedule ? (
        <PlannedSession schedule={result.schedule} />
      ) : result?.reason === 'rest_recommended' ? (
        <RestDay recommendation={result.recommendation} />
      ) : (
        <NoSession />
      )}
    </div>
  )
}
