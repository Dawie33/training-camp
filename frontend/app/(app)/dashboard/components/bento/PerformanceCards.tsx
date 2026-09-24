'use client'

import { EnergyMixChart } from '@/components/charts/EnergyMixChart'
import { MovementExposureChart } from '@/components/charts/MovementExposureChart'
import { Sparkline } from '@/components/charts/Sparkline'
import { WeeklyLoadChart } from '@/components/charts/WeeklyLoadChart'
import { WeeklyVolumeChart } from '@/components/charts/WeeklyVolumeChart'
import { formatAxisDate } from '@/components/charts/chart-tokens'
import {
  AcwrZone,
  BenchmarkProgress,
  EnergySystemsResult,
  LatestSessionAnalysis,
  MovementExposureResult,
  PerformanceLevel,
  PerformanceOverview,
  SkillProgressResult,
  StrengthHistoryResult,
  StrengthRatiosResult,
  TrainingLoadResult,
  TrainingVolumeResult,
} from '@/services/analytics'
import { CROSSFIT_LIFTS } from '@/services/one-rep-maxes'
import { AlertTriangle, TrendingDown, TrendingUp } from 'lucide-react'
import { SkillOfTheDayCard } from '../SkillOfTheDayCard'
import { BentoCard, BentoStat } from './BentoCard'

const ACWR_ZONES: Record<AcwrZone, { label: string; className: string }> = {
  undertrained: { label: 'Charge basse', className: 'text-blue-600' },
  optimal: { label: 'Zone optimale', className: 'text-emerald-600' },
  caution: { label: 'Vigilance', className: 'text-orange-600' },
  high_risk: { label: 'Risque élevé', className: 'text-destructive' },
}

