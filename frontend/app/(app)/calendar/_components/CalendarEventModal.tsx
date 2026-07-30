import { Button } from '@/components/ui/button'
import { MUSCLE_LABELS, SESSION_GOAL_LABELS } from '@/services/strength'
import { Check, ExternalLink, FileDown, SkipForward, Trash2 } from 'lucide-react'
import { statusColors } from './CalendarEventContent'

export function CustomEventModal({ calendarEvent }: { calendarEvent: Record<string, unknown> }) {
  const status = (calendarEvent.status as string) || 'scheduled'
  const module = (calendarEvent.module as string) || 'crossfit'
  const colors = statusColors[status] || statusColors.scheduled
  const onComplete = calendarEvent._onComplete as (() => void) | undefined
  const onSkip = calendarEvent._onSkip as (() => void) | undefined
  const onDelete = calendarEvent._onDelete as (() => void) | undefined
  const onPrint = calendarEvent._onPrint as (() => void) | undefined
  const isStrength = module === 'strength'
  const isSkill = module === 'skill'
  const targetMuscles = calendarEvent.target_muscles as string[] | undefined
  const sessionGoal = calendarEvent.session_goal as string | undefined
  const skillStepTitle = calendarEvent.skill_step_title as string | undefined
  const skillProgress = calendarEvent.skill_progress as number | undefined
  const skillProgramId = calendarEvent.skill_program_id as string | undefined

  // Thème Clay conditionnel pour les events skill (le reste du calendrier reste dark)
  const clay = isSkill
  const c = {
    root: clay ? 'bg-card rounded-md' : '',
    title: clay ? 'text-foreground' : 'text-slate-100',
    label: clay ? 'text-muted-foreground' : 'text-slate-500',
    value: clay ? 'text-foreground' : 'text-slate-300',
    border: clay ? 'border-border' : 'border-white/10',
    pill: clay ? 'bg-muted text-muted-foreground' : `${colors.bg} ${colors.text}`,
    complete: clay
      ? 'bg-emerald-600/10 text-emerald-700 border border-emerald-600/30 hover:bg-emerald-600/20'
      : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30',
    skip: clay
      ? 'bg-muted text-muted-foreground border border-border hover:bg-muted/70'
      : 'bg-slate-500/20 text-slate-400 border border-slate-500/30 hover:bg-slate-500/30',
    delete: clay
      ? 'bg-red-600/10 text-red-700 border border-red-600/30 hover:bg-red-600/20 ml-auto'
      : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 ml-auto',
  }

  return (
    <div className={`p-4 min-w-[280px] ${c.root}`}>
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${colors.dot}`} />
        <div className="flex-1 min-w-0">
          <h3 className={`text-base font-semibold truncate ${clay ? 'font-display' : ''} ${c.title}`}>
            {calendarEvent.title as string}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${c.pill}`}>
              {status === 'scheduled' ? 'Programmé' : status === 'completed' ? 'Complété' : status === 'skipped' ? 'Sauté' : 'Replanifié'}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {!!calendarEvent.workout_type && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Type:</span>
            <span className="text-slate-300 capitalize">{(calendarEvent.workout_type as string).replace(/_/g, ' ')}</span>
          </div>
        )}
        {!!calendarEvent.difficulty && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Difficulté:</span>
            <span className="text-slate-300 capitalize">{calendarEvent.difficulty as string}</span>
          </div>
        )}
        {!!calendarEvent.duration && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Durée:</span>
            <span className="text-slate-300">{calendarEvent.duration as number} min</span>
          </div>
        )}
        {/* Détails spécifiques Force */}
        {isStrength && sessionGoal && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Objectif:</span>
            <span className="text-slate-300 capitalize">{SESSION_GOAL_LABELS[sessionGoal as keyof typeof SESSION_GOAL_LABELS] ?? sessionGoal}</span>
          </div>
        )}
        {isStrength && targetMuscles && targetMuscles.length > 0 && (
          <div className="flex items-start gap-2 text-sm">
            <span className="text-slate-500 shrink-0">Muscles:</span>
            <span className="text-slate-300">
              {targetMuscles.map((m) => MUSCLE_LABELS[m as keyof typeof MUSCLE_LABELS] ?? m).join(', ')}
            </span>
          </div>
        )}
        {isStrength && !!calendarEvent.duration_minutes && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Durée:</span>
            <span className="text-slate-300">{calendarEvent.duration_minutes as number} min</span>
          </div>
        )}
        {isStrength && !!calendarEvent.perceived_effort && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">RPE:</span>
            <span className="text-slate-300">{calendarEvent.perceived_effort as number} / 10</span>
          </div>
        )}
        {/* Détails spécifiques Skill */}
        {isSkill && skillStepTitle && (
          <div className="flex items-start gap-2 text-sm">
            <span className={`shrink-0 ${c.label}`}>Étape en cours:</span>
            <span className={c.value}>{skillStepTitle}</span>
          </div>
        )}
        {isSkill && typeof skillProgress === 'number' && (
          <div className="flex items-center gap-2 text-sm">
            <span className={c.label}>Progression:</span>
            <span className={clay ? 'text-primary font-medium' : 'text-slate-300'}>{skillProgress}%</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={`flex flex-wrap gap-2 pt-3 border-t ${c.border}`}>
        {status === 'scheduled' && (
          <>
            {onComplete && (
              <Button
                size="sm"
                onClick={onComplete}
                className={c.complete}
              >
                <Check className="w-3.5 h-3.5 mr-1" />
                Terminer
              </Button>
            )}
            {onSkip && (
              <Button
                size="sm"
                onClick={onSkip}
                className={c.skip}
              >
                <SkipForward className="w-3.5 h-3.5 mr-1" />
                Sauté
              </Button>
            )}
          </>
        )}
        {isStrength && (
          <Button
            size="sm"
            asChild
            className="bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30"
          >
            <a href="/strength">
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Voir dans Force
            </a>
          </Button>
        )}
        {isSkill && (
          <Button
            size="sm"
            asChild
            className="bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30"
          >
            <a href={skillProgramId ? `/skills/${skillProgramId}` : '/skills'}>
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Voir dans Progressions
            </a>
          </Button>
        )}
        {!isStrength && !!(calendarEvent.workout_id || calendarEvent.personalized_workout_id) && (
          <Button
            size="sm"
            asChild
            className="bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
          >
            <a href={calendarEvent.workout_id ? `/workout/${calendarEvent.workout_id as string}` : `/personalized-workout/${calendarEvent.personalized_workout_id as string}`}>
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Voir
            </a>
          </Button>
        )}
        {!!calendarEvent.workout_id && onPrint && (
          <Button
            size="sm"
            onClick={onPrint}
            className="bg-slate-500/20 text-slate-300 border border-slate-500/30 hover:bg-slate-500/30"
          >
            <FileDown className="w-3.5 h-3.5 mr-1" />
            PDF
          </Button>
        )}
        {onDelete && (
          <Button
            size="sm"
            onClick={onDelete}
            className={c.delete}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            Supprimer
          </Button>
        )}
      </div>
    </div>
  )
}
