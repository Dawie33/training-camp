import { moduleBadges, statusColors } from './calendar-event-styles'

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
