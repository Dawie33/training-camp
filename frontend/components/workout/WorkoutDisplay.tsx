import { WorkoutBlocks, WorkoutSection } from '@/lib/types/workout-structure'

interface WorkoutDisplayProps {
  blocks: WorkoutBlocks
  showTitle?: boolean
}

export function WorkoutDisplay({ blocks, showTitle = true }: WorkoutDisplayProps) {
  return (
    <div className="space-y-6">
      {blocks.stimulus && (
        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">🎯 Objectif</h3>
          <p className="text-blue-800 dark:text-blue-200">{blocks.stimulus}</p>
        </div>
      )}

      <div className="space-y-4">
        {blocks.sections.map((section, idx) => (
          <SectionDisplay key={idx} section={section} index={idx} />
        ))}
      </div>

      {blocks.estimated_calories && (
        <div className="text-sm text-muted-foreground text-center pt-4 border-t">
          🔥 Estimation : {blocks.estimated_calories} calories
        </div>
      )}
    </div>
  )
}

interface SectionDisplayProps {
  section: WorkoutSection
  index: number
}

function SectionDisplay({ section, index }: SectionDisplayProps) {
  const sectionIcons: Record<string, string> = {
    warmup: '🏃',
    skill_work: '🎯',
    strength: '💪',
    accessory: '🔧',
    cardio: '❤️',
    intervals: '⚡',
    metcon: '🔥',
    amrap: '🔁',
    emom: '⏱️',
    for_time: '⏰',
    circuit: '🔄',
    finisher: '💥',
    core: '🧘',
    mobility: '🤸',
    cooldown: '😌',
  }

  const icon = sectionIcons[section.type] || '📋'

  return (
    <div className="bg-card border rounded-lg p-4 space-y-3">
      {/* Header de la section */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span>{icon}</span>
            <span>{section.title}</span>
          </h3>
          {section.description && (
            <p className="text-sm text-muted-foreground mt-1">{section.description}</p>
          )}
        </div>
        {section.duration_min && (
          <span className="px-3 py-1 bg-muted rounded-full text-sm font-medium">
            {section.duration_min} min
          </span>
        )}
      </div>

      {/* Format et détails */}
      {section.format && (
        <div className="text-sm px-3 py-2 bg-muted/50 rounded">
          <strong>Format:</strong> {section.format}
        </div>
      )}

      {section.goal && (
        <div className="text-sm text-muted-foreground">
          <strong>Objectif:</strong> {section.goal}
        </div>
      )}

      {section.focus && (
        <div className="text-sm text-muted-foreground">
          <strong>Focus:</strong> {section.focus}
        </div>
      )}

      {/* Rounds et repos */}
      {(section.rounds || section.rest_between_rounds) && (
        <div className="flex gap-4 text-sm">
          {section.rounds && (
            <span className="text-muted-foreground">
              <strong>Rounds:</strong> {section.rounds}
            </span>
          )}
          {section.rest_between_rounds && (
            <span className="text-muted-foreground">
              <strong>Repos entre rounds:</strong> {section.rest_between_rounds}s
            </span>
          )}
        </div>
      )}

      {/* Exercices */}
      {section.exercises && section.exercises.length > 0 && (
        <div className="space-y-2 pl-4 border-l-2 border-primary/20">
          {section.exercises.map((exercise, exIdx) => (
            <ExerciseDisplay key={exIdx} exercise={exercise} />
          ))}
        </div>
      )}

      {/* Intervalles */}
      {section.intervals && (
        <div className="bg-muted/30 rounded p-3 space-y-2">
          <div className="text-sm">
            <strong>Travail:</strong>
            {section.intervals.work.distance && ` ${section.intervals.work.distance}`}
            {section.intervals.work.duration && ` ${section.intervals.work.duration}`}
            {section.intervals.work.pace && ` @ ${section.intervals.work.pace}`}
            {section.intervals.work.effort && ` (${section.intervals.work.effort})`}
          </div>
          <div className="text-sm text-muted-foreground">
            <strong>Repos:</strong> {section.intervals.rest.duration}
            {section.intervals.rest.type && ` (${section.intervals.rest.type})`}
          </div>
          {section.rounds && (
            <div className="text-sm font-medium">× {section.rounds} répétitions</div>
          )}
        </div>
      )}

      {/* Sections imbriquées (pour cooldown avec plusieurs parties) */}
      {section.sections && section.sections.length > 0 && (
        <div className="space-y-3 pl-4">
          {section.sections.map((subsection, subIdx) => (
            <SectionDisplay key={subIdx} section={subsection} index={subIdx} />
          ))}
        </div>
      )}
    </div>
  )
}

interface ExerciseDisplayProps {
  exercise: any
}

function ExerciseDisplay({ exercise }: ExerciseDisplayProps) {
  return (
    <div className="text-sm">
      <div className="font-medium">{exercise.name}</div>
      <div className="text-muted-foreground flex flex-wrap gap-2 mt-1">
        {exercise.sets && <span>• {exercise.sets} sets</span>}
        {exercise.reps && <span>• {exercise.reps} reps</span>}
        {exercise.duration && <span>• {exercise.duration}</span>}
        {exercise.work_duration && <span>• {exercise.work_duration} travail</span>}
        {exercise.rest_duration && <span>• {exercise.rest_duration} repos</span>}
        {exercise.distance && <span>• {exercise.distance}</span>}
        {exercise.weight && <span>• {exercise.weight}</span>}
        {exercise.intensity && <span>• Intensité: {exercise.intensity}</span>}
        {exercise.pace && <span>• Allure: {exercise.pace}</span>}
        {exercise.effort && <span>• Effort: {exercise.effort}</span>}
        {exercise.tempo && <span>• Tempo: {exercise.tempo}</span>}
        {exercise.cadence && <span>• Cadence: {exercise.cadence}</span>}
        {exercise.per_side && <span>• par côté</span>}
      </div>
      {exercise.details && (
        <div className="text-xs text-muted-foreground italic mt-1">{exercise.details}</div>
      )}
    </div>
  )
}
