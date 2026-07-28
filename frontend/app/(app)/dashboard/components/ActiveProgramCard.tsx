'use client'

import { ActiveEnrollment, trainingProgramsApi } from '@/services/training-programs'
import { ArrowRight, Plus, Target, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

const TYPE_LABELS: Record<string, string> = {
  strength_building: 'Force',
  endurance_base: 'Endurance',
  competition_prep: 'Compétition',
  off_season: 'Off-season',
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  enrolled: { label: 'Inscrit', color: 'text-blue-400' },
  active: { label: 'En cours', color: 'text-green-400' },
  paused: { label: 'En pause', color: 'text-yellow-400' },
}

export function ActiveProgramCard() {
  const [enrollment, setEnrollment] = useState<ActiveEnrollment | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    trainingProgramsApi
      .getActive()
      .then(setEnrollment)
      .catch(() => setEnrollment(null))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
        <div className="animate-pulse space-y-3">
          <div className="h-5 bg-white/10 rounded w-1/2" />
          <div className="h-2 bg-white/10 rounded" />
          <div className="h-3 bg-white/10 rounded w-1/3" />
        </div>
      </div>
    )
  }

  // Aucun programme actif → invitation à en créer un
  if (!enrollment) {
    return (
      <Link
        href="/training-programs/generate"
        className="group flex items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl p-5 hover:bg-white/[0.07] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400/20 to-rose-500/20 border border-orange-500/20 flex items-center justify-center flex-shrink-0">
            <Trophy className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Aucun programme actif</p>
            <p className="text-xs text-slate-400 mt-0.5">
              Crée un programme structuré pour t&apos;entraîner selon tes besoins, pas juste ton humeur.
            </p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 text-xs font-semibold text-orange-400 flex-shrink-0">
          <Plus className="w-4 h-4" />
          Créer
        </span>
      </Link>
    )
  }

  const progressPct = enrollment.total_sessions
    ? Math.round((enrollment.completed_sessions / enrollment.total_sessions) * 100)
    : 0

  return (
    <Link
      href="/training-programs"
      className="group block bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 hover:bg-white/[0.07] transition-colors"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center flex-shrink-0">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                Programme
              </span>
              <span className={`text-[10px] font-semibold ${STATUS_CONFIG[enrollment.status]?.color ?? 'text-slate-400'}`}>
                {STATUS_CONFIG[enrollment.status]?.label ?? enrollment.status}
              </span>
            </div>
            <p className="font-semibold text-white text-sm truncate">{enrollment.program_name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {TYPE_LABELS[enrollment.program_type] ?? enrollment.program_type} · Semaine{' '}
              {enrollment.current_week} / {enrollment.duration_weeks}
            </p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-orange-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
      </div>

      <div className="space-y-1.5">
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-rose-400 rounded-full transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-slate-500">
          <span>
            {enrollment.completed_sessions} / {enrollment.total_sessions} séances
          </span>
          <span>{progressPct}%</span>
        </div>
      </div>
    </Link>
  )
}
