'use client'

import type { ProgramEnrollment } from '@/domain/entities/training-program'
import { LEVEL_LABELS, PROGRAM_TYPE_LABELS } from '@/domain/entities/training-program'
import { motion } from 'framer-motion'
import { Pause, Play, SkipForward, Trash2 } from 'lucide-react'

interface ProgramOverviewProps {
  enrollment: ProgramEnrollment
  onStart: () => void
  onPause: () => void
  onAbandon: () => void
  onAdvanceWeek: () => void
}

const STATUS_CONFIG = {
  enrolled: { label: 'Inscrit', color: 'text-blue-400 bg-blue-400/10 border-blue-400/20' },
  active: { label: 'En cours', color: 'text-green-400 bg-green-400/10 border-green-400/20' },
  paused: { label: 'En pause', color: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20' },
  completed: { label: 'Terminé', color: 'text-violet-400 bg-violet-400/10 border-violet-400/20' },
  abandoned: { label: 'Abandonné', color: 'text-slate-400 bg-slate-400/10 border-slate-400/20' },
}

export function ProgramOverview({ enrollment, onStart, onPause, onAbandon, onAdvanceWeek }: ProgramOverviewProps) {
  const statusCfg = STATUS_CONFIG[enrollment.status] ?? STATUS_CONFIG.enrolled
  const progressPercent = Math.round(enrollment.completion_percentage)

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-bold text-white truncate">{enrollment.program_name}</h2>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${statusCfg.color}`}>
              {statusCfg.label}
            </span>
          </div>
          <p className="text-sm text-slate-400 line-clamp-2">{enrollment.program_description}</p>
        </div>
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Type', value: PROGRAM_TYPE_LABELS[enrollment.program_type] ?? enrollment.program_type },
          { label: 'Niveau', value: LEVEL_LABELS[enrollment.target_level] ?? enrollment.target_level },
          { label: 'Durée', value: `${enrollment.duration_weeks} semaines` },
          { label: 'Séances/sem.', value: enrollment.sessions_per_week.toString() },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white/5 rounded-xl p-3">
            <div className="text-xs text-slate-400">{label}</div>
            <div className="text-sm font-semibold text-white mt-0.5">{value}</div>
          </div>
        ))}
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">
            Semaine {enrollment.current_week} / {enrollment.duration_weeks}
          </span>
          <span className="text-white font-medium">{progressPercent}%</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2">
          <div
            className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-rose-400 transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="text-xs text-slate-500">
          {enrollment.completed_sessions} / {enrollment.total_sessions} séances complètes
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 flex-wrap">
        {enrollment.status === 'enrolled' && (
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all text-sm font-medium"
          >
            <Play className="w-4 h-4" />
            Démarrer le programme
          </button>
        )}
        {enrollment.status === 'active' && (
          <>
            <button
              onClick={onPause}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 hover:bg-yellow-500/30 transition-all text-sm font-medium"
            >
              <Pause className="w-4 h-4" />
              Pause
            </button>
            <button
              onClick={onAdvanceWeek}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 hover:bg-blue-500/30 transition-all text-sm font-medium"
            >
              <SkipForward className="w-4 h-4" />
              Semaine suivante
            </button>
          </>
        )}
        {enrollment.status === 'paused' && (
          <button
            onClick={onStart}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-all text-sm font-medium"
          >
            <Play className="w-4 h-4" />
            Reprendre
          </button>
        )}
        {['enrolled', 'active', 'paused'].includes(enrollment.status) && (
          <button
            onClick={onAbandon}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-all text-sm"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Abandonner
          </button>
        )}
      </div>
    </motion.div>
  )
}
