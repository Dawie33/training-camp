export const statusColors: Record<string, { dot: string; text: string; bg: string }> = {
  scheduled: { dot: 'bg-blue-500', text: 'text-blue-700', bg: 'bg-blue-500/15' },
  completed: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-500/15' },
  skipped: { dot: 'bg-stone-400', text: 'text-stone-500', bg: 'bg-stone-400/15' },
  rescheduled: { dot: 'bg-primary', text: 'text-primary', bg: 'bg-primary/15' },
}

// Badge coloré par module (affiché uniquement pour les modules non-CrossFit)
export const moduleBadges: Record<string, { label: string; color: string }> = {
  running: { label: 'RUN', color: 'bg-cyan-500/15 text-cyan-700 border border-cyan-500/30' },
  biking: { label: 'VÉLO', color: 'bg-blue-500/15 text-blue-700 border border-blue-500/30' },
  strength: { label: 'FORCE', color: 'bg-violet-500/15 text-violet-700 border border-violet-500/30' },
  skill: { label: 'SKILL', color: 'bg-primary text-primary-foreground' },
}

export function CustomEventContent({ calendarEvent }: { calendarEvent: Record<string, unknown> }) {
  const status = (calendarEvent.status as string) || 'scheduled'
  const module = (calendarEvent.module as string) || 'crossfit'
  const colors = statusColors[status] || statusColors.scheduled
  const badge = moduleBadges[module]

  return (
    <div className="flex items-center gap-1.5 px-1.5 py-0.5 w-full overflow-hidden">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
      {badge && (
        <span className={`text-[9px] font-bold px-1 rounded flex-shrink-0 ${badge.color}`}>
          {badge.label}
        </span>
      )}
      <span className={`text-xs font-medium truncate ${colors.text}`}>
        {calendarEvent.title as string}
      </span>
      {!!calendarEvent.workout_type && !badge && (
        <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
          {(calendarEvent.workout_type as string).replace(/_/g, ' ')}
        </span>
      )}
    </div>
  )
}
