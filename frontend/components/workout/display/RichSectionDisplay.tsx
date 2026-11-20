import { SECTION_TYPE_COLORS, type Exercise, type WorkoutSection } from '@/domain/entities/workout-structure'

function getFormatLabel(section: WorkoutSection): string | null {
  if (section.format) return section.format
  const typeFormats: Record<string, string> = {
    amrap: 'AMRAP',
    emom: 'EMOM',
    for_time: 'For Time',
    tabata: 'Tabata',
  }
  return typeFormats[section.type] || null
}

function RichExerciseDisplay({ exercise, idx }: { exercise: Exercise; idx: number }) {
  return (
    <div className="flex items-start justify-between p-3 bg-secondary/60 rounded-lg lg:rounded-xl hover:bg-secondary/60 transition-colors">
      <div className="flex items-center gap-3 lg:gap-4 flex-1 min-w-0">
        <div className="w-6 h-8 lg:w-10 lg:h-10 bg-secondary rounded-lg flex items-center justify-center text-muted-foreground font-bold text-sm lg:text-base flex-shrink-0 mt-0.5">
          {idx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-foreground break-words">{exercise.name}</div>

          <div className="flex flex-wrap gap-1.5 mt-1">
            {exercise.duration && (
              <span className="px-2 py-0.5 bg-secondary rounded text-xs text-foreground">{exercise.duration}</span>
            )}
            {exercise.distance && (
              <span className="px-2 py-0.5 bg-secondary rounded text-xs text-foreground">{exercise.distance}</span>
            )}
            {exercise.per_side && (
              <span className="px-2 py-0.5 bg-secondary rounded text-xs text-foreground">par côté</span>
            )}
            {exercise.tempo && (
              <span className="px-2 py-0.5 bg-secondary rounded text-xs text-foreground">Tempo: {exercise.tempo}</span>
            )}
          </div>

          {exercise.weight && (
            <div className="text-xs lg:text-sm text-muted-foreground mt-0.5">{exercise.weight}</div>
          )}

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-0.5">
            {exercise.intensity && (
              <span className="text-xs text-muted-foreground">Intensité: {exercise.intensity}</span>
            )}
            {exercise.pace && (
              <span className="text-xs text-muted-foreground">Pace: {exercise.pace}</span>
            )}
            {exercise.effort && (
              <span className="text-xs text-muted-foreground">Effort: {exercise.effort}</span>
            )}
          </div>

          {exercise.details && (
            <div className="text-xs text-muted-foreground mt-1">{exercise.details}</div>
          )}
        </div>
      </div>
      {exercise.reps && (
        <div className="text-foreground shrink-0 ml-3 tabular-nums">
          {exercise.reps} reps
        </div>
      )}
    </div>
  )
}

export function RichSectionDisplay({ section }: { section: WorkoutSection }) {
  const formatLabel = getFormatLabel(section)
  return (
    <div className="space-y-4">
      <div className="rounded-lg overflow-hidden">
        <div className={`bg-card p-4 lg:p-6 border border-border border-l-4 rounded-r-lg ${SECTION_TYPE_COLORS[section.type] ?? 'border-l-border'}`}>
          {/* Section Header */}
          <div className="flex flex-wrap items-center gap-2 lg:gap-3 mb-3">
            <h3 className="font-display text-2xl font-semibold text-foreground">
              {section.title || section.format || section.type}
            </h3>
            {formatLabel && (
              <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-secondary text-foreground">
                {formatLabel}
              </span>
            )}
            {section.duration_min && (
              <span className="text-muted-foreground text-sm">{section.duration_min} min</span>
            )}
          </div>

          {/* Section metadata */}
          <div className="flex flex-wrap gap-2 mb-3">
            {section.rounds && section.rounds > 1 && (
              <span className="px-2 py-0.5 bg-secondary rounded text-xs text-foreground">
                {section.rounds} rounds
              </span>
            )}
            {section.rest_between_rounds && (
              <span className="px-2 py-0.5 bg-secondary rounded text-xs text-foreground">
                Rest: {section.rest_between_rounds}s entre rounds
              </span>
            )}
            {section.between_rounds_task && (
              <span className="px-2 py-0.5 bg-secondary rounded text-xs text-foreground">
                Après chaque round : {section.between_rounds_task}
              </span>
            )}
            {section.focus && (
              <span className="px-2 py-0.5 bg-secondary rounded text-xs text-foreground">
                Focus: {section.focus}
              </span>
            )}
          </div>

          {section.goal && (
            <p className="text-sm text-muted-foreground mb-3">{section.goal}</p>
          )}
          {section.description && (
            <p className="text-sm text-muted-foreground italic mb-3">{section.description}</p>
          )}

          {/* Exercises */}
          {section.exercises && section.exercises.length > 0 && (
            <div className="space-y-3 lg:space-y-4">
              {section.exercises.map((exercise, idx) => (
                <RichExerciseDisplay key={idx} exercise={exercise} idx={idx} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Nested sections */}
      {section.sections?.map((sub, idx) => (
        <div key={idx} className="ml-0 mt-4">
          <RichSectionDisplay section={sub} />
        </div>
      ))}
    </div>
  )
}
