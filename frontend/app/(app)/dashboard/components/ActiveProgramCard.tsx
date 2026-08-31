'use client'

import { ActiveEnrollment, trainingProgramsApi } from '@/services/training-programs'
import { ArrowRight, Plus } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { SectionHeader } from './SectionHeader'

const TYPE_LABELS: Record<string, string> = {
  strength_building: 'Force',
  endurance_base: 'Endurance',
  competition_prep: 'Compétition',
  off_season: 'Off-season',
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  enrolled: { label: 'Inscrit', color: 'text-muted-foreground' },
  active: { label: 'En cours', color: 'text-primary' },
  paused: { label: 'En pause', color: 'text-muted-foreground' },
}

export function ActiveProgramCard({ index }: { index?: string } = {}) {
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
      <div>
        <SectionHeader index={index} title="Programme actif" />
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-2/3" />
          <div className="h-2 bg-muted rounded" />
        </div>
      </div>
    )
  }

  // Aucun programme actif → invitation à en créer un
  if (!enrollment) {
    return (
      <div>
        <SectionHeader index={index} title="Programme actif" />
        <Link href="/crossfit/program/generate" className="group flex items-end justify-between gap-6">
          <div>
            <h3 className="font-display text-3xl font-semibold leading-tight">
              Aucun programme actif
            </h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-md">
              Crée un programme structuré pour t&apos;entraîner selon tes besoins, pas juste ton humeur.
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
            Créer <Plus className="w-4 h-4" />
          </span>
        </Link>
      </div>
    )
  }

  const progressPct = enrollment.total_sessions
    ? Math.round((enrollment.completed_sessions / enrollment.total_sessions) * 100)
    : 0
  const totalWeeks = enrollment.duration_weeks || 1
  const status = STATUS_CONFIG[enrollment.status]

  return (
    <div>
      <SectionHeader
        index={index}
        title="Programme actif"
        right={`Semaine ${String(enrollment.current_week).padStart(2, '0')} — ${String(totalWeeks).padStart(2, '0')}`}
      />

      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <Link href="/crossfit/program" className="group inline-flex items-start gap-2">
            <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-[1.05]">
              {enrollment.program_name}
            </h2>
            <ArrowRight className="w-5 h-5 mt-2 text-muted-foreground group-hover:translate-x-1 group-hover:text-primary transition-all shrink-0" />
          </Link>
          <p className="text-sm text-muted-foreground mt-3">
            {TYPE_LABELS[enrollment.program_type] ?? enrollment.program_type} ·{' '}
            <span className={`font-semibold ${status?.color ?? 'text-muted-foreground'}`}>
              {status?.label ?? enrollment.status}
            </span>
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display text-5xl sm:text-6xl font-semibold leading-none">
            {enrollment.completed_sessions}
            <span className="text-2xl text-muted-foreground">/{enrollment.total_sessions}</span>
          </div>
          <div className="eyebrow mt-1">séances</div>
        </div>
      </div>

      {/* Progression en segments plutôt qu'une barre pleine */}
      <div className="mt-8 flex gap-1.5">
        {Array.from({ length: enrollment.total_sessions || 8 }).map((_, i) => (
          <div
            key={i}
            className={`flex-1 h-1.5 ${i < enrollment.completed_sessions ? 'bg-foreground' : 'bg-border'}`}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 eyebrow">
        <span>Semaine {enrollment.current_week}</span>
        <span>{progressPct} % complété</span>
      </div>
    </div>
  )
}
