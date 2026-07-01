'use client'

import { useState } from 'react'
import { FitnessProfile, ProgressionReport, SportType, TypeTrend, useProgressionReport } from '../_hooks/useProgressionReport'

const TREND_CONFIG = {
  improving: { icon: '▲', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', label: 'En progression' },
  stable: { icon: '=', color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20', label: 'Stable' },
  declining: { icon: '▼', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: 'En baisse' },
}

const SPORT_CONFIG: Record<SportType, { label: string; icon: string; color: string }> = {
  crossfit: { label: 'CrossFit', icon: '🔥', color: 'orange' },
  running: { label: 'Running', icon: '🏃', color: 'green' },
  biking: { label: 'Vélo', icon: '🚴', color: 'blue' },
  global: { label: 'Multi-sport', icon: '🌐', color: 'slate' },
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  elite: 'Élite',
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
  intermediate: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  advanced: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  elite: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
}

const FITNESS_LABELS: Record<keyof FitnessProfile, string> = {
  cardio: 'Cardio',
  strength: 'Force',
  work_capacity: 'Capacité de travail',
  endurance: 'Endurance',
}

function TrendBadge({ trend }: { trend: TypeTrend['trend'] }) {
  const cfg = TREND_CONFIG[trend]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
      {cfg.icon} {cfg.label}
    </span>
  )
}

function FitnessProfileCard({ profile, level }: { profile: FitnessProfile; level?: string }) {
  return (
    <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🧬</span>
        <div>
          <h3 className="font-semibold text-white">Profil de condition physique</h3>
          {level && <p className="text-xs text-slate-400 mt-0.5">{level}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(Object.entries(profile) as [keyof FitnessProfile, string][]).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
            <span className="text-xs text-slate-400">{FITNESS_LABELS[key]}</span>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${LEVEL_COLORS[value] ?? LEVEL_COLORS.intermediate}`}>
              {LEVEL_LABELS[value] ?? value}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ReportContent({ report }: { report: ProgressionReport }) {
  const overallCfg = TREND_CONFIG[report.overall_trend]

  return (
    <div className="space-y-5">
      {/* Résumé global */}
      <div className={`p-5 rounded-2xl border ${overallCfg.bg}`}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest">
            Bilan {report.period_months} mois
          </h3>
          <TrendBadge trend={report.overall_trend} />
        </div>
        <p className="text-slate-200 leading-relaxed">{report.period_summary}</p>
      </div>

      {/* Profil fitness (global uniquement) */}
      {report.fitness_profile && (
        <FitnessProfileCard profile={report.fitness_profile} level={report.overall_fitness_level} />
      )}

      {/* Équilibre multi-sport (global uniquement) */}
      {report.sport_balance_feedback && (
        <div className="p-4 bg-blue-500/5 border border-blue-500/15 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <span>⚖️</span>
            <h3 className="text-sm font-semibold text-slate-300">Équilibre entre disciplines</h3>
          </div>
          <p className="text-sm text-slate-400">{report.sport_balance_feedback}</p>
        </div>
      )}

      {/* Highlights */}
      {report.highlights.length > 0 && (
        <div className="p-5 bg-orange-500/5 border border-orange-500/15 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🏆</span>
            <h3 className="font-semibold text-white">Points marquants</h3>
          </div>
          <ul className="space-y-2">
            {report.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-orange-400 mt-0.5 shrink-0">→</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Performances notables */}
      {report.performance_highlights && report.performance_highlights.length > 0 && (
        <div className="p-5 bg-violet-500/5 border border-violet-500/15 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚡</span>
            <h3 className="font-semibold text-white">Performances notables</h3>
          </div>
          <ul className="space-y-2">
            {report.performance_highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-violet-400 mt-0.5 shrink-0">▸</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Progression de force */}
      {report.strength_progression && (
        <div className="p-4 bg-rose-500/5 border border-rose-500/15 rounded-xl">
          <div className="flex items-center gap-2 mb-1">
            <span>🏋️</span>
            <h3 className="text-sm font-semibold text-slate-300">Progression des charges</h3>
          </div>
          <p className="text-sm text-slate-400">{report.strength_progression}</p>
        </div>
      )}

      {/* Mouvements à travailler */}
      {report.movement_focus && report.movement_focus.length > 0 && (
        <div className="p-5 bg-cyan-500/5 border border-cyan-500/15 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🎯</span>
            <h3 className="font-semibold text-white">Focus mouvements</h3>
          </div>
          <ul className="space-y-2">
            {report.movement_focus.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                <span className="text-cyan-400 mt-0.5 shrink-0">→</span>
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tendances par type */}
      {report.type_trends.length > 0 && (
        <div>
          <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
            <span>📊</span> Tendances par type
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.type_trends.map((t, i) => (
              <div key={i} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-white text-sm capitalize">{t.type.replace(/_/g, ' ')}</span>
                  <TrendBadge trend={t.trend} />
                </div>
                <p className="text-xs text-slate-400 mb-1">{t.detail}</p>
                <p className="text-[10px] text-slate-500">{t.session_count} séance{t.session_count > 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Points forts / axes de progression */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {report.strengths.length > 0 && (
          <div className="p-5 bg-emerald-500/5 border border-emerald-500/15 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💪</span>
              <h3 className="font-semibold text-white">Points forts</h3>
            </div>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-emerald-400 mt-0.5 shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.weak_points.length > 0 && (
          <div className="p-5 bg-amber-500/5 border border-amber-500/15 rounded-2xl">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎯</span>
              <h3 className="font-semibold text-white">Axes de progression</h3>
            </div>
            <ul className="space-y-2">
              {report.weak_points.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-amber-400 mt-0.5 shrink-0">→</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommandations */}
      {report.recommendations.length > 0 && (
        <div className="p-5 bg-white/5 border border-white/10 rounded-2xl">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🧑‍🏫</span>
            <h3 className="font-semibold text-white">Recommandations coach</h3>
          </div>
          <ul className="space-y-2.5">
            {report.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-slate-300">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-500/20 text-orange-400 text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Régularité */}
      <div className="p-4 bg-white/3 border border-white/8 rounded-xl">
        <div className="flex items-center gap-2 mb-1">
          <span>📅</span>
          <h3 className="text-sm font-semibold text-slate-300">Régularité</h3>
        </div>
        <p className="text-sm text-slate-400">{report.consistency_feedback}</p>
      </div>

      <p className="text-[10px] text-slate-600 text-right">
        Généré le {new Date(report.generated_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
      </p>
    </div>
  )
}

interface ProgressionReportPanelProps {
  sport: SportType
}

export function ProgressionReportPanel({ sport }: ProgressionReportPanelProps) {
  const { report, loading, error, generate } = useProgressionReport(sport)
  const [selectedMonths, setSelectedMonths] = useState(3)
  const cfg = SPORT_CONFIG[sport]

  return (
    <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">{cfg.icon}</span>
            <h2 className="text-xl font-bold text-white">
              Bilan IA — {cfg.label}
            </h2>
          </div>
          <p className="text-sm text-slate-400">
            {sport === 'global'
              ? 'Analyse ta condition physique globale sur toutes tes disciplines'
              : `L'IA analyse toutes tes séances ${cfg.label} et te donne un retour de coach`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedMonths}
            onChange={e => setSelectedMonths(Number(e.target.value))}
            className="bg-white/10 border border-white/20 text-slate-300 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-orange-500/50"
          >
            <option value={1}>1 mois</option>
            <option value={3}>3 mois</option>
            <option value={6}>6 mois</option>
          </select>
          <button
            onClick={() => generate(selectedMonths)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-300 rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-orange-400/30 border-t-orange-400 rounded-full animate-spin" />
                Analyse…
              </>
            ) : (
              <>✨ {report ? 'Régénérer' : 'Générer mon bilan'}</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm mb-4">
          {error}
        </div>
      )}

      {!report && !loading && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <span className="text-4xl mb-3 opacity-30">{cfg.icon}</span>
          <p className="text-slate-400 mb-1">Ton bilan IA est prêt à être généré</p>
          <p className="text-xs text-slate-500">L'analyse prend environ 5-10 secondes</p>
        </div>
      )}

      {report && !loading && <ReportContent report={report} />}
    </div>
  )
}
