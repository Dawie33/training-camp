export const statusColors: Record<string, { dot: string; text: string; bg: string }> = {
  scheduled: { dot: 'bg-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/20' },
  completed: { dot: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/20' },
  skipped: { dot: 'bg-gray-500', text: 'text-gray-400', bg: 'bg-gray-500/20' },
  rescheduled: { dot: 'bg-orange-500', text: 'text-orange-400', bg: 'bg-orange-500/20' },
}

export function CustomEventContent({ calendarEvent }: { calendarEvent: Record<string, unknown> }) {
  const status = (calendarEvent.status as string) || 'scheduled'
  const colors = statusColors[status] || statusColors.scheduled

  return (
    <div className="flex items-center gap-1.5 px-1.5 py-0.5 w-full overflow-hidden">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
      <span className={`text-xs font-medium truncate ${colors.text}`}>
        {calendarEvent.title as string}
      </span>
      {!!calendarEvent.workout_type && (
        <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
          {(calendarEvent.workout_type as string).replace(/_/g, ' ')}
        </span>
      )}
    </div>
  )
}
