'use client'

import { useState } from 'react'
import {
  BarChart3,
  Bike,
  Dna,
  Flame,
  Footprints,
  GraduationCap,
  Minus,
  Scale,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  Trophy,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { FitnessProfile, ProgressionReport, SportType, TypeTrend, useProgressionReport } from '../_hooks/useProgressionReport'

const TREND_CONFIG: Record<TypeTrend['trend'], { icon: LucideIcon; color: string; bg: string; label: string }> = {
  improving: { icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-600/10 border-emerald-600/20', label: 'En progression' },
  stable: { icon: Minus, color: 'text-muted-foreground', bg: 'bg-muted border-border', label: 'Stable' },
  declining: { icon: TrendingDown, color: 'text-destructive', bg: 'bg-destructive/10 border-destructive/20', label: 'En baisse' },
}

const SPORT_CONFIG: Record<SportType, { label: string; icon: LucideIcon; color: string }> = {
  crossfit: { label: 'CrossFit', icon: Flame, color: 'text-orange-600' },
  running: { label: 'Running', icon: Footprints, color: 'text-orange-600' },
  biking: { label: 'Vélo', icon: Bike, color: 'text-orange-600' },
  global: { label: 'Multi-sport', icon: BarChart3, color: 'text-foreground' },
}

const LEVEL_LABELS: Record<string, string> = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
  elite: 'Élite',
}

const LEVEL_COLORS: Record<string, string> = {
  beginner: 'text-muted-foreground bg-muted border-border',
  intermediate: 'text-blue-600 bg-blue-600/10 border-blue-600/20',
  advanced: 'text-orange-600 bg-orange-600/10 border-orange-600/20',
  elite: 'text-amber-600 bg-amber-600/10 border-amber-600/20',
}

const FITNESS_LABELS: Record<keyof FitnessProfile, string> = {
  cardio: 'Cardio',
  strength: 'Force',
  work_capacity: 'Capacité de travail',
  endurance: 'Endurance',
}

function TrendBadge({ trend }: { trend: TypeTrend['trend'] }) {
  const cfg = TREND_CONFIG[trend]
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${cfg.bg} ${cfg.color}`}>
      <Icon className="w-3 h-3" /> {cfg.label}
    </span>
  )
}

function FitnessProfileCard({ profile, level }: { profile: FitnessProfile; level?: string }) {
  return (
    <div className="p-5 bg-card border border-border rounded-lg">
      <div className="flex items-center gap-2 mb-4">
        <Dna className="w-4 h-4 text-muted-foreground" />
        <div>
          <h3 className="font-display font-semibold">Profil de condition physique</h3>
          {level && <p className="text-xs text-muted-foreground mt-0.5">{level}</p>}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {(Object.entries(profile) as [keyof FitnessProfile, string][]).map(([key, value]) => (
          <div key={key} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
            <span className="text-xs text-muted-foreground">{FITNESS_LABELS[key]}</span>
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
      <div className={`p-5 rounded-lg border ${overallCfg.bg}`}>
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">
            Bilan {report.period_months} mois
          </h3>
          <TrendBadge trend={report.overall_trend} />
        </div>
        <p className="text-foreground leading-relaxed">{report.period_summary}</p>
      </div>

      {/* Profil fitness (global uniquement) */}
      {report.fitness_profile && (
        <FitnessProfileCard profile={report.fitness_profile} level={report.overall_fitness_level} />
      )}

      {/* Équilibre multi-sport (global uniquement) */}
      {report.sport_balance_feedback && (
        <div className="p-4 bg-blue-600/5 border border-blue-600/15 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <Scale className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-foreground">Équilibre entre disciplines</h3>
          </div>
          <p className="text-sm text-muted-foreground">{report.sport_balance_feedback}</p>
        </div>
      )}

      {/* Highlights */}
      {report.highlights.length > 0 && (
        <div className="p-5 bg-orange-600/5 border border-orange-600/15 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Trophy className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-display font-semibold">Points marquants</h3>
          </div>
          <ul className="space-y-2">
            {report.highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-orange-600 mt-0.5 shrink-0">→</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Performances notables */}
      {report.performance_highlights && report.performance_highlights.length > 0 && (
        <div className="p-5 bg-violet-600/5 border border-violet-600/15 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-display font-semibold">Performances notables</h3>
          </div>
          <ul className="space-y-2">
            {report.performance_highlights.map((h, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-violet-600 mt-0.5 shrink-0">▸</span>
                {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Progression de force */}
      {report.strength_progression && (
        <div className="p-4 bg-rose-600/5 border border-rose-600/15 rounded-lg">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-lg">🏋️</span>
            <h3 className="text-sm font-semibold text-foreground">Progression des charges</h3>
          </div>
          <p className="text-sm text-muted-foreground">{report.strength_progression}</p>
        </div>
      )}

      {/* Mouvements à travailler */}
      {report.movement_focus && report.movement_focus.length > 0 && (
        <div className="p-5 bg-cyan-600/5 border border-cyan-600/15 rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-display font-semibold">Focus mouvements</h3>
          </div>
          <ul className="space-y-2">
            {report.movement_focus.map((m, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-cyan-600 mt-0.5 shrink-0">→</span>
                {m}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tendances par type */}
      {report.type_trends.length > 0 && (
        <div>
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" /> Tendances par type
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {report.type_trends.map((t, i) => (
              <div key={i} className="p-4 bg-card border border-border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-foreground text-sm capitalize">{t.type.replace(/_/g, ' ')}</span>
                  <TrendBadge trend={t.trend} />
                </div>
                <p className="text-xs text-muted-foreground mb-1">{t.detail}</p>
                <p className="text-[10px] text-muted-foreground">{t.session_count} séance{t.session_count > 1 ? 's' : ''}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Points forts / axes de progression */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {report.strengths.length > 0 && (
          <div className="p-5 bg-emerald-600/5 border border-emerald-600/15 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">💪</span>
              <h3 className="font-display font-semibold">Points forts</h3>
            </div>
            <ul className="space-y-2">
              {report.strengths.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="text-emerald-600 mt-0.5 shrink-0">✓</span>
                  {s}
                </li>
              ))}
            </ul>
          </div>
        )}

        {report.weak_points.length > 0 && (
          <div className="p-5 bg-amber-600/5 border border-amber-600/15 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-display font-semibold">Axes de progression</h3>
            </div>
            <ul className="space-y-2">
              {report.weak_points.map((w, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="text-amber-600 mt-0.5 shrink-0">→</span>
                  {w}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Recommandations */}
      {report.recommendations.length > 0 && (
        <div className="p-5 bg-card border border-border rounded-lg">
          <div className="flex items-center gap-2 mb-3">
            <GraduationCap className="w-4 h-4 text-muted-foreground" />
            <h3 className="font-display font-semibold">Recommandations coach</h3>
          </div>
          <ul className="space-y-2.5">
            {report.recommendations.map((r, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                <span className="flex-shrink-0 w-5 h-5 rounded-full bg-orange-600/10 text-orange-600 text-xs flex items-center justify-center font-semibold">
                  {i + 1}
                </span>
                {r}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Régularité */}
      <div className="p-4 bg-secondary/60 border border-border rounded-lg">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">📅</span>
          <h3 className="text-sm font-semibold text-foreground">Régularité</h3>
        </div>
        <p className="text-sm text-muted-foreground">{report.consistency_feedback}</p>
      </div>

      <p className="text-[10px] text-muted-foreground text-right">
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
  const SportIcon = cfg.icon

  return (
    <div className="p-6 bg-card border border-border rounded-lg">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SportIcon className={`w-4 h-4 ${cfg.color}`} />
            <h2 className="font-display text-xl font-semibold">
              Bilan IA — {cfg.label}
            </h2>
          </div>
          <p className="text-sm text-muted-foreground">
            {sport === 'global'
              ? 'Analyse ta condition physique globale sur toutes tes disciplines'
              : `L'IA analyse toutes tes séances ${cfg.label} et te donne un retour de coach`}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select
            value={selectedMonths}
            onChange={e => setSelectedMonths(Number(e.target.value))}
            className="bg-secondary border border-border text-foreground text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-primary/50"
          >
            <option value={1}>1 mois</option>
            <option value={3}>3 mois</option>
            <option value={6}>6 mois</option>
          </select>
          <button
            onClick={() => generate(selectedMonths)}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-sm font-medium transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                Analyse…
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> {report ? 'Régénérer' : 'Générer mon bilan'}
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm mb-4">
          {error}
        </div>
      )}

      {!report && !loading && (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <SportIcon className="w-10 h-10 text-muted-foreground opacity-40 mb-3" />
          <p className="text-muted-foreground mb-1">Ton bilan IA est prêt à être généré</p>
          <p className="text-xs text-muted-foreground">L'analyse prend environ 5-10 secondes</p>
        </div>
      )}

      {report && !loading && <ReportContent report={report} />}
    </div>
  )
}
