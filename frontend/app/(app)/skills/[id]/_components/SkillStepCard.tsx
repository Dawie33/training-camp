import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import type { SkillProgressLog, SkillStep } from '@/domain/entities/skill'
import {
  CheckCircle,
  ChevronDown,
  ChevronRight,
  Clock,
  FastForward,
  Lock,
  Play,
  Plus,
  Trash2,
} from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const statusIcons: Record<string, React.ReactNode> = {
  locked: <Lock className="w-5 h-5 text-muted-foreground" />,
  in_progress: <Play className="w-5 h-5 text-primary" />,
  completed: <CheckCircle className="w-5 h-5 text-foreground" />,
  skipped: <FastForward className="w-5 h-5 text-muted-foreground" />,
}

const statusLabels: Record<string, string> = {
  locked: 'Verrouillé',
  in_progress: 'En cours',
  completed: 'Terminé',
  skipped: 'Passé',
}

interface SkillStepCardProps {
  step: SkillStep
  isExpanded: boolean
  isProgramActive: boolean
  logs: SkillProgressLog[]
  chartData: { date: string; value: number }[]
  onToggle: () => void
  onLogSession: () => void
  onComplete: () => void
  onSkip: () => void
  onDeleteLog: (logId: string) => void
}

export function SkillStepCard({
  step,
  isExpanded,
  isProgramActive,
  logs,
  chartData,
  onToggle,
  onLogSession,
  onComplete,
  onSkip,
  onDeleteLog,
}: SkillStepCardProps) {
  const isActive = step.status === 'in_progress'

  return (
    <div className="relative pl-12">
      {/* Status icon on timeline */}
      <div className={`absolute left-0 top-3 w-10 h-10 rounded-full flex items-center justify-center z-10 ${
        isActive ? 'bg-primary/10 ring-2 ring-primary/40' :
        step.status === 'completed' ? 'bg-secondary' :
        'bg-card border border-border'
      }`}>
        {statusIcons[step.status]}
      </div>

      <div className={`rounded-lg border bg-card ${isActive ? 'border-primary/40' : 'border-border'}`}>
        {/* Header - clickable */}
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between p-4 text-left"
        >
          <div className="flex items-center gap-3">
            <span className="font-display text-sm font-semibold text-muted-foreground">#{step.step_number}</span>
            <span className="font-medium text-foreground">{step.title}</span>
            <Badge variant="outline" className={`text-xs border-border ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
              {statusLabels[step.status]}
            </Badge>
            {step.manually_overridden && (
              <Badge variant="outline" className="text-xs border-border text-muted-foreground">Manuel</Badge>
            )}
          </div>
          {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        </button>

        {/* Expanded content */}
        {isExpanded && (
          <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
            <p className="text-muted-foreground text-sm">{step.description}</p>

            {/* Validation criteria */}
            {step.validation_criteria && (
              <div className="bg-secondary rounded-lg p-3">
                <p className="eyebrow mb-1">Critère de validation</p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-primary" />
                  <span className="text-sm text-foreground">{step.validation_criteria.description}</span>
                </div>
              </div>
            )}

            {/* Recommended exercises */}
            {step.recommended_exercises && step.recommended_exercises.length > 0 && (
              <div>
                <p className="eyebrow mb-2">Exercices recommandés</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {step.recommended_exercises.map((ex, i) => (
                    <div key={i} className="bg-secondary rounded-lg px-3 py-2">
                      <p className="text-sm text-foreground font-medium">{ex.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {[
                          ex.sets && `${ex.sets} séries`,
                          ex.reps && `${ex.reps} reps`,
                          ex.rest && `repos ${ex.rest}`,
                        ].filter(Boolean).join(' · ')}
                      </p>
                      {ex.notes && <p className="text-xs text-muted-foreground mt-1">{ex.notes}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Programming info */}
            {(step.frequency || step.when_to_train || step.warmup) && (
              <div className="border-l-2 border-primary bg-secondary rounded-r-lg p-3 space-y-1">
                <p className="eyebrow text-primary mb-1">Programmation</p>
                {step.frequency && (
                  <p className="text-sm text-foreground/80"><span className="font-medium">Fréquence :</span> {step.frequency}</p>
                )}
                {step.when_to_train && (
                  <p className="text-sm text-foreground/80"><span className="font-medium">Quand :</span> {step.when_to_train}</p>
                )}
                {step.warmup && (
                  <p className="text-sm text-foreground/80"><span className="font-medium">Échauffement :</span> {step.warmup}</p>
                )}
              </div>
            )}

            {/* Coaching tips */}
            {step.coaching_tips && (
              <div className="bg-secondary rounded-lg p-3">
                <p className="eyebrow mb-1">Conseils</p>
                <p className="text-sm text-foreground/80">{step.coaching_tips}</p>
              </div>
            )}

            {/* Actions for active step */}
            {isActive && isProgramActive && (
              <div className="flex flex-wrap gap-3 pt-2">
                <Button size="sm" onClick={onLogSession} className="rounded-full">
                  <Plus className="w-3 h-3 mr-1" />
                  Logger session
                </Button>
                <Button size="sm" variant="outline" onClick={onComplete} className="rounded-full border-border text-foreground hover:border-primary hover:text-primary">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  Marquer complète
                </Button>
                <Button size="sm" variant="outline" onClick={onSkip} className="rounded-full border-border text-muted-foreground hover:text-foreground">
                  <FastForward className="w-3 h-3 mr-1" />
                  Passer
                </Button>
              </div>
            )}

            {/* Progress chart */}
            {chartData.length > 1 && (
              <div>
                <p className="eyebrow mb-2">Progression</p>
                <div className="bg-secondary rounded-lg p-4 h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(34 18% 85%)" />
                      <XAxis dataKey="date" stroke="hsl(24 10% 42%)" fontSize={11} />
                      <YAxis stroke="hsl(24 10% 42%)" fontSize={11} />
                      <Tooltip
                        contentStyle={{ backgroundColor: 'hsl(40 33% 99%)', border: '1px solid hsl(34 18% 85%)', borderRadius: '8px' }}
                        labelStyle={{ color: 'hsl(24 10% 42%)' }}
                      />
                      <Line type="monotone" dataKey="value" stroke="hsl(12 62% 48%)" strokeWidth={2} dot={{ fill: 'hsl(12 62% 48%)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Session logs */}
            {logs.length > 0 && (
              <div>
                <p className="eyebrow mb-2">Historique sessions</p>
                <div className="space-y-2">
                  {logs.map((log) => {
                    const pd = (log.performance_data || {}) as Record<string, unknown>
                    return (
                      <div key={log.id} className="flex items-center justify-between bg-secondary rounded-lg px-3 py-2">
                        <div className="flex items-center gap-3">
                          <Clock className="w-3 h-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {new Date(log.session_date).toLocaleDateString('fr-FR')}
                          </span>
                          <span className="text-sm text-foreground">
                            {Object.entries(pd).map(([k, v]) => {
                              if (k === 'reps_achieved') return `${v} reps`
                              if (k === 'time_seconds') return `${v}s`
                              if (k === 'weight_used') return `${v} kg`
                              if (k === 'quality_score') return `${v}/10`
                              return `${v}`
                            }).join(', ')}
                          </span>
                          {log.session_notes && (
                            <span className="text-xs text-muted-foreground">— {log.session_notes}</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onDeleteLog(log.id)}
                          className="text-muted-foreground hover:text-primary h-6 w-6 p-0"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
