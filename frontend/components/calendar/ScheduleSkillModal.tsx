import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { SkillProgram } from '@/domain/entities/skill'
import { skillsService } from '@/services/skills'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Building2, Home, Loader2, Target } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

type SessionLocation = 'home' | 'box'

interface ScheduleSkillModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  onSchedule: (skillProgramId: string, notes?: string, location?: SessionLocation) => Promise<void>
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
  const [location, setLocation] = useState<SessionLocation | undefined>(undefined)

  useEffect(() => {
    if (!open) return
    setLocation(undefined)
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
      await onSchedule(programId, undefined, location)
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

        <div className="flex gap-1.5 pt-2">
          <button
            type="button"
            onClick={() => setLocation(location === 'home' ? undefined : 'home')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium border transition-all ${location === 'home' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            <Home className="h-3.5 w-3.5" />
            Maison
          </button>
          <button
            type="button"
            onClick={() => setLocation(location === 'box' ? undefined : 'box')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium border transition-all ${location === 'box' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Box
          </button>
        </div>

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
