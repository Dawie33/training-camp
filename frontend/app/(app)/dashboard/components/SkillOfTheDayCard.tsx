'use client'

import type { SkillProgram, SkillStep } from '@/domain/entities/skill'
import { skillsService } from '@/services/skills'
import { ArrowUpRight, Check } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { SectionHeader } from './SectionHeader'

const UNIT_LABEL: Record<string, string> = {
  reps: 'répétitions',
  time: 'secondes',
  weight: 'kg',
  quality: 'qualité /10',
}

export function SkillOfTheDayCard({ index }: { index?: string } = {}) {
  const [program, setProgram] = useState<SkillProgram | null>(null)
  const [step, setStep] = useState<SkillStep | null>(null)
  const [loading, setLoading] = useState(true)
  const [logOpen, setLogOpen] = useState(false)
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const programs = await skillsService.getAll('active')
        const first = Array.isArray(programs) ? programs[0] : null
        if (!first) {
          if (!cancelled) setLoading(false)
          return
        }
        const detail = await skillsService.getOne(first.id)
        const current = detail.steps?.find((s) => s.status === 'in_progress') ?? null
        if (!cancelled) {
          setProgram(detail)
          setStep(current)
          setLoading(false)
        }
      } catch {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const handleLog = async () => {
    if (!step) return
    setSaving(true)
    try {
      const performance_data: Record<string, unknown> = {}
      if (value) {
        const n = Number(value)
        const type = step.validation_criteria?.type
        if (type === 'reps') performance_data.reps_achieved = n
        else if (type === 'time') performance_data.time_seconds = n
        else if (type === 'weight') performance_data.weight_used = n
        else performance_data.quality_score = n
      }
      await skillsService.logProgress({
        step_id: step.id,
        session_date: new Date().toISOString().split('T')[0],
        performance_data,
      })
      toast.success('Séance skill enregistrée')
      setLogOpen(false)
      setValue('')
    } catch {
      toast.error("Erreur lors de l'enregistrement")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div>
        <SectionHeader index={index} title="Skill du jour" />
        <div className="animate-pulse space-y-3">
          <div className="h-8 bg-muted rounded w-2/3" />
          <div className="h-4 bg-muted rounded w-1/2" />
        </div>
      </div>
    )
  }

  // Aucun programme actif — invite discrète
  if (!program) {
    return (
      <div>
        <SectionHeader index={index} title="Skill du jour" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Aucune progression active — travaille une compétence en parallèle de tes WODs.
          </p>
          <Link
            href="/skills/new"
            className="group inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-4 py-2 font-display text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Créer une progression
            <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    )
  }

  const criteria = step?.validation_criteria
  const target = criteria?.target
  const unit = criteria ? UNIT_LABEL[criteria.type] ?? criteria.unit : ''

  return (
    <div>
      <SectionHeader index={index} title="Skill du jour" right={program.skill_name} />

      {step ? (
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="eyebrow mb-2">
              Étape {step.step_number}
              {typeof target === 'number' && (
                <span className="text-primary ml-2">Objectif : {target} {unit}</span>
              )}
            </div>
            <Link
              href={`/skills/${program.id}`}
              className="group inline-flex items-start gap-2"
            >
              <h2 className="font-display text-3xl sm:text-4xl font-semibold leading-[1.05] group-hover:text-primary transition-colors">
                {step.title}
              </h2>
              <ArrowUpRight className="w-5 h-5 mt-1.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
            </Link>
            {step.coaching_tips && (
              <p className="text-sm text-muted-foreground max-w-xl mt-3">{step.coaching_tips}</p>
            )}
          </div>

          <div className="shrink-0">
            {!logOpen ? (
              <button
                onClick={() => setLogOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border px-5 py-2.5 font-display text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
              >
                Logger une séance
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  inputMode="numeric"
                  autoFocus
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder={unit}
                  className="w-28 rounded-md border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
                />
                <button
                  onClick={handleLog}
                  disabled={saving}
                  className="inline-flex items-center gap-1 rounded-full bg-primary text-primary-foreground px-4 py-2.5 font-display text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  Valider
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            Programme « {program.skill_name} » — aucune étape en cours.
          </p>
          <Link
            href={`/skills/${program.id}`}
            className="text-sm text-primary hover:opacity-80 transition-opacity"
          >
            Voir le programme →
          </Link>
        </div>
      )}
    </div>
  )
}