const PERFORMANCE_LEVELS: Record<PerformanceLevel, { label: string; className: string }> = {
  pr: { label: 'Record personnel', className: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' },
  above_average: { label: 'Au-dessus de ta moyenne', className: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' },
  average: { label: 'Dans ta moyenne', className: 'text-muted-foreground bg-secondary border-border' },
  below_average: { label: 'En dessous de ta moyenne', className: 'text-orange-600 bg-orange-500/10 border-orange-500/30' },
  first_time: { label: 'Première fois', className: 'text-blue-600 bg-blue-500/10 border-blue-500/30' },
}

function liftLabel(lift: string): string {
  return CROSSFIT_LIFTS.find(l => l.value === lift)?.label ?? lift.replace(/_/g, ' ')
}

/** Pastille de variation : la flèche double le signe, la couleur ne porte pas seule l'information. */
function Delta({ value, unit = '%' }: { value: number; unit?: string }) {
  const improving = value > 0
  const declining = value < 0
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-medium ${
        improving ? 'text-emerald-600' : declining ? 'text-destructive' : 'text-muted-foreground'
      }`}
    >
      {improving && <TrendingUp className="w-3 h-3" aria-hidden />}
      {declining && <TrendingDown className="w-3 h-3" aria-hidden />}
      {value > 0 ? '+' : ''}
      {value} {unit}
    </span>
  )
}

/** Carte maîtresse : le déséquilibre le plus marqué et l'action à en tirer. */
function WeakPointCard({ data }: { data: StrengthRatiosResult }) {
  const weakest = data.ratios
    .filter(r => r.verdict === 'below' && r.value_pct !== null)
    .sort((a, b) => {
      const gapA = (a.target_min_pct - (a.value_pct ?? 0)) / a.target_min_pct
      const gapB = (b.target_min_pct - (b.value_pct ?? 0)) / b.target_min_pct
      return gapB - gapA
    })[0]

  if (!weakest) return null

  return (
    <BentoCard eyebrow="Point faible du moment" title={weakest.label} href="/tracking" accent>
      <div className="flex items-baseline gap-2.5 mb-2.5">
        <span className="font-display text-5xl font-semibold leading-none tracking-tight text-foreground">
          {weakest.value_pct}
          <span className="text-2xl font-normal text-muted-foreground ml-1">%</span>
        </span>
        <span className="text-sm text-muted-foreground">
          cible {weakest.target_min_pct}-{weakest.target_max_pct} %
        </span>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{weakest.interpretation}</p>
    </BentoCard>
  )
}

function StrengthHistoryCard({ data }: { data: StrengthHistoryResult }) {
  if (!data.available) return null

  return (
    <BentoCard
      eyebrow="Évolution des charges"
      href="/crossfit/rm"
      hrefLabel="Gérer mes 1RM"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
        {data.lifts.slice(0, 6).map(lift => (
          <div key={lift.lift}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-xs text-muted-foreground truncate">{liftLabel(lift.lift)}</span>
              <div className="flex items-baseline gap-2 shrink-0">
                <span className="text-sm font-semibold text-foreground tabular-nums">{lift.current} kg</span>
                {lift.gain_kg !== null && lift.gain_kg !== 0 && <Delta value={lift.gain_kg} unit="kg" />}
              </div>
            </div>
            <Sparkline
              points={lift.points.map(p => ({ label: formatAxisDate(p.measured_at), value: p.value }))}
              height={40}
            />
          </div>
        ))}
      </div>
    </BentoCard>
  )
}

function LoadCard({ load }: { load: TrainingLoadResult }) {
  if (!load.available) return null

  const zone = load.acwr_zone ? ACWR_ZONES[load.acwr_zone] : null

  return (
    <BentoCard eyebrow="Charge d'entraînement">
      <div className="flex items-baseline gap-4 mb-1">
        <BentoStat value={load.acute ?? 0} unit="UA" label="sur 7 jours" />
        {zone && load.acwr !== null && (
          <div className="ml-auto text-right">
            <p className={`text-sm font-semibold ${zone.className}`}>{zone.label}</p>
            <p className="text-xs text-muted-foreground tabular-nums">ratio {load.acwr}</p>
          </div>
        )}
      </div>
      <WeeklyLoadChart weeks={load.weeks} chronic={load.chronic} height={140} />
      {load.acwr === null && (
        <p className="text-[11px] text-muted-foreground mt-1">
          Le ratio de charge demande 4 semaines d&apos;historique pour être fiable.
        </p>
      )}
      {load.last_week_change_pct !== null && load.last_week_change_pct > 10 && (
        <p className="flex items-center gap-1.5 text-xs text-orange-600 mt-1.5">
          <AlertTriangle className="w-3 h-3 shrink-0" aria-hidden />
          +{load.last_week_change_pct} % vs semaine passée — au-delà de +10 %, le risque de blessure monte.
        </p>
      )}
    </BentoCard>
  )
}

function VolumeCard({ volume }: { volume: TrainingVolumeResult }) {
  if (volume.total_sessions === 0) return null

  return (
    <BentoCard eyebrow="Volume hebdomadaire">
      <div className="flex items-baseline gap-5 mb-1">
        <BentoStat value={volume.total_sessions} label="séances" />
        <BentoStat value={volume.avg_per_week} label="par semaine" />
        <BentoStat value={`${volume.consistency_pct} %`} label="régularité" />
      </div>
      <WeeklyVolumeChart weeks={volume.weeks} height={140} />
    </BentoCard>
  )
}

function EnergyCard({ data }: { data: EnergySystemsResult }) {
  if (data.total_scored_sessions === 0) return null

  return (
    <BentoCard
      eyebrow="Filières énergétiques"
      title={`${data.total_scored_sessions} séances chronométrées`}
    >
      <EnergyMixChart domains={data.domains} underworked={data.underworked} height={190} />
    </BentoCard>
  )
}

function BenchmarksCard({ benchmarks }: { benchmarks: BenchmarkProgress[] }) {
  if (benchmarks.length === 0) return null

  return (
    <BentoCard eyebrow="Benchmarks" href="/tracking">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-5 gap-y-3">
        {benchmarks.slice(0, 4).map(benchmark => {
          const last = benchmark.points[benchmark.points.length - 1]
          return (
            <div key={benchmark.name}>
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-xs text-muted-foreground truncate">{benchmark.name}</span>
                <div className="flex items-baseline gap-2 shrink-0">
                  <span className="text-sm font-semibold text-foreground tabular-nums">{last.display}</span>
                  {benchmark.delta_pct !== null && benchmark.delta_pct !== 0 && (
                    <Delta value={benchmark.delta_pct} />
                  )}
                </div>
              </div>
              {benchmark.points.length > 1 ? (
                <Sparkline
                  points={benchmark.points.map(p => ({ label: formatAxisDate(p.measured_at), value: p.score_value }))}
                  height={40}
                  formatValue={() => last.display}
                />
              ) : (
                <p className="text-[11px] text-muted-foreground py-3">
                  Un seul test — reteste pour voir la progression.
                </p>
              )}
            </div>
          )
        })}
      </div>
    </BentoCard>
  )
}

function MovementsCard({ data }: { data: MovementExposureResult }) {
  if (!data.available || data.movements.length === 0) return null

  return (
    <BentoCard eyebrow="Exposition par mouvement">
      <MovementExposureChart movements={data.movements} limit={8} />
      {data.most_scaled.length > 0 && (
        <p className="flex items-start gap-1.5 text-xs text-orange-600 mt-2">
          <AlertTriangle className="w-3 h-3 shrink-0 mt-0.5" aria-hidden />
          <span>Scalé plus d&apos;une fois sur deux : {data.most_scaled.join(', ')}</span>
        </p>
      )}
    </BentoCard>
  )
}

function StrengthBalanceCard({ data }: { data: StrengthRatiosResult }) {
  const known = data.ratios.filter(r => r.value_pct !== null)
  if (known.length === 0) return null

  return (
    <BentoCard eyebrow="Équilibres de force" href="/crossfit/rm" hrefLabel="Gérer mes 1RM">
      <div className="space-y-2.5">
        {known.map(ratio => {
          const scaleMin = ratio.target_min_pct * 0.7
          const scaleMax = ratio.target_max_pct * 1.3
          const toPct = (value: number) =>
            Math.max(0, Math.min(100, ((value - scaleMin) / (scaleMax - scaleMin)) * 100))
          const targetLeft = toPct(ratio.target_min_pct)

          return (
            <div key={ratio.key} className="flex items-center gap-3">
              <span className="w-36 shrink-0 text-xs text-muted-foreground truncate">{ratio.label}</span>
              <div className="relative flex-1 h-1.5 bg-secondary rounded-full">
                <div
                  className="absolute inset-y-0 bg-emerald-500/30 rounded-full"
                  style={{ left: `${targetLeft}%`, width: `${toPct(ratio.target_max_pct) - targetLeft}%` }}
                />
                <div
                  className="absolute inset-y-0 w-1 bg-foreground rounded-full"
                  style={{ left: `calc(${toPct(ratio.value_pct!)}% - 2px)` }}
                />
              </div>
              <span className="w-12 shrink-0 text-right text-xs font-mono text-foreground tabular-nums">
                {ratio.value_pct} %
              </span>
            </div>
          )
        })}
      </div>
    </BentoCard>
  )
}

/**
 * Retour du coach sur la dernière séance analysée.
 * Le contenu vient d'une analyse déjà stockée — l'affichage ne déclenche aucune génération.
 */
function LatestAnalysisCard({ analysis }: { analysis: LatestSessionAnalysis | null }) {
  if (!analysis) return null

  const level = PERFORMANCE_LEVELS[analysis.performance_level]
  const date = new Date(analysis.session_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })

  return (
    <BentoCard
      eyebrow="Retour sur ta dernière séance"
      title={analysis.workout_name}
      href={`/tracking`}
    >
      <div className="flex items-center gap-2 flex-wrap mb-2.5">
        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${level.className}`}>
          {level.label}
        </span>
        <span className="text-xs text-muted-foreground">{date}</span>
      </div>

      {analysis.summary && (
        <p className="text-sm text-foreground leading-relaxed mb-3">{analysis.summary}</p>
      )}

      <div className="space-y-2">
        {analysis.strengths.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-emerald-600 mb-1">
              Points forts
            </p>
            <ul className="space-y-0.5">
              {analysis.strengths.slice(0, 2).map(item => (
                <li key={item} className="text-xs text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
        {analysis.improvements.length > 0 && (
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-orange-600 mb-1">
              À travailler
            </p>
            <ul className="space-y-0.5">
              {analysis.improvements.slice(0, 2).map(item => (
                <li key={item} className="text-xs text-muted-foreground">
                  {item}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {analysis.next_steps && (
        <p className="text-xs text-foreground mt-3 pt-3 border-t border-border leading-relaxed">
          <span className="font-medium">Prochaine étape : </span>
          {analysis.next_steps}
        </p>
      )}
    </BentoCard>
  )
}

function SkillProgressCard({ data }: { data: SkillProgressResult }) {
  if (!data.available || data.skills.length === 0) return null

  return (
    <BentoCard eyebrow="Compétences en cours" href="/skills" hrefLabel="Voir mes progressions">
      <div className="space-y-3">
        {data.skills.slice(0, 4).map(skill => (
          <div key={skill.program_id}>
            <div className="flex items-baseline justify-between gap-2 mb-1">
              <span className="text-sm font-medium text-foreground truncate">{skill.skill_name}</span>
              <span className="text-xs text-muted-foreground tabular-nums shrink-0">
                {skill.completed_steps}/{skill.total_steps}
              </span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${skill.progress_pct}%` }}
              />
            </div>
            {skill.current_step_title && (
              <p className="text-[11px] text-muted-foreground mt-1 truncate">
                En cours : {skill.current_step_title}
              </p>
            )}
          </div>
        ))}
      </div>
    </BentoCard>
  )
}

/** Amorçage : ce qu'il reste à saisir pour débloquer les cartes encore absentes. */
export function MissingDataCard({ overview }: { overview: PerformanceOverview }) {
  const todo: { label: string; href: string }[] = []

  if (!overview.strength_history.available || overview.strength_ratios.missing_lifts.length > 0) {
    todo.push({ label: 'Renseigne tes 1RM — ils débloquent les équilibres de force et les courbes de charge', href: '/crossfit/rm' })
  }
  if (!overview.load.available) {
    todo.push({ label: 'Note le RPE en fin de séance — il donne ta charge d’entraînement', href: '/crossfit/log-workout' })
  }
  if (overview.benchmarks.length === 0) {
    todo.push({ label: 'Teste un benchmark — la seule mesure vraiment comparable dans le temps', href: '/crossfit/workouts' })
  }
  if (!overview.movements.available) {
    todo.push({ label: 'Saisis charges et reps dans tes logs — ils révèlent ton mouvement le plus scalé', href: '/crossfit/log-workout' })
  }

  if (todo.length === 0) return null

  return (
    <BentoCard eyebrow="Pour compléter ton diagnostic" className="col-span-full">
      <ul className="space-y-1.5">
        {todo.map(item => (
          <li key={item.href + item.label}>
            <a href={item.href} className="text-sm text-foreground hover:text-primary transition-colors">
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </BentoCard>
  )
}

function LoadingCard({ className = '' }: { className?: string }) {
  return <div className={`h-40 rounded-2xl border border-border bg-card animate-pulse ${className}`} />
}

/**
 * Bloc de suivi du dashboard.
 *
 * Une carte sans donnée exploitable ne s'affiche pas : la grille reste dense. Ce qu'il
 * reste à saisir est récapitulé par `MissingDataCard`, affichée en tête du dashboard.
 */
export function PerformanceCards({ overview, loading }: { overview: PerformanceOverview | null; loading: boolean }) {
  if (loading && !overview) {
    return (
      <>
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
        <LoadingCard />
      </>
    )
  }

  if (!overview) return null

  return (
    <>
      <WeakPointCard data={overview.strength_ratios} />
      <LatestAnalysisCard analysis={overview.latest_analysis} />
      <LoadCard load={overview.load} />
      <VolumeCard volume={overview.volume} />
      <StrengthHistoryCard data={overview.strength_history} />
      <BenchmarksCard benchmarks={overview.benchmarks} />
      <SkillProgressCard data={overview.skills} />
      <EnergyCard data={overview.energy_systems} />
      <MovementsCard data={overview.movements} />
      <StrengthBalanceCard data={overview.strength_ratios} />
      <BentoCard>
        <SkillOfTheDayCard />
      </BentoCard>
    </>
  )
}
