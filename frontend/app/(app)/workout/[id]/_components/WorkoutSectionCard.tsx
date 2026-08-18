import { Exercise, WorkoutSection } from '@/domain/entities/workout-structure'

const FORMAT_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  amrap: { bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
  emom: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  'for time': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  for_time: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  tabata: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  warmup: { bg: 'bg-secondary', text: 'text-muted-foreground', border: 'border-border' },
  cooldown: { bg: 'bg-secondary', text: 'text-muted-foreground', border: 'border-border' },
  strength: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  skill_work: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
}

const DEFAULT_COLORS = { bg: 'bg-secondary', text: 'text-muted-foreground', border: 'border-border' }

function getSectionColors(section: WorkoutSection) {
  const formatLower = section.format?.toLowerCase() || ''
  const sectionType = section.type

  // E2MOM, E3MOM, etc. → EMOM colors
  if (/e\d+mom/.test(formatLower)) return FORMAT_COLORS['emom']

  for (const key of Object.keys(FORMAT_COLORS)) {
    if (formatLower.includes(key)) return FORMAT_COLORS[key]
  }
  if (FORMAT_COLORS[sectionType]) return FORMAT_COLORS[sectionType]

  return DEFAULT_COLORS
}

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

function ExerciseRow({ exercise, idx }: { exercise: Exercise; idx: number }) {
  return (
    <div className="flex items-start justify-between gap-3 p-3 bg-secondary/40 rounded-lg">
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm flex-shrink-0 mt-0.5">
          {idx + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-foreground">{exercise.name}</div>

          <div className="flex flex-wrap gap-1.5 mt-1">
            {exercise.duration && (
              <span className="px-2 py-0.5 bg-background rounded text-xs text-muted-foreground border border-border">{exercise.duration}</span>
            )}
            {exercise.distance && (
              <span className="px-2 py-0.5 bg-background rounded text-xs text-muted-foreground border border-border">{exercise.distance}</span>
            )}
            {exercise.per_side && (
              <span className="px-2 py-0.5 bg-background rounded text-xs text-muted-foreground border border-border">par côté</span>
            )}
            {exercise.tempo && (
              <span className="px-2 py-0.5 bg-background rounded text-xs text-muted-foreground border border-border">Tempo: {exercise.tempo}</span>
            )}
          </div>

          {exercise.weight && (
            <div className="text-sm text-muted-foreground mt-1">{exercise.weight}</div>
          )}

          <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
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
            <div className="text-xs text-muted-foreground mt-1 italic">{exercise.details}</div>
          )}
        </div>
      </div>
      {exercise.reps && (
        <div className="text-foreground font-semibold text-sm whitespace-nowrap">
          {exercise.reps} reps
        </div>
      )}
    </div>
  )
}

export function WorkoutSectionCard({ section }: { section: WorkoutSection }) {
  const colors = getSectionColors(section)
  const formatLabel = getFormatLabel(section)

  return (
    <div className="space-y-4">
      <div className="bg-card border border-border rounded-lg p-4 lg:p-5">
        {/* Section Header */}
        <div className="flex items-center gap-2 lg:gap-3 mb-3 flex-wrap">
          <h3 className="text-lg font-semibold text-foreground">
            {section.title || section.format || section.type}
          </h3>
          {formatLabel && (
            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${colors.bg} ${colors.text} ${colors.border}`}>
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
            <span className="px-2 py-0.5 bg-secondary rounded text-xs text-muted-foreground border border-border">
              {section.rounds} rounds
            </span>
          )}
          {section.rest_between_rounds && (
            <span className="px-2 py-0.5 bg-secondary rounded text-xs text-muted-foreground border border-border">
              Rest: {section.rest_between_rounds}s entre rounds
            </span>
          )}
          {section.between_rounds_task && (
            <span className="px-2 py-0.5 bg-secondary rounded text-xs text-muted-foreground border border-border">
              Après chaque round : {section.between_rounds_task}
            </span>
          )}
          {section.focus && (
            <span className="px-2 py-0.5 bg-secondary rounded text-xs text-muted-foreground border border-border">
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
          <div className="space-y-2.5">
            {section.exercises.map((exercise, idx) => (
              <ExerciseRow key={idx} exercise={exercise} idx={idx} />
            ))}
          </div>
        )}
      </div>

      {/* Nested sections */}
      {section.sections?.map((sub, idx) => (
        <div key={idx} className="mt-4">
          <WorkoutSectionCard section={sub} />
        </div>
      ))}
    </div>
  )
}
