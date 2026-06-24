'use client'

import { formatPace, RunningStats, RUN_TYPE_LABELS } from '@/services/running'
import { RunningSegment } from '@/services/sessions'
import Link from 'next/link'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'

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
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
        <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 11 }} />
        <YAxis
          domain={['auto', 'auto']}
          tick={{ fill: '#94a3b8', fontSize: 11 }}
          tickFormatter={(v) => {
            const min = Math.floor(v)
            const sec = Math.round((v % 1) * 60)
            return `${min}:${String(sec).padStart(2, '0')}`
          }}
        />
        <Tooltip
          contentStyle={{ background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }}
          labelStyle={{ color: '#94a3b8', fontSize: 12 }}
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          formatter={((value: number) =>
            `${Math.floor(value)}:${String(Math.round((value % 1) * 60)).padStart(2, '0')} min/km`
          ) as any}
        />
        <Line
          type="monotone"
          dataKey="pace"
          stroke="#22c55e"
          strokeWidth={2}
          dot={{ fill: '#22c55e', r: 3 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
      <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
  )
}

export function RunningStatsPanel({ stats, loading, wodSegments = [], wodSegmentsLoading = false }: RunningStatsPanelProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400" />
      </div>
    )
  }

  if (!stats || stats.total_sessions === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-slate-400 mb-4">Aucune séance running enregistrée</p>
        <Link
          href="/running"
          className="px-4 py-2 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg hover:bg-green-500/30 transition-colors text-sm"
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
        <StatCard label="Séances" value={String(stats.total_sessions)} />
        <StatCard label="Distance totale" value={`${stats.total_km} km`} />
        <StatCard label="Temps total" value={totalHoursFormatted} />
        <StatCard
          label="Allure moyenne"
          value={formatPace(stats.avg_pace_seconds_per_km)}
          sub="min/km"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Plus longue sortie */}
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="font-semibold text-white">Record de distance</h3>
          </div>
          <p className="text-3xl font-bold text-green-400">{stats.longest_run_km} km</p>
          <p className="text-xs text-slate-500 mt-1">Plus longue sortie</p>
        </div>

        {/* Breakdown par type */}
        {Object.keys(stats.type_breakdown).length > 0 && (
          <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-semibold text-white">Sorties par type</h3>
            </div>
            <div className="space-y-2.5">
              {Object.entries(stats.type_breakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([type, count]) => {
                  const pct = Math.round((count / stats.total_sessions) * 100)
                  const label = RUN_TYPE_LABELS[type as keyof typeof RUN_TYPE_LABELS] ?? type
                  return (
                    <div key={type} className="flex items-center gap-3">
                      <span className="text-xs text-slate-300 w-28 flex-shrink-0">{label}</span>
                      <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-400 w-6 text-right">{count}</span>
                    </div>
                  )
                })}
            </div>
          </div>
        )}
      </div>

      {/* Segments running extraits des WODs (fichiers .fit Coros) */}
      <div className="p-5 bg-white/5 border border-white/10 rounded-2xl space-y-4">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-white">Running dans tes WODs</h3>
          <span className="ml-auto text-xs text-slate-500">allure extraite des .fit Coros</span>
        </div>

        {wodSegmentsLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-400" />
          </div>
        ) : wodSegments.length === 0 ? (
          <p className="text-slate-500 text-sm py-4 text-center">
            Aucune donnée pour l&apos;instant — importe des .fit Coros lors du log d&apos;un WOD (ex: Murph)
          </p>
        ) : (
          <>
            <WodRunningChart segments={wodSegments} />
            <div className="grid grid-cols-3 gap-3 pt-1">
              <div className="text-center">
                <p className="text-xl font-bold text-green-400">{wodSegments.length}</p>
                <p className="text-xs text-slate-500 mt-0.5">Segments</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-blue-400">
                  {(wodSegments.reduce((s, seg) => s + seg.distance_meters, 0) / 1000).toFixed(1)} km
                </p>
                <p className="text-xs text-slate-500 mt-0.5">Distance totale</p>
              </div>
              <div className="text-center">
                {(() => {
                  const avgPace = wodSegments.reduce((s, seg) => s + seg.avg_pace_min_km, 0) / wodSegments.length
                  return (
                    <>
                      <p className="text-xl font-bold text-green-300">
                        {Math.floor(avgPace)}:{String(Math.round((avgPace % 1) * 60)).padStart(2, '0')}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Allure moy.</p>
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
          className="text-xs text-green-400 hover:text-green-300 transition-colors"
        >
          Voir toutes les séances →
        </Link>
      </div>
    </div>
  )
}
