'use client'

import {
  BenchmarkProgress,
  EnergySystemsResult,
  MovementExposureResult,
  StrengthRatio,
  StrengthRatiosResult,
  TrainingLoadResult,
  TrainingVolumeResult,
} from '@/services/analytics'
import { motion } from 'framer-motion'
import { Activity, AlertTriangle, Dumbbell, Gauge, Target, TrendingDown, TrendingUp } from 'lucide-react'
import { usePerformanceOverview } from '@/hooks/usePerformanceOverview'

const VERDICT_STYLES: Record<StrengthRatio['verdict'], { label: string; className: string }> = {
  below: { label: 'En retard', className: 'text-orange-600 bg-orange-500/10 border-orange-500/30' },
  in_range: { label: 'Équilibré', className: 'text-emerald-600 bg-emerald-500/10 border-emerald-500/30' },
  above: { label: 'En avance', className: 'text-blue-600 bg-blue-500/10 border-blue-500/30' },
  unavailable: { label: 'À renseigner', className: 'text-muted-foreground bg-secondary border-border' },
}

function Section({ title, subtitle, icon, children }: {
  title: string
  subtitle?: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <section className="bg-card border border-border rounded-lg p-5 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="min-w-0">
          <h3 className="font-semibold text-foreground">{title}</h3>
          {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {children}
    </section>
  )
}

function EmptyHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-sm text-muted-foreground bg-secondary/40 border border-dashed border-border rounded-lg px-4 py-3">
      {children}
    </p>
  )
}

/** Jauge situant la valeur d'un ratio par rapport à sa fourchette de référence. */
function RatioGauge({ ratio }: { ratio: StrengthRatio }) {
  const scaleMin = ratio.target_min_pct * 0.7
  const scaleMax = ratio.target_max_pct * 1.3
  const toPct = (value: number) =>
    Math.max(0, Math.min(100, ((value - scaleMin) / (scaleMax - scaleMin)) * 100))

  const targetLeft = toPct(ratio.target_min_pct)
  const targetWidth = toPct(ratio.target_max_pct) - targetLeft

  return (
    <div className="relative h-2 bg-secondary rounded-full overflow-hidden">
      <div
        className="absolute inset-y-0 bg-emerald-500/25"
        style={{ left: `${targetLeft}%`, width: `${targetWidth}%` }}
      />
      {ratio.value_pct !== null && (
        <div
          className="absolute inset-y-0 w-1 bg-foreground rounded-full"
          style={{ left: `calc(${toPct(ratio.value_pct)}% - 2px)` }}
        />
      )}
    </div>
  )
}

