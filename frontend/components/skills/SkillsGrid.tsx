'use client'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { SkillProgram } from '@/domain/entities/skill'
import { skillsService } from '@/services/skills'
import { ArrowUpRight, Loader2, Plus } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

const categoryLabels: Record<string, string> = {
  gymnastics: 'Gymnastique',
  olympic_lifting: 'Haltérophilie',
  strength: 'Force',
  mobility: 'Mobilité',
}

const statusLabels: Record<string, string> = {
  active: 'Actif',
  completed: 'Terminé',
  paused: 'En pause',
  abandoned: 'Abandonné',
}

export function SkillsGrid() {
  const [programs, setPrograms] = useState<SkillProgram[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const fetchPrograms = useCallback(async () => {
    try {
      setLoading(true)
      const data = await skillsService.getAll(statusFilter === 'all' ? undefined : statusFilter)
      setPrograms(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Skills fetch error:', err)
      toast.error('Erreur lors du chargement des programmes')
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    fetchPrograms()
  }, [fetchPrograms])

  const getProgressPercent = (program: SkillProgram) => {
    if (!program.total_steps || program.total_steps === 0) return 0
    return Math.round(((program.completed_steps || 0) / program.total_steps) * 100)
  }

  return (
    <div className="space-y-8">
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-48 bg-card border-border text-foreground">
          <SelectValue placeholder="Statut" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Tous</SelectItem>
          <SelectItem value="active">Actifs</SelectItem>
          <SelectItem value="completed">Terminés</SelectItem>
          <SelectItem value="paused">En pause</SelectItem>
          <SelectItem value="abandoned">Abandonnés</SelectItem>
        </SelectContent>
      </Select>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : programs.length === 0 ? (
        <div className="text-center py-20">
          <h3 className="font-display text-2xl font-semibold mb-2">Aucun programme</h3>
          <p className="text-muted-foreground mb-6">Commencez par créer un programme de progression</p>
          <Link
            href="/skills/new"
            className="inline-flex items-center rounded-full px-6 py-2.5 font-display font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Créer un programme
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
          {programs.map((program) => {
            const progress = getProgressPercent(program)
            const isActive = program.status === 'active'
            return (
              <Link key={program.id} href={`/skills/${program.id}`} className="group block">
                <div className="flex items-baseline justify-between mb-3">
                  <span className="eyebrow">{categoryLabels[program.skill_category] ?? program.skill_category}</span>
                  <span className={`eyebrow ${isActive ? 'text-primary' : ''}`}>
                    {statusLabels[program.status]}
                  </span>
                </div>
                <div className="rule mb-4" />

                <div className="flex items-start justify-between gap-3">
                  <h3 className="font-display text-2xl font-semibold leading-tight group-hover:text-primary transition-colors">
                    {program.skill_name}
                  </h3>
                  <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-all shrink-0" />
                </div>

                {program.description && (
                  <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{program.description}</p>
                )}

                <div className="mt-5 flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    {program.completed_steps || 0} / {program.total_steps || 0} étapes
                  </span>
                  <span className="font-display font-semibold text-primary">{progress}%</span>
                </div>
                <div className="h-1.5 bg-border overflow-hidden">
                  <div
                    className="h-full bg-foreground transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>

                {program.estimated_weeks && (
                  <p className="eyebrow mt-3">Durée estimée : {program.estimated_weeks} semaines</p>
                )}
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
