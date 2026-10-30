'use client'

import { HyroxSimulationProgress, RunningResult, RunSegmentAnalysis } from '@/services/analytics'
import { Footprints, Timer, TrendingDown, TrendingUp } from 'lucide-react'
import { EmptyHint, Section } from './diagnostic-ui'

/** Couleur de chaque zone cardiaque, de la récupération (1) au VO2 max (5). */
const ZONE_COLORS: Record<number, string> = {
  1: 'bg-sky-400',
  2: 'bg-emerald-500',
  3: 'bg-yellow-500',
  4: 'bg-orange-500',
  5: 'bg-red-500',
}

/** Allure au format montre : 6,8 min/km → « 6:48 ». */
function formatPace(paceMinKm: number): string {
  const totalSeconds = Math.round(paceMinKm * 60)
  return `${Math.floor(totalSeconds / 60)}:${String(totalSeconds % 60).padStart(2, '0')}`
}

/** Durée au format chrono : 4488 s → « 1:14:48 ». */
function formatDuration(totalSeconds: number): string {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = String(totalSeconds % 60).padStart(2, '0')
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${seconds}` : `${minutes}:${seconds}`
}

/**
 * Date courte en français. Le fuseau est fixé : le composant est aussi rendu côté serveur (UTC sur Vercel),
 * et une séance tard le soir ne doit pas changer de jour entre le serveur et le navigateur.
 */
function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', timeZone: 'Europe/Paris' })
}

const plural = (count: number, one: string, many: string) => `${count} ${count > 1 ? many : one}`

/** Variation en % d'une allure ou d'un temps : négatif = plus rapide (vert), positif = plus lent (orange). */
function SpeedChange({ pct, suffix }: { pct: number; suffix?: string }) {
  const faster = pct < 0
  const slower = pct > 0
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs ${
        faster ? 'text-emerald-600' : slower ? 'text-orange-600' : 'text-muted-foreground'
      }`}
    >
      {faster && <TrendingDown className="w-3 h-3" />}
      {slower && <TrendingUp className="w-3 h-3" />}
      {pct > 0 ? '+' : ''}
      {pct} %{suffix ? ` ${suffix}` : ''}
    </span>
  )
}

function StatTile({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-3 space-y-1 min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-mono font-semibold text-foreground text-lg leading-tight">{value}</p>
      {children && <div className="text-xs text-muted-foreground">{children}</div>}
    </div>
  )
}

function SummaryTiles({ data }: { data: RunningResult }) {
  const { continuous, intervals, stations } = data.run_types
  const volumeDelta = data.last_28_days_km - data.previous_28_days_km

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
      <StatTile label="Volume sur 28 jours" value={`${data.last_28_days_km} km`}>
        {data.previous_28_days_km} km les 28 jours d&apos;avant
        {volumeDelta !== 0 && (
          <span className={volumeDelta > 0 ? 'text-emerald-600' : 'text-orange-600'}>
            {' '}
            ({volumeDelta > 0 ? '+' : ''}
            {Math.round(volumeDelta * 10) / 10} km)
          </span>
        )}
      </StatTile>

      <StatTile
        label="Allure des sorties continues"
        value={data.recent_pace_min_km !== null ? `${formatPace(data.recent_pace_min_km)} /km` : '—'}
      >
        {data.recent_pace_min_km === null ? (
          'Il faut au moins 2 sorties continues sur 28 jours'
        ) : data.pace_change_pct !== null ? (
          <SpeedChange pct={data.pace_change_pct} suffix="vs les 28 jours d'avant" />
        ) : (
          'Pas encore de point de comparaison'
        )}
      </StatTile>

      <StatTile label="Séances sur 28 jours" value={String(continuous + intervals + stations)}>
        {plural(continuous, 'continue', 'continues')} · {plural(intervals, 'fractionné', 'fractionnés')} ·{' '}
        {plural(stations, 'à stations', 'à stations')}
      </StatTile>
    </div>
  )
}

