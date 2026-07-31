'use client'

import { formatPace, RunningStats, RUN_TYPE_LABELS } from '@/services/running'
import { RunningSegment } from '@/services/sessions'
import { Calendar, Clock, Gauge, Route } from 'lucide-react'
import Link from 'next/link'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { StatsCard } from './StatsCard'

interface RunningStatsPanelProps {
  stats: RunningStats | null
  loading: boolean
  wodSegments?: RunningSegment[]
  wodSegmentsLoading?: boolean
}

function WodRunningChart({ segments }: { segments: RunningSegment[] }) {
  // Trie du plus ancien au plus récent, puis ne garde que les 20 derniers
  const sorted = [...segments]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-20)

  const data = sorted.map(s => ({
    date: new Date(s.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    pace: s.avg_pace_min_km,
    label: s.workout_name ?? 'WOD',
    dist: (s.distance_meters / 1000).toFixed(2),
  }))

  return (
    <ResponsiveContainer width="100%" height={180}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(34 18% 85%)" />
        <XAxis dataKey="date" tick={{ fill: 'hsl(24 10% 42%)', fontSize: 11 }} />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fill: 'hsl(24 10% 42%)', fontSize: 11 }}
          tickFormatter={(v) => {
            const min = Math.floor(v)
            const sec = Math.round((v % 1) * 60)
            return `${min}:${String(sec).padStart(2, '0')}`
          }}
        />
        <Tooltip
          contentStyle={{ background: 'hsl(40 33% 99%)', border: '1px solid hsl(34 18% 85%)', borderRadius: 8 }}
          labelStyle={{ color: 'hsl(24 10% 42%)', fontSize: 12 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: number) =>
            `${Math.floor(value)}:${String(Math.round((value % 1) * 60)).padStart(2, '0')} min/km`
          ) as any}
        />
        <Line
          type="monotone"
          dataKey="pace"
          stroke="#ea580c"
          strokeWidth={2}
          dot={{ fill: '#ea580c', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function RunningStatsPanel({ stats, loading, wodSegments = [], wodSegmentsLoading = false }: RunningStatsPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    )
  }

  if (!stats || stats.total_sessions === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-muted-foreground mb-4">Aucune séance running enregistrée</p>
        <Link
          href="/running"
          className="px-4 py-2 bg-orange-600/10 text-orange-600 border border-orange-600/20 rounded-lg hover:bg-orange-600/15 transition-colors text-sm"
        >
          Créer une séance Running
        </Link>
      </div>
    )
  }

  const totalHoursFormatted = stats.total_hours >= 1
    ? `${Math.floor(stats.total_hours)}h${Math.round((stats.total_hours % 1) * 60).toString().padStart(2, '0')}`
    : `${Math.round(stats.total_hours * 60)}min`

  return (
    <div className="space-y-6">
      {/* Chiffres clés */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatsCard title="Séances" value={stats.total_sessions} icon={Calendar} color="orange" />
        <StatsCard title="Distance totale" value={`${stats.total_km} km`} icon={Route} color="orange" />
        <StatsCard title="Temps total" value={totalHoursFormatted} icon={Clock} color="orange" />
        <StatsCard
          title="Allure moyenne"
          value={formatPace(stats.avg_pace_seconds_per_km)}
          subtitle="min/km"
          icon={Gauge}
          color="orange"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plus longue sortie */}
        <div className="p-5 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-display font-semibold">Record de distance</h3>
          </div>
          <p className="text-3xl font-semibold text-orange-600">{stats.longest_run_km} km</p>
          <p className="text-xs text-muted-foreground mt-1">Plus longue sortie</p>
        </div>

        {/* Breakdown par type */}
        {Object.keys(stats.type_breakdown).length > 0 && (
          <div className="p-5 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-display font-semibold">Sorties par type</h3>
            </div>
            <div className="space-y-2.5">
              {Object.entries(stats.type_breakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => {
                  const pct = Math.round((count / stats.total_sessions) * 100)
                  const label = RUN_TYPE_LABELS[type as keyof typeof RUN_TYPE_LABELS] ?? type
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-xs text-foreground w-28 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-2 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-orange-600 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-6 text-right">{count}</span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>

      {/* Segments running extraits des WODs (fichiers .fit Coros) */}
      <div className="p-5 bg-card border border-border rounded-lg space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-semibold">Running dans tes WODs</h3>
          <span className="ml-auto text-xs text-muted-foreground">allure extraite des .fit Coros</span>
        </div>

        {wodSegmentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600" />
          </div>
        ) : wodSegments.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">
            Aucune donnée pour l&apos;instant — importe des .fit Coros lors du log d&apos;un WOD (ex: Murph)
          </p>
        ) : (
          <>
            <WodRunningChart segments={wodSegments} />
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="text-center">
                <p className="text-xl font-semibold text-orange-600">{wodSegments.length}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Segments</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-semibold text-orange-600">
                  {(wodSegments.reduce((s, seg) => s + seg.distance_meters, 0) / 1000).toFixed(1)} km
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">Distance totale</p>
              </div>
              <div className="text-center">
                {(() => {
                  const avgPace = wodSegments.reduce((s, seg) => s + seg.avg_pace_min_km, 0) / wodSegments.length
                  return (
                    <>
                      <p className="text-xl font-semibold text-orange-600">
                        {Math.floor(avgPace)}:{String(Math.round((avgPace % 1) * 60)).padStart(2, '0')}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Allure moy.</p>
                    </>
                  )
                })()}
              </div>
            </div>
          </>
        )}
      </div>

      <div className="flex justify-end">
        <Link
          href="/running"
          className="text-xs text-orange-600 hover:text-orange-700 transition-colors"
        >
          Voir toutes les séances →
        </Link>
      </div>
    </div>
  )
}
