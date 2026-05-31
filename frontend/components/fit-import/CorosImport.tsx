'use client'

import { FitActivity, getSportLabel, HrZoneData, MultiActivityFitData, parseFitFiles } from '@/services/fit-import'
import { useRef, useState } from 'react'
import { toast } from 'sonner'

const ZONE_COLORS = ['#64748b', '#22c55e', '#3b82f6', '#f97316', '#ef4444']

function HrZonesChart({ zones, totalSeconds }: { zones: HrZoneData[]; totalSeconds: number }) {
  const total = totalSeconds || zones.reduce((s, z) => s + z.seconds, 0)
  return (
    <div className="space-y-2 pt-1">
      <p className="text-xs text-slate-400 font-medium">Zones de fréquence cardiaque</p>
      {zones.map((z, i) => {
        const pct = total > 0 ? Math.round((z.seconds / total) * 100) : 0
        const mm = Math.floor(z.seconds / 60)
        const ss = String(Math.floor(z.seconds % 60)).padStart(2, '0')
        return (
          <div key={z.zone} className="flex items-center gap-2">
            <span className="text-xs text-slate-400 w-20 shrink-0">{z.label}</span>
            <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: ZONE_COLORS[i] }} />
            </div>
            <span className="text-xs text-slate-400 w-16 text-right shrink-0">{mm}:{ss} ({pct}%)</span>
          </div>
        )
      })}
    </div>
  )
}

function ActivityCard({ activity, idx, total }: { activity: FitActivity; idx: number; total: number }) {
  const isRun = activity.sport?.toLowerCase().includes('run')
  const label = getSportLabel(activity.sport, idx, total)
  const dur = activity.duration_seconds
    ? `${Math.floor(activity.duration_seconds / 60)}:${String(Math.floor(activity.duration_seconds % 60)).padStart(2, '0')}`
    : null
  return (
    <div className={`rounded-xl p-3 border ${isRun ? 'bg-green-500/5 border-green-500/20' : 'bg-white/5 border-white/10'}`}>
      <div className="flex items-center gap-2 mb-2">
        <span className={`text-sm font-semibold ${isRun ? 'text-green-300' : 'text-slate-200'}`}>{label}</span>
        {dur && <span className="ml-auto text-xs text-slate-400">{dur}</span>}
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        {isRun && activity.avg_pace_min_km && (
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-green-400">
              {Math.floor(activity.avg_pace_min_km)}:{String(Math.round((activity.avg_pace_min_km % 1) * 60)).padStart(2, '0')}
            </p>
            <p className="text-slate-500 text-xs">min/km</p>
          </div>
        )}
        {isRun && activity.distance_meters && activity.distance_meters > 0 && (
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-blue-400">{(activity.distance_meters / 1000).toFixed(2)} km</p>
            <p className="text-slate-500 text-xs">Distance</p>
          </div>
        )}
        {activity.avg_heart_rate && (
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-rose-400">{activity.avg_heart_rate} bpm</p>
            <p className="text-slate-500 text-xs">FC moy.</p>
          </div>
        )}
        {activity.max_heart_rate && (
          <div className="bg-white/5 rounded-lg p-2 text-center">
            <p className="text-sm font-bold text-rose-300">{activity.max_heart_rate} bpm</p>
            <p className="text-slate-500 text-xs">FC max</p>
          </div>
        )}
      </div>
    </div>
  )
}

interface Props {
  accentColor?: string
  onImport?: (data: MultiActivityFitData) => void
  onClear?: () => void
}

