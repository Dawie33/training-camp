import { describeHrMaxReference, FitLap, getSportLabel, HrZoneData, MultiActivityFitData } from '@/services/fit-import'

const ZONE_COLORS = ['#64748b', '#22c55e', '#3b82f6', '#f97316', '#ef4444']

function HrZonesChart({ zones, totalSeconds }: { zones: HrZoneData[]; totalSeconds: number }) {
  const total = totalSeconds || zones.reduce((s, z) => s + z.seconds, 0)
  return (
    <div className="space-y-2 pt-1">
      <p className="text-xs text-muted-foreground font-medium">Zones de fréquence cardiaque</p>
      {zones.map(z => {
        const pct = total > 0 ? Math.round((z.seconds / total) * 100) : 0
        const mm = Math.floor(z.seconds / 60)
        const ss = String(Math.floor(z.seconds % 60)).padStart(2, '0')
        return (
          <div key={z.zone} className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground w-20 shrink-0">{z.label}</span>
            <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                // Couleur selon le numéro de zone : les zones vides sont retirées, l'index de la liste ne suffit pas
                style={{ width: `${pct}%`, backgroundColor: ZONE_COLORS[z.zone - 1] }}
              />
            </div>
            <span className="text-xs text-muted-foreground w-16 text-right shrink-0">{mm}:{ss} ({pct}%)</span>
          </div>
        )
      })}
    </div>
  )
}

/** Libellé d'un tour selon le type donné par la montre : une séance programmée distingue efforts et récupérations */
const LAP_INTENSITY_LABELS: Record<string, string> = {
  active: 'Effort',
  interval: 'Effort',
  rest: 'Récup',
  recovery: 'Récup',
  warmup: 'Échauffement',
  cooldown: 'Retour au calme',
}

const isEffortLap = (lap: FitLap) => lap.intensity === 'active' || lap.intensity === 'interval'