function StrengthRatiosPanel({ data }: { data: StrengthRatiosResult }) {
  const priority = data.ratios.filter(r => r.verdict === 'below')

  return (
    <Section
      title="Équilibres de force"
      subtitle="Rapports entre tes 1RM — un écart marqué désigne la cible du prochain bloc"
      icon={<Dumbbell className="w-4.5 h-4.5" />}
    >
      {priority.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-3">
          <p className="text-sm font-medium text-orange-700">
            {priority.length === 1 ? 'Point faible identifié' : `${priority.length} points faibles identifiés`}
          </p>
          <p className="text-sm text-foreground mt-1">{priority[0].interpretation}</p>
        </div>
      )}

      <div className="space-y-4">
        {data.ratios.map(ratio => {
          const style = VERDICT_STYLES[ratio.verdict]
          return (
            <div key={ratio.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-medium text-foreground">{ratio.label}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-sm font-mono text-foreground">
                    {ratio.value_pct !== null ? `${ratio.value_pct} %` : '—'}
                  </span>
                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-semibold ${style.className}`}>
                    {style.label}
                  </span>
                </div>
              </div>
              <RatioGauge ratio={ratio} />
              <p className="text-xs text-muted-foreground">
                Cible {ratio.target_min_pct}-{ratio.target_max_pct} %
              </p>
            </div>
          )
        })}
      </div>

      {data.missing_lifts.length > 0 && (
        <EmptyHint>
          Renseigne ces 1RM pour compléter le diagnostic : {data.missing_lifts.join(', ').replace(/_/g, ' ')}.
        </EmptyHint>
      )}
    </Section>
  )
}

function EnergySystemsPanel({ data }: { data: EnergySystemsResult }) {
  if (data.total_scored_sessions === 0) {
    return (
      <Section title="Filières énergétiques" icon={<Activity className="w-4.5 h-4.5" />}>
        <EmptyHint>Aucune séance chronométrée sur la période.</EmptyHint>
      </Section>
    )
  }

  return (
    <Section
      title="Filières énergétiques"
      subtitle={`Répartition de ${data.total_scored_sessions} séances — on ne progresse que dans le domaine qu'on travaille`}
      icon={<Activity className="w-4.5 h-4.5" />}
    >
      <div className="space-y-2.5">
        {data.domains.map(domain => (
          <div key={domain.domain} className="flex items-center gap-3">
            <div className="w-28 shrink-0">
              <p className="text-sm text-foreground">{domain.label}</p>
              <p className="text-[11px] text-muted-foreground">{domain.range_label}</p>
            </div>
            <div className="flex-1 h-2.5 bg-secondary rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  data.underworked.includes(domain.domain) ? 'bg-orange-500' : 'bg-primary'
                }`}
                style={{ width: `${domain.share_pct}%` }}
              />
            </div>
            <span className="w-16 text-right text-sm font-mono text-muted-foreground shrink-0">
              {domain.share_pct} %
            </span>
          </div>
        ))}
      </div>

      {data.underworked.length > 0 && (
        <div className="flex gap-2 text-sm text-orange-700 bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-3">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p>
            {data.underworked.length} domaine{data.underworked.length > 1 ? 's' : ''} sous 10 % de ton volume.
            Place au moins une séance par cycle dans {data.underworked.length > 1 ? 'ces fenêtres' : 'cette fenêtre'}.
          </p>
        </div>
      )}
    </Section>
  )
}

function BenchmarksPanel({ data }: { data: BenchmarkProgress[] }) {
  if (data.length === 0) {
    return (
      <Section title="Benchmarks" icon={<Target className="w-4.5 h-4.5" />}>
        <EmptyHint>
          Aucun benchmark enregistré. L&apos;app en planifie un par mois — c&apos;est la seule mesure de
          progrès réellement comparable dans le temps.
        </EmptyHint>
      </Section>
    )
  }

  return (
    <Section
      title="Benchmarks"
      subtitle="Chaque workout comparé à lui-même, jamais à un autre"
      icon={<Target className="w-4.5 h-4.5" />}
    >
      <div className="space-y-3">
        {data.map(benchmark => {
          const last = benchmark.points[benchmark.points.length - 1]
          const improving = benchmark.trend === 'improving'
          const declining = benchmark.trend === 'declining'
          return (
            <div key={benchmark.name} className="border border-border rounded-lg p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{benchmark.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {benchmark.points.length} test{benchmark.points.length > 1 ? 's' : ''} · niveau {last.level}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="font-mono font-semibold text-foreground">{last.display}</p>
                  {benchmark.delta_pct !== null && (
                    <p className={`text-xs flex items-center gap-1 justify-end ${
                      improving ? 'text-emerald-600' : declining ? 'text-destructive' : 'text-muted-foreground'
                    }`}>
                      {improving && <TrendingUp className="w-3 h-3" />}
                      {declining && <TrendingDown className="w-3 h-3" />}
                      {benchmark.delta_pct > 0 ? '+' : ''}{benchmark.delta_pct} %
                    </p>
                  )}
                </div>
              </div>

              {benchmark.bands && (
                <div className="flex flex-wrap gap-1.5">
                  {benchmark.bands.map(band => (
                    <span
                      key={band.level}
                      className={`px-2 py-0.5 rounded text-[10px] font-medium border ${
                        band.level === last.level
                          ? 'bg-primary/10 border-primary/40 text-primary'
                          : 'bg-secondary border-border text-muted-foreground'
                      }`}
                    >
                      {band.level} {band.display}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Section>
  )
}

function VolumeAndLoadPanel({ volume, load }: { volume: TrainingVolumeResult; load: TrainingLoadResult }) {
  const zoneLabels: Record<string, { label: string; className: string }> = {
    undertrained: { label: 'Charge basse', className: 'text-blue-600' },
    optimal: { label: 'Zone optimale', className: 'text-emerald-600' },
    caution: { label: 'Vigilance', className: 'text-orange-600' },
    high_risk: { label: 'Risque élevé', className: 'text-destructive' },
  }
  const zone = load.acwr_zone ? zoneLabels[load.acwr_zone] : null

  return (
    <Section
      title="Volume et charge"
      subtitle="La constance construit la progression davantage qu'un pic de volume isolé"
      icon={<Gauge className="w-4.5 h-4.5" />}
    >
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-secondary/40 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-foreground">{volume.total_sessions}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Séances</p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-foreground">{volume.avg_per_week}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Par semaine</p>
        </div>
        <div className="bg-secondary/40 rounded-lg p-3 text-center">
          <p className="text-xl font-bold text-foreground">{volume.consistency_pct} %</p>
          <p className="text-xs text-muted-foreground mt-0.5">Régularité</p>
        </div>
      </div>

      {!load.available ? (
        <EmptyHint>
          Renseigne le RPE à la fin de tes séances : au bout de quelques semaines, l&apos;app pourra
          suivre ta charge d&apos;entraînement et te dire quand poser un jour de repos.
        </EmptyHint>
      ) : (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Charge sur 7 jours <span className="text-xs">({load.sessions_with_rpe} séances avec RPE)</span>
            </span>
            <span className="font-mono text-foreground">{load.acute} UA</span>
          </div>
          {load.acwr !== null && zone ? (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Charge aiguë / chronique</span>
              <span className={`font-mono font-semibold ${zone.className}`}>
                {load.acwr} — {zone.label}
              </span>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Le ratio de charge demande 4 semaines d&apos;historique avec RPE pour être fiable.
            </p>
          )}
          {load.last_week_change_pct !== null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Variation depuis la semaine passée</span>
              <span className={`font-mono ${load.last_week_change_pct > 10 ? 'text-orange-600' : 'text-foreground'}`}>
                {load.last_week_change_pct > 0 ? '+' : ''}{load.last_week_change_pct} %
              </span>
            </div>
          )}
        </div>
      )}
    </Section>
  )
}

function MovementsPanel({ data }: { data: MovementExposureResult }) {
  if (!data.available) {
    return (
      <Section title="Exposition par mouvement" icon={<Activity className="w-4.5 h-4.5" />}>
        <EmptyHint>
          Renseigne charge, reps et scaling dans tes logs de séance : l&apos;app pourra alors repérer
          les mouvements que tu scales le plus souvent et ceux que tu vois le moins.
        </EmptyHint>
      </Section>
    )
  }

  return (
    <Section
      title="Exposition par mouvement"
      subtitle="Ce que tu scales le plus souvent est ton point faible le plus probable"
      icon={<Activity className="w-4.5 h-4.5" />}
    >
      {data.most_scaled.length > 0 && (
        <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg px-4 py-3 text-sm text-orange-700">
          Scalé plus d&apos;une fois sur deux : {data.most_scaled.join(', ')}
        </div>
      )}
      <div className="space-y-2">
        {data.movements.slice(0, 12).map(movement => (
          <div key={movement.name} className="flex items-center justify-between gap-3 text-sm">
            <span className="text-foreground truncate">{movement.name}</span>
            <div className="flex items-center gap-3 shrink-0 text-xs text-muted-foreground font-mono">
              <span>{movement.exposures}×</span>
              {movement.avg_load_kg !== null && <span>{movement.avg_load_kg} kg</span>}
              {movement.pct_of_1rm !== null && <span>{movement.pct_of_1rm} % 1RM</span>}
              {movement.scaled_pct > 0 && <span className="text-orange-600">{movement.scaled_pct} % scaled</span>}
            </div>
          </div>
        ))}
      </div>
    </Section>
  )
}

/**
 * Diagnostic de performance entièrement calculé : aucun chiffre n'est produit par l'IA.
 */
export function PerformanceDiagnostic({ months = 3 }: { months?: number }) {
  const { overview, loading, error } = usePerformanceOverview(months)

  if (loading) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
        Calcul du diagnostic...
      </div>
    )
  }

  if (error || !overview) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center text-muted-foreground">
        {error ?? 'Diagnostic indisponible'}
      </div>
    )
  }

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <StrengthRatiosPanel data={overview.strength_ratios} />
      <EnergySystemsPanel data={overview.energy_systems} />
      <BenchmarksPanel data={overview.benchmarks} />
      <VolumeAndLoadPanel volume={overview.volume} load={overview.load} />
      <MovementsPanel data={overview.movements} />
    </motion.div>
  )
}
