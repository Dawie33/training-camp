'use client'

import { useState } from 'react'
import { ProgressionReport, SportType } from '../_hooks/useProgressionReport'
import { useReportsHistory } from '../_hooks/useReportsHistory'

const SPORT_CONFIG: Record<SportType, { label: string; icon: string; color: string; border: string }> = {
  crossfit: { label: 'CrossFit', icon: '🔥', color: 'text-orange-300', border: 'border-orange-500/20' },
  running: { label: 'Running', icon: '🏃', color: 'text-green-300', border: 'border-green-500/20' },
  hyrox: { label: 'HYROX', icon: '🏟️', color: 'text-yellow-300', border: 'border-yellow-500/20' },
  athx: { label: 'ATHX', icon: '⚡', color: 'text-purple-300', border: 'border-purple-500/20' },
  global: { label: 'Multi-sport', icon: '🌐', color: 'text-blue-300', border: 'border-blue-500/20' },
}

const TREND_CONFIG = {
  improving: { icon: '▲', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'En progression' },
  stable: { icon: '=', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', label: 'Stable' },
  declining: { icon: '▼', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'En baisse' },
}

const SPORT_ORDER: SportType[] = ['global', 'crossfit', 'running', 'hyrox', 'athx']

function BilanCard({ report }: { report: ProgressionReport }) {
  const [expanded, setExpanded] = useState(false)
  const sport = SPORT_CONFIG[report.sport]
  const trend = TREND_CONFIG[report.overall_trend]
  const date = new Date(report.generated_at).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className={`bg-white/5 border ${sport.border} rounded-2xl overflow-hidden transition-all`}>
      {/* En-tête cliquable */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full p-5 flex items-start justify-between gap-4 text-left hover:bg-white/5 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl shrink-0">{sport.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={`font-semibold ${sport.color}`}>{sport.label}</span>
              <span className="text-xs text-slate-500">·</span>
              <span className="text-xs text-slate-400">{report.period_months} mois</span>
            </div>
            <p className="text-sm text-slate-400 line-clamp-2 leading-relaxed">{report.period_summary}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2 shrink-0">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${trend.bg} ${trend.color}`}>
            {trend.icon} {trend.label}
          </span>
          <span className="text-[10px] text-slate-500">{date}</span>
          <span className={`text-xs text-slate-500 transition-transform ${expanded ? 'rotate-180' : ''}`}>▾</span>
        </div>
      </button>

      {/* Détail expandable */}
      {expanded && (
        <div className="border-t border-white/10 p-5 space-y-4">

          {report.performance_highlights && report.performance_highlights.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">⚡ Performances notables</p>
              <ul className="space-y-1">
                {report.performance_highlights.map((h, i) => (
                  <li key={i} className="text-sm text-slate-300 flex gap-2">
                    <span className="text-violet-400 shrink-0">▸</span>{h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.highlights.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">🏆 Points marquants</p>
              <ul className="space-y-1">
                {report.highlights.map((h, i) => (
                  <li key={i} className="text-sm text-slate-300 flex gap-2">
                    <span className="text-orange-400 shrink-0">→</span>{h}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {report.strengths.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">💪 Points forts</p>
                <ul className="space-y-1">
                  {report.strengths.map((s, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-emerald-400 shrink-0">✓</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {report.weak_points.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">🎯 Axes de progression</p>
                <ul className="space-y-1">
                  {report.weak_points.map((w, i) => (
                    <li key={i} className="text-sm text-slate-300 flex gap-2">
                      <span className="text-amber-400 shrink-0">→</span>{w}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {report.movement_focus && report.movement_focus.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">🎯 Focus mouvements</p>
              <ul className="space-y-1">
                {report.movement_focus.map((m, i) => (
                  <li key={i} className="text-sm text-slate-300 flex gap-2">
                    <span className="text-cyan-400 shrink-0">→</span>{m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.recommendations.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">🧑‍🏫 Recommandations</p>
              <ul className="space-y-1.5">
                {report.recommendations.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-xs flex items-center justify-center font-bold shrink-0">
                      {i + 1}
                    </span>
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {report.strength_progression && (
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-1">🏋️ Progression des charges</p>
              <p className="text-sm text-slate-300">{report.strength_progression}</p>
            </div>
          )}

          <p className="text-sm text-slate-400 italic border-t border-white/10 pt-3">{report.consistency_feedback}</p>
        </div>
      )}
    </div>
  )
}

export function BilansHistoryPanel() {
  const { reports, loading } = useReportsHistory()

  const sorted = [...reports].sort(
    (a, b) => SPORT_ORDER.indexOf(a.sport) - SPORT_ORDER.indexOf(b.sport),
  )

  return (
    <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
      <div className="flex items-center gap-2 mb-6">
        <span className="text-lg">🗂️</span>
        <div>
          <h2 className="text-xl font-bold text-white">Historique des bilans IA</h2>
          <p className="text-sm text-slate-400 mt-0.5">Dernier bilan généré par discipline</p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400" />
        </div>
      )}

      {!loading && sorted.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="text-4xl mb-3 opacity-30">🗂️</span>
          <p className="text-slate-400">Aucun bilan généré pour le moment</p>
          <p className="text-xs text-slate-500 mt-1">Génère ton premier bilan depuis l'un des onglets</p>
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <div className="space-y-3">
          {sorted.map((report) => (
            <BilanCard key={report.sport} report={report} />
          ))}
        </div>
      )}
    </div>
  )
}
