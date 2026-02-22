'use client'

import 'temporal-polyfill/global'
import './calendar-theme.css'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { ScheduleWorkoutModal } from '@/components/calendar/ScheduleWorkoutModal'
import { motion } from 'framer-motion'
import { Check, ExternalLink, SkipForward, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { useWorkoutSchedule } from './hooks/useWorkoutSchedule'
import { format } from 'date-fns'
import { useCalendarApp, ScheduleXCalendar } from '@schedule-x/react'
import { createViewDay, createViewWeek, createViewMonthGrid } from '@schedule-x/calendar'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import { createDragAndDropPlugin } from '@schedule-x/drag-and-drop'
import { createEventModalPlugin } from '@schedule-x/event-modal'
import type { WorkoutSchedule } from '@/services/schedule'

// Status color mapping
const statusColors: Record<string, { dot: string; text: string; bg: string }> = {
  scheduled: { dot: 'bg-blue-500', text: 'text-blue-400', bg: 'bg-blue-500/20' },
  completed: { dot: 'bg-green-500', text: 'text-green-400', bg: 'bg-green-500/20' },
  skipped: { dot: 'bg-gray-500', text: 'text-gray-400', bg: 'bg-gray-500/20' },
  rescheduled: { dot: 'bg-orange-500', text: 'text-orange-400', bg: 'bg-orange-500/20' },
}

// Custom event component for month/date/time grid
function CustomEventContent({ calendarEvent }: { calendarEvent: Record<string, unknown> }) {
  const status = (calendarEvent.status as string) || 'scheduled'
  const colors = statusColors[status] || statusColors.scheduled

  return (
    <div className="flex items-center gap-1.5 px-1.5 py-0.5 w-full overflow-hidden">
      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${colors.dot}`} />
      <span className={`text-xs font-medium truncate ${colors.text}`}>
        {calendarEvent.title as string}
      </span>
      {calendarEvent.workout_type && (
        <span className="text-[10px] text-slate-500 truncate hidden sm:inline">
          {(calendarEvent.workout_type as string).replace(/_/g, ' ')}
        </span>
      )}
    </div>
  )
}

// Custom event modal component
function CustomEventModal({ calendarEvent }: { calendarEvent: Record<string, unknown> }) {
  const status = (calendarEvent.status as string) || 'scheduled'
  const colors = statusColors[status] || statusColors.scheduled
  const onComplete = calendarEvent._onComplete as (() => void) | undefined
  const onSkip = calendarEvent._onSkip as (() => void) | undefined
  const onDelete = calendarEvent._onDelete as (() => void) | undefined

  return (
    <div className="p-4 min-w-[280px]">
      {/* Header */}
      <div className="flex items-start gap-3 mb-4">
        <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${colors.dot}`} />
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-slate-100 truncate">
            {calendarEvent.title as string}
          </h3>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full capitalize ${colors.bg} ${colors.text}`}>
              {status === 'scheduled' ? 'Programmé' : status === 'completed' ? 'Complété' : status === 'skipped' ? 'Sauté' : 'Replanifié'}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="space-y-2 mb-4">
        {calendarEvent.workout_type && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Type:</span>
            <span className="text-slate-300 capitalize">{(calendarEvent.workout_type as string).replace(/_/g, ' ')}</span>
          </div>
        )}
        {calendarEvent.difficulty && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Difficulté:</span>
            <span className="text-slate-300 capitalize">{calendarEvent.difficulty as string}</span>
          </div>
        )}
        {calendarEvent.duration && (
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-500">Durée:</span>
            <span className="text-slate-300">{calendarEvent.duration as number} min</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
        {status === 'scheduled' && (
          <>
            <Button
              size="sm"
              onClick={onComplete}
              className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Complété
            </Button>
            <Button
              size="sm"
              onClick={onSkip}
              className="bg-slate-500/20 text-slate-400 border border-slate-500/30 hover:bg-slate-500/30"
            >
              <SkipForward className="w-3.5 h-3.5 mr-1" />
              Sauté
            </Button>
          </>
        )}
        {calendarEvent.workout_id && (
          <Button
            size="sm"
            asChild
            className="bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
          >
            <a href={`/workout/${calendarEvent.workout_id}`}>
              <ExternalLink className="w-3.5 h-3.5 mr-1" />
              Voir
            </a>
          </Button>
        )}
        <Button
          size="sm"
          onClick={onDelete}
          className="bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30 ml-auto"
        >
          <Trash2 className="w-3.5 h-3.5 mr-1" />
          Supprimer
        </Button>
      </div>
    </div>
  )
}

function CalendarContent() {
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const { schedules, loading, createSchedule, updateSchedule, deleteSchedule, markAsCompleted, markAsSkipped } = useWorkoutSchedule()

  const [eventsService] = useState(() => createEventsServicePlugin())
  const [eventModalPlugin] = useState(() => createEventModalPlugin())

  // Map schedules to schedule-x events
  const mapSchedulesToEvents = useCallback((scheduleList: WorkoutSchedule[]) => {
    return scheduleList.map((schedule) => {
      // Normalize the date
      const scheduleDateObj = new Date(schedule.scheduled_date)
      const dateStr = new Date(scheduleDateObj.getTime() - scheduleDateObj.getTimezoneOffset() * 60000)
        .toISOString()
        .split('T')[0]

      return {
        id: schedule.id,
        title: schedule.workout_name || 'Workout',
        start: Temporal.PlainDate.from(dateStr),
        end: Temporal.PlainDate.from(dateStr),
        // Custom data
        status: schedule.status,
        workout_type: schedule.workout_type,
        difficulty: schedule.difficulty,
        duration: schedule.estimated_duration,
        workout_id: schedule.workout_id,
        // Action callbacks
        _onComplete: () => markAsCompleted(schedule.id),
        _onSkip: () => markAsSkipped(schedule.id),
        _onDelete: () => {
          if (confirm('Voulez-vous vraiment supprimer cette planification ?')) {
            deleteSchedule(schedule.id)
            eventModalPlugin.close()
          }
        },
      }
    })
  }, [markAsCompleted, markAsSkipped, deleteSchedule, eventModalPlugin])

  const calendar = useCalendarApp({
    locale: 'fr-FR',
    isDark: true,
    defaultView: createViewMonthGrid().name,
    views: [createViewDay(), createViewWeek(), createViewMonthGrid()],
    events: [],
    plugins: [eventsService, createDragAndDropPlugin(), eventModalPlugin],
    callbacks: {
      onClickDate: (date: Temporal.PlainDate) => {
        const d = new Date(date.year, date.month - 1, date.day)
        setSelectedDate(d)
        setModalOpen(true)
      },
      onClickDateTime: (dateTime: Temporal.ZonedDateTime) => {
        const d = new Date(dateTime.year, dateTime.month - 1, dateTime.day)
        setSelectedDate(d)
        setModalOpen(true)
      },
      onEventUpdate: (updatedEvent: Record<string, unknown>) => {
        const start = updatedEvent.start as Temporal.PlainDate | Temporal.ZonedDateTime
        let dateStr: string
        if ('toPlainDate' in start) {
          dateStr = start.toPlainDate().toString()
        } else {
          dateStr = start.toString()
        }
        updateSchedule(updatedEvent.id as string, { scheduled_date: dateStr })
      },
    },
  })

  // Sync schedules to eventsService whenever they change
  useEffect(() => {
    if (!loading) {
      const events = mapSchedulesToEvents(schedules)
      eventsService.set(events)
    }
  }, [schedules, loading, mapSchedulesToEvents, eventsService])

  const handleScheduleWorkout = async (workoutId: string, notes?: string) => {
    await createSchedule({
      workout_id: workoutId,
      scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
      notes,
    })
  }

  const customComponents = useMemo(() => ({
    monthGridEvent: CustomEventContent,
    dateGridEvent: CustomEventContent,
    timeGridEvent: CustomEventContent,
    eventModal: CustomEventModal,
  }), [])

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div variants={fadeInUp}>
          <h1 className="text-2xl sm:text-4xl font-bold">
            <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">Calendrier</span>
          </h1>
          <p className="text-sm sm:text-base text-slate-400">Gérez votre planning d&apos;entraînement</p>
        </motion.div>

        {/* Calendar */}
        <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
            </div>
          ) : (
            <ScheduleXCalendar calendarApp={calendar} customComponents={customComponents} />
          )}

          {/* Legend */}
          <div className="mt-6 pt-4 border-t border-white/10 flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/50" />
              <span className="text-slate-400">Programmé</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/50" />
              <span className="text-slate-400">Complété</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded bg-gray-500/20 border border-gray-500/50" />
              <span className="text-slate-400">Sauté</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/50" />
              <span className="text-slate-400">Replanifié</span>
            </div>
          </div>
        </motion.div>
      </div>

      <ScheduleWorkoutModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        selectedDate={selectedDate}
        onSchedule={handleScheduleWorkout}
      />
    </motion.div>
  )
}

export default function CalendarPage() {
  return (
    <ProtectedRoute>
      <CalendarContent />
    </ProtectedRoute>
  )
}