function formatClock(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(Math.round(seconds % 60)).padStart(2, '0')}`
}

function formatPace(paceMinKm: number) {
  return `${Math.floor(paceMinKm)}:${String(Math.round((paceMinKm % 1) * 60)).padStart(2, '0')}`
}

function formatDistance(meters: number) {
  return meters < 1000 ? `${Math.round(meters)} m` : `${(meters / 1000).toFixed(2)} km`
}

/** Tours de l'activité : le temps de chaque fraction, que la moyenne de la séance ne montre pas. */
function LapsTable({ laps, isRun }: { laps: FitLap[]; isRun: boolean }) {
  return (
    <div className="mt-2 overflow-x-auto bg-card rounded-lg">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-muted-foreground border-b border-border">
            <th className="hidden sm:table-cell px-2 py-1.5 font-medium">Tour</th>
            <th className="px-2 py-1.5 font-medium">Type</th>
            <th className="px-2 py-1.5 font-medium text-right">Durée</th>
            <th className="px-2 py-1.5 font-medium text-right">Distance</th>
            {isRun && <th className="px-2 py-1.5 font-medium text-right">Allure</th>}
            <th className="px-2 py-1.5 font-medium text-right">FC moy.</th>
          </tr>
        </thead>
        <tbody>
          {laps.map(lap => (
            <tr
              key={lap.index}
              className={`border-b border-border last:border-0 tabular-nums ${isEffortLap(lap) ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}
            >
              <td className="hidden sm:table-cell px-2 py-1.5">{lap.index}</td>
              <td className="px-2 py-1.5">{(lap.intensity && LAP_INTENSITY_LABELS[lap.intensity]) ?? '—'}</td>
              <td className="px-2 py-1.5 text-right">{lap.duration_seconds ? formatClock(lap.duration_seconds) : '—'}</td>
              <td className="px-2 py-1.5 text-right whitespace-nowrap">{lap.distance_meters ? formatDistance(lap.distance_meters) : '—'}</td>
              {isRun && <td className="px-2 py-1.5 text-right">{lap.avg_pace_min_km ? formatPace(lap.avg_pace_min_km) : '—'}</td>}
              <td className="px-2 py-1.5 text-right">{lap.avg_heart_rate ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/**
 * Résumé d'un ou plusieurs fichiers .fit : une carte par activité (allure, distance, FC), les totaux,
 * les zones cardiaques et la FC max qui a servi à les calculer.
 * Utilisé à l'import (page de log) et dans le détail d'une séance de l'historique.
 */
export function FitDataSummary({ data }: { data: MultiActivityFitData }) {
  return (
    <div className="space-y-3">
      {/* Activités séparées */}
      {data.activities.map((activity, idx) => {
        const isRun = activity.sport?.toLowerCase().includes('run')
        const label = getSportLabel(activity.sport, idx, data.activities.length)
        const dur = activity.duration_seconds
          ? `${Math.floor(activity.duration_seconds / 60)}:${String(Math.floor(activity.duration_seconds % 60)).padStart(2, '0')}`
          : null
        return (
          <div key={idx} className={`rounded-lg p-3 border ${isRun ? 'bg-emerald-50 border-emerald-200' : 'bg-secondary/40 border-border'}`}>
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-sm font-semibold ${isRun ? 'text-emerald-700' : 'text-foreground'}`}>{label}</span>
              {dur && <span className="ml-auto text-xs text-muted-foreground">{dur}</span>}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {isRun && activity.avg_pace_min_km && (
                <div className="bg-card rounded-lg p-2 text-center col-span-1">
                  <p className="text-sm font-bold text-emerald-700">
                    {Math.floor(activity.avg_pace_min_km)}:{String(Math.round((activity.avg_pace_min_km % 1) * 60)).padStart(2, '0')}
                  </p>
                  <p className="text-muted-foreground text-xs">min/km</p>
                </div>
              )}
              {isRun && activity.distance_meters && activity.distance_meters > 0 && (
                <div className="bg-card rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-primary">{(activity.distance_meters / 1000).toFixed(2)} km</p>
                  <p className="text-muted-foreground text-xs">Distance</p>
                </div>
              )}
              {activity.avg_heart_rate && (
                <div className="bg-card rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-destructive">{activity.avg_heart_rate} bpm</p>
                  <p className="text-muted-foreground text-xs">FC moy.</p>
                </div>
              )}
              {activity.max_heart_rate && (
                <div className="bg-card rounded-lg p-2 text-center">
                  <p className="text-sm font-bold text-destructive/80">{activity.max_heart_rate} bpm</p>
                  <p className="text-muted-foreground text-xs">FC max</p>
                </div>
              )}
            </div>
            {activity.laps && activity.laps.length > 0 && <LapsTable laps={activity.laps} isRun={!!isRun} />}
          </div>
        )
      })}

      {/* Totaux */}
      <div className="pt-1 border-t border-border">
        <p className="text-xs text-muted-foreground mb-2">Totaux</p>
        <div className="grid grid-cols-3 gap-2">
          {data.totals.calories && (
            <div className="bg-secondary/40 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-primary">{data.totals.calories}</p>
              <p className="text-muted-foreground text-xs mt-0.5">Calories</p>
            </div>
          )}
          {data.totals.distance_meters && data.totals.distance_meters > 0 && (
            <div className="bg-secondary/40 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-primary">{(data.totals.distance_meters / 1000).toFixed(2)} km</p>
              <p className="text-muted-foreground text-xs mt-0.5">Distance</p>
            </div>
          )}
          {data.totals.duration_seconds > 0 && (
            <div className="bg-secondary/40 rounded-lg p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                {Math.floor(data.totals.duration_seconds / 60)}:{String(Math.floor(data.totals.duration_seconds % 60)).padStart(2, '0')}
              </p>
              <p className="text-muted-foreground text-xs mt-0.5">Durée totale</p>
            </div>
          )}
        </div>
      </div>

      {/* Zones HR cumulées */}
      {data.totals.hr_zones && data.totals.hr_zones.length > 0 && (
        <>
          <HrZonesChart zones={data.totals.hr_zones} totalSeconds={data.totals.duration_seconds} />
          {describeHrMaxReference(data.totals.hr_max_reference) && (
            <p className="text-xs text-muted-foreground">
              {describeHrMaxReference(data.totals.hr_max_reference)}
            </p>
          )}
        </>
      )}
    </div>
  )
}