export function CorosImport({ accentColor = 'orange', onImport, onClear }: Props) {
  const [fitData, setFitData] = useState<MultiActivityFitData | null>(null)
  const [isParsing, setIsParsing] = useState(false)
  const fitInputRef = useRef<HTMLInputElement>(null)

  const focusColor = {
    orange: 'hover:border-orange-500/50',
    violet: 'hover:border-violet-500/50',
    yellow: 'hover:border-yellow-500/50',
    cyan: 'hover:border-cyan-500/50',
    purple: 'hover:border-purple-500/50',
  }[accentColor] ?? 'hover:border-orange-500/50'

  const spinColor = {
    orange: 'border-orange-500',
    violet: 'border-violet-500',
    yellow: 'border-yellow-500',
    cyan: 'border-cyan-500',
    purple: 'border-purple-500',
  }[accentColor] ?? 'border-orange-500'

  const handleFiles = async (files: FileList) => {
    const fileArray = Array.from(files)
    try {
      setIsParsing(true)
      const data = await parseFitFiles(fileArray)
      setFitData(data)
      onImport?.(data)
      const runCount = data.activities.filter(a => a.sport?.toLowerCase().includes('run')).length
      const label = fileArray.length > 1
        ? `${fileArray.length} activités importées (${runCount} course${runCount > 1 ? 's' : ''})`
        : 'Activité .fit importée'
      toast.success(label)
    } catch {
      toast.error('Impossible de lire le(s) fichier(s) .fit')
    } finally {
      setIsParsing(false)
    }
  }

  const handleClear = () => {
    setFitData(null)
    onClear?.()
    if (fitInputRef.current) fitInputRef.current.value = ''
  }

  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Données Coros</h2>
          <p className="text-xs text-slate-500 mt-0.5">Optionnel — importe ton .fit pour enrichir le log</p>
        </div>
        {fitData && (
          <button onClick={handleClear} className="text-slate-400 hover:text-white transition-colors text-xl leading-none">
            &times;
          </button>
        )}
      </div>

      {!fitData ? (
        <button
          onClick={() => fitInputRef.current?.click()}
          disabled={isParsing}
          className={`w-full flex items-center justify-center gap-3 py-4 border border-dashed border-slate-600 ${focusColor} hover:bg-white/5 rounded-xl transition-all text-slate-400 hover:text-white disabled:opacity-50`}
        >
          <input
            ref={fitInputRef}
            type="file"
            accept=".fit"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files) }}
          />
          {isParsing ? (
            <>
              <div className={`w-4 h-4 border-2 ${spinColor} border-t-transparent rounded-full animate-spin`} />
              <span className="text-sm">Analyse en cours...</span>
            </>
          ) : (
            <div className="text-left">
              <p className="text-sm font-medium">Importer des fichiers .fit</p>
              <p className="text-xs text-slate-500">1 fichier ou plusieurs (ex: Murph = course + muscu + course)</p>
            </div>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          {fitData.activities.map((activity, idx) => (
            <ActivityCard key={idx} activity={activity} idx={idx} total={fitData.activities.length} />
          ))}

          <div className="pt-1 border-t border-white/10">
            <p className="text-xs text-slate-500 mb-2">Totaux</p>
            <div className="grid grid-cols-3 gap-2">
              {fitData.totals.calories && (
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-orange-400">{fitData.totals.calories}</p>
                  <p className="text-slate-500 text-xs mt-0.5">Calories</p>
                </div>
              )}
              {fitData.totals.distance_meters && fitData.totals.distance_meters > 0 && (
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-blue-400">{(fitData.totals.distance_meters / 1000).toFixed(2)} km</p>
                  <p className="text-slate-500 text-xs mt-0.5">Distance</p>
                </div>
              )}
              {fitData.totals.duration_seconds > 0 && (
                <div className="bg-white/5 rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-slate-300">
                    {Math.floor(fitData.totals.duration_seconds / 60)}:{String(Math.floor(fitData.totals.duration_seconds % 60)).padStart(2, '0')}
                  </p>
                  <p className="text-slate-500 text-xs mt-0.5">Durée totale</p>
                </div>
              )}
            </div>
          </div>

          {fitData.totals.hr_zones && fitData.totals.hr_zones.length > 0 && (
            <HrZonesChart zones={fitData.totals.hr_zones} totalSeconds={fitData.totals.duration_seconds} />
          )}
        </div>
      )}
    </div>
  )
}
