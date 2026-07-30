import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { SkillProgram } from '@/domain/entities/skill'
import { skillsService } from '@/services/skills'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Loader2, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface ScheduleSkillModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  onSchedule: (skillProgramId: string, notes?: string) => Promise<void>
}

const CATEGORY_LABELS: Record<string, string> = {
  gymnastics: 'Gymnastique',
  olympic_lifting: 'Haltérophilie',
  strength: 'Force',
  mobility: 'Mobilité',
}

export function ScheduleSkillModal({ open, onOpenChange, selectedDate, onSchedule }: ScheduleSkillModalProps) {
  const [programs, setPrograms] = useState<SkillProgram[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    skillsService
      .getAll('active')
      .then(setPrograms)
      .catch(() => toast.error('Impossible de charger les programmes'))
      .finally(() => setLoading(false))
  }, [open])

  const handleSelect = async (programId: string) => {
    try {
      setSaving(true)
      await onSchedule(programId)
      onOpenChange(false)
    } catch {
      // toast déjà géré en amont
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px] bg-card border-border text-foreground">
        <DialogHeader>
          <span className="eyebrow">Progression</span>
          <DialogTitle className="font-display text-foreground text-lg">
            Travailler un skill
          </DialogTitle>
          <p className="text-sm text-muted-foreground capitalize">
            {format(selectedDate, 'EEEE dd MMMM', { locale: fr })}
          </p>
        </DialogHeader>

        <div className="pt-2">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : programs.length === 0 ? (
            <div className="text-center py-8 space-y-3">
              <p className="text-sm text-muted-foreground">Aucun programme de progression actif.</p>
              <Button asChild size="sm">
                <a href="/skills/new">Créer un programme</a>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border max-h-[320px] overflow-y-auto">
              {programs.map((program) => {
                const total = program.total_steps ?? 0
                const done = program.completed_steps ?? 0
                const progress = total > 0 ? Math.round((done / total) * 100) : 0
                return (
                  <button
                    key={program.id}
                    disabled={saving}
                    onClick={() => handleSelect(program.id)}
                    className="group flex items-center gap-3 w-full py-3 text-left transition-colors hover:bg-muted/60 disabled:opacity-50"
                  >
                    <Target className="w-5 h-5 text-primary flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {program.skill_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {CATEGORY_LABELS[program.skill_category] || program.skill_category} · {progress}% · {done}/{total} étapes
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
