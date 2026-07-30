import { Button } from '@/components/ui/button'
import type { SkillProgram } from '@/domain/entities/skill'
import { Pause, Play, Trash2, XCircle } from 'lucide-react'

const programStatusLabels: Record<string, string> = {
  active: 'Actif',
  completed: 'Terminé',
  paused: 'En pause',
  abandoned: 'Abandonné',
}

interface SkillHeaderProps {
  program: SkillProgram
  progress: number
  onPauseResume: () => void
  onAbandon: () => void
  onDelete: () => void
}

export function SkillHeader({ program, progress, onPauseResume, onAbandon, onDelete }: SkillHeaderProps) {
  const isActive = program.status === 'active'
  const completed = program.steps?.filter(s => s.status === 'completed' || s.status === 'skipped').length || 0
  const total = program.steps?.length || 0

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-2">
        <span className={`eyebrow ${isActive ? 'text-primary' : ''}`}>
          {programStatusLabels[program.status]}
        </span>
        <div className="text-right shrink-0">
          <div className="font-display text-4xl sm:text-5xl font-semibold leading-none">
            {progress}<span className="text-2xl text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      <h1 className="font-display text-4xl sm:text-5xl font-semibold leading-none tracking-tight">
        {program.skill_name}
      </h1>
      {program.description && (
        <p className="text-muted-foreground max-w-2xl mt-4">{program.description}</p>
      )}

      {/* Progression en segments */}
      <div className="mt-8 flex gap-1.5">
        {Array.from({ length: total || 1 }).map((_, i) => (
          <div key={i} className={`flex-1 h-1.5 ${i < completed ? 'bg-foreground' : 'bg-border'}`} />
        ))}
      </div>
      <div className="flex justify-between mt-2 eyebrow">
        <span>{completed} / {total} étapes</span>
      </div>

      {/* Actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        {program.status !== 'completed' && program.status !== 'abandoned' && (
          <>
            <Button variant="outline" onClick={onPauseResume} className="rounded-full border-border text-foreground hover:border-primary hover:text-primary">
              {program.status === 'paused' ? (
                <><Play className="w-4 h-4 mr-2" /> Reprendre</>
              ) : (
                <><Pause className="w-4 h-4 mr-2" /> Pause</>
              )}
            </Button>
            <Button variant="outline" onClick={onAbandon} className="rounded-full border-border text-muted-foreground hover:text-foreground">
              <XCircle className="w-4 h-4 mr-2" /> Abandonner
            </Button>
          </>
        )}
        <Button variant="ghost" onClick={onDelete} className="ml-auto text-muted-foreground hover:text-primary">
          <Trash2 className="w-4 h-4 mr-2" /> Supprimer
        </Button>
      </div>
    </div>
  )
}