function ZonesBar({ data }: { data: RunningResult }) {
  if (!data.zones) {
    return (
      <EmptyHint>
        Zones cardiaques indisponibles : elles ne comptent que pour les imports faits avec ta FC max (ou ta date de
        naissance) renseignée dans ton profil. Elles apparaîtront avec tes prochaines sorties.
      </EmptyHint>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">Temps de course par zone cardiaque</p>
      <div className="flex h-3 rounded-full overflow-hidden bg-secondary">
        {data.zones.map(zone => (
          <div
            key={zone.zone}
            className={ZONE_COLORS[zone.zone] ?? 'bg-primary'}
            style={{ width: `${zone.share_pct}%` }}
            title={`Zone ${zone.zone} (${zone.label}) : ${zone.share_pct} %`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {data.zones.map(zone => (
          <span key={zone.zone} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className={`w-2 h-2 rounded-full ${ZONE_COLORS[zone.zone] ?? 'bg-primary'}`} />Z{zone.zone}{' '}
            {zone.label} · {zone.share_pct} %
          </span>
        ))}
      </div>
    </div>
  )
}

function SegmentRow({ segment }: { segment: RunSegmentAnalysis }) {
  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="px-2 py-0.5 rounded text-[10px] font-medium border bg-secondary border-border text-muted-foreground">
            {segment.kind === 'stations' ? 'Stations' : 'Tours'}
          </span>
          <span className="text-sm text-foreground whitespace-nowrap">{formatDate(segment.session_date)}</span>
        </div>
        <div className="text-right shrink-0">
          {segment.drift_pct !== null ? (
            <SpeedChange pct={segment.drift_pct} suffix="1er → dernier" />
          ) : (
            <span className="text-xs text-muted-foreground">{segment.spread_pct} % d&apos;écart rapide/lent</span>
          )}
        </div>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {segment.paces_min_km.map((pace, index) => (
          <span key={index} className="px-1.5 py-0.5 rounded bg-secondary text-[11px] font-mono text-foreground">
            {formatPace(pace)}
          </span>
        ))}
      </div>
    </div>
  )
}

function SimulationCard({ simulation }: { simulation: HyroxSimulationProgress }) {
  const { latest } = simulation
  return (
    <div className="border border-border rounded-lg p-3.5 space-y-2.5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-foreground">Simulation {simulation.format}</p>
          <p className="text-xs text-muted-foreground">
            {plural(simulation.count, 'réalisée', 'réalisées')} · dernière le {formatDate(latest.session_date)}
          </p>
        </div>
        <div className="text-right shrink-0">
          <p className="font-mono font-semibold text-foreground">{formatDuration(latest.total_seconds)}</p>
          {simulation.delta_pct !== null ? (
            <SpeedChange pct={simulation.delta_pct} suffix="vs la précédente" />
          ) : (
            <p className="text-xs text-muted-foreground">Première de ce format</p>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex h-2.5 rounded-full overflow-hidden bg-secondary">
          <div className="bg-primary" style={{ width: `${latest.run_share_pct}%` }} />
          <div className="bg-sky-500" style={{ width: `${100 - latest.run_share_pct}%` }} />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>
            Course {formatDuration(latest.run_seconds)} ({latest.run_share_pct} %)
            {latest.run_drift_pct !== null && (
              <>
                {' · allure '}
                {latest.run_drift_pct > 0 ? '+' : ''}
                {latest.run_drift_pct} % du 1er au dernier km
              </>
            )}
          </span>
          <span>
            Stations {formatDuration(latest.station_seconds)} ({100 - latest.run_share_pct} %)
          </span>
        </div>
      </div>
    </div>
  )
}

function SimulationsBlock({ simulations }: { simulations: HyroxSimulationProgress[] }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Timer className="w-4 h-4 text-muted-foreground" />
        <p className="text-sm font-medium text-foreground">Simulations Hyrox</p>
      </div>
      {simulations.length === 0 ? (
        <EmptyHint>
          Aucune simulation pour l&apos;instant. Une séance compte comme simulation quand elle enchaîne au moins 4 courses
          d&apos;environ 1 km avec des stations entre elles : importe tous ses fichiers .fit, courses et stations. Chaque
          format (4 × 1 km, 8 × 1 km) n&apos;est comparé qu&apos;à lui-même.
        </EmptyHint>
      ) : (
        <div className="space-y-2.5">
          {simulations.map(simulation => (
            <SimulationCard key={simulation.format} simulation={simulation} />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Course à pied, calculée par le backend à partir des fichiers .fit importés au log de séance
 * (voir backend/src/analytics/calculators/running.ts). Aucune donnée n'est recalculée ici.
 */
export function RunningPanel({ data }: { data: RunningResult }) {
  const icon = <Footprints className="w-4.5 h-4.5" />

  if (!data.available) {
    return (
      <Section title="Course à pied" icon={icon}>
        <EmptyHint>
          Aucune course importée sur la période. Importe le fichier .fit de ta montre au log de séance pour suivre ton
          volume, ton allure et tes simulations Hyrox.
        </EmptyHint>
        {data.hyrox_simulations.length > 0 && <SimulationsBlock simulations={data.hyrox_simulations} />}
      </Section>
    )
  }

  return (
    <Section
      title="Course à pied"
      subtitle={`${data.total_distance_km} km courus sur la période, d'après tes fichiers .fit`}
      icon={icon}
    >
      <SummaryTiles data={data} />
      <ZonesBar data={data} />

      {data.segments.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Tenue d&apos;allure</p>
          <div className="space-y-2">
            {data.segments.map(segment => (
              <SegmentRow key={`${segment.session_date}-${segment.kind}`} segment={segment} />
            ))}
          </div>
        </div>
      )}

      <SimulationsBlock simulations={data.hyrox_simulations} />
    </Section>
  )
}
