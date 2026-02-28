'use client'

import 'temporal-polyfill/global'
import './calendar-theme.css'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { LogWorkoutModal } from '@/components/calendar/LogWorkoutModal'
import { ParseBoxWodModal } from '@/components/calendar/ParseBoxWodModal'
import { ScheduleWorkoutModal } from '@/components/calendar/ScheduleWorkoutModal'
import { WeeklyPlannerModal } from '@/components/calendar/WeeklyPlannerModal'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { WorkoutPrintView, printWorkout } from '@/components/workout/WorkoutPrintView'
import type { Workouts } from '@/domain/entities/workout'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { workoutsService } from '@/services'
import { googleCalendarApi } from '@/services/google-calendar'
import type { WorkoutSchedule } from '@/services/schedule'
import { createViewDay, createViewMonthGrid, createViewWeek } from '@schedule-x/calendar'
import { createDragAndDropPlugin } from '@schedule-x/drag-and-drop'
import { createEventModalPlugin } from '@schedule-x/event-modal'
import { createEventsServicePlugin } from '@schedule-x/events-service'
import { ScheduleXCalendar, useCalendarApp } from '@schedule-x/react'
import { format, startOfWeek } from 'date-fns'
import { motion } from 'framer-motion'
import { Brain, Calendar, Check, Dumbbell, ExternalLink, FileDown, SkipForward, Trash2, Trophy, Unlink } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useWorkoutSchedule } from './hooks/useWorkoutSchedule'

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
      {!!calendarEvent.workout_type && (
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
  const onLog = calendarEvent._onLog as (() => void) | undefined
  const onPrint = calendarEvent._onPrint as (() => void) | undefined

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
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 pt-3 border-t border-white/10">
        {status === 'scheduled' && (
          <>
            {onLog && (
              <Button
                size="sm"
                onClick={onLog}
                className="bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
              >
                <Trophy className="w-3.5 h-3.5 mr-1" />
                Logger le WOD
              </Button>
            )}
            <Button
              size="sm"
              onClick={onComplete}
              className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
            >
              <Check className="w-3.5 h-3.5 mr-1" />
              Terminer sans résultat
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
        {!!(calendarEvent.workout_id || calendarEvent.personalized_workout_id) && (
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
  const [dateActionOpen, setDateActionOpen] = useState(false)
  const [parseBoxWodOpen, setParseBoxWodOpen] = useState(false)
  const [weeklyPlannerOpen, setWeeklyPlannerOpen] = useState(false)
  const [logModalOpen, setLogModalOpen] = useState(false)
  const [logModalData, setLogModalData] = useState<{
    scheduleId: string
    workoutId: string
    workoutName: string
    workoutType?: string
  } | null>(null)

  const [googleConnected, setGoogleConnected] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [printWorkoutData, setPrintWorkoutData] = useState<Workouts | null>(null)

  const { schedules, loading, createSchedule, refetch, updateSchedule, deleteSchedule, markAsCompleted, markAsSkipped } = useWorkoutSchedule()

  // Vérifier le statut Google Calendar au chargement + détecter le retour OAuth
  useEffect(() => {
    googleCalendarApi.getStatus().then(setGoogleConnected).catch(() => { })

    const params = new URLSearchParams(window.location.search)
    if (params.get('google_connected') === 'true') {
      setGoogleConnected(true)
      toast.success('Google Calendar connecté !')
      window.history.replaceState({}, '', '/calendar')
    }
  }, [])

  const handleGoogleConnect = async () => {
    setGoogleLoading(true)
    try {
      const url = await googleCalendarApi.getAuthUrl()
      window.location.href = url
    } catch {
      toast.error('Erreur lors de la connexion à Google Calendar')
      setGoogleLoading(false)
    }
  }

  const handleGoogleDisconnect = async () => {
    setGoogleLoading(true)
    try {
      await googleCalendarApi.disconnect()
      setGoogleConnected(false)
      toast.success('Google Calendar déconnecté')
    } catch {
      toast.error('Erreur lors de la déconnexion')
    } finally {
      setGoogleLoading(false)
    }
  }

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
        personalized_workout_id: schedule.personalized_workout_id,
        // Action callbacks
        _onComplete: () => markAsCompleted(schedule.id),
        _onSkip: () => markAsSkipped(schedule.id),
        _onDelete: () => {
          if (confirm('Voulez-vous vraiment supprimer cette planification ?')) {
            deleteSchedule(schedule.id)
            eventModalPlugin.close()
          }
        },
        _onLog: schedule.workout_id ? () => {
          setLogModalData({
            scheduleId: schedule.id,
            workoutId: schedule.workout_id!,
            workoutName: schedule.workout_name ?? 'WOD',
            workoutType: schedule.workout_type,
          })
          setLogModalOpen(true)
          eventModalPlugin.close()
        } : undefined,
        _onPrint: schedule.workout_id ? () => {
          eventModalPlugin.close()
          workoutsService.getById(schedule.workout_id!).then((w) => {
            setPrintWorkoutData(w)
            setTimeout(printWorkout, 100)
          }).catch(() => toast.error('Impossible de charger le workout'))
        } : undefined,
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
        setDateActionOpen(true)
      },
      onClickDateTime: (dateTime: Temporal.ZonedDateTime) => {
        const d = new Date(dateTime.year, dateTime.month - 1, dateTime.day)
        setSelectedDate(d)
        setDateActionOpen(true)
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

  const handleScheduleWorkout = async (
    payload: { workout_id?: string; personalized_workout_id?: string },
    notes?: string
  ) => {
    await createSchedule({
      ...payload,
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
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold">
              <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">Calendrier</span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400">Gérez votre planning d&apos;entraînement</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {googleConnected ? (
              <Button
                onClick={handleGoogleDisconnect}
                disabled={googleLoading}
                className="bg-red-500/10 text-red-400 border border-red-500/30 hover:bg-red-500/20"
              >
                <Unlink className="w-4 h-4 mr-2" />
                Déconnecter Google
              </Button>
            ) : (
              <Button
                onClick={handleGoogleConnect}
                disabled={googleLoading}
                className="bg-white/10 text-white border border-white/20 hover:bg-white/20"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {googleLoading ? 'Connexion...' : 'Sync Google Agenda'}
              </Button>
            )}
            <Button
              onClick={() => setWeeklyPlannerOpen(true)}
              className="bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
            >
              <Calendar className="w-4 h-4 mr-2" />
              Planifier ma semaine
            </Button>
          </div>
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

      {/* Date action picker */}
      <Dialog open={dateActionOpen} onOpenChange={setDateActionOpen}>
        <DialogContent className="sm:max-w-[320px] bg-slate-900 border-white/10 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-base">
              {format(selectedDate, 'EEEE dd MMMM')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 pt-2">
            <button
              onClick={() => {
                setDateActionOpen(false)
                setModalOpen(true)
              }}
              className="flex items-center gap-3 w-full p-3 rounded-xl border border-white/10 hover:border-orange-500/50 hover:bg-orange-500/10 transition-all text-left"
            >
              <Dumbbell className="w-5 h-5 text-orange-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-white">Chercher un workout existant</div>
                <div className="text-xs text-slate-400">Parcourir la bibliothèque</div>
              </div>
            </button>
            <button
              onClick={() => {
                setDateActionOpen(false)
                setParseBoxWodOpen(true)
              }}
              className="flex items-center gap-3 w-full p-3 rounded-xl border border-white/10 hover:border-blue-500/50 hover:bg-blue-500/10 transition-all text-left"
            >
              <Brain className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <div className="text-sm font-medium text-white">Box WOD — coller depuis Instagram</div>
                <div className="text-xs text-slate-400">L&apos;IA parse et structure le WOD</div>
              </div>
            </button>
          </div>
        </DialogContent>
      </Dialog>

      <ScheduleWorkoutModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        selectedDate={selectedDate}
        onSchedule={handleScheduleWorkout}
      />

      <ParseBoxWodModal
        open={parseBoxWodOpen}
        onOpenChange={setParseBoxWodOpen}
        selectedDate={selectedDate}
        onSchedule={handleScheduleWorkout}
      />

      <WeeklyPlannerModal
        open={weeklyPlannerOpen}
        onOpenChange={setWeeklyPlannerOpen}
        weekStart={startOfWeek(new Date(), { weekStartsOn: 1 })}
        onPlanned={() => refetch()}
      />

      {logModalData && (
        <LogWorkoutModal
          open={logModalOpen}
          onOpenChange={setLogModalOpen}
          scheduleId={logModalData.scheduleId}
          workoutId={logModalData.workoutId}
          workoutName={logModalData.workoutName}
          workoutType={logModalData.workoutType}
          onLogged={() => { refetch(); setLogModalOpen(false) }}
        />
      )}

      {printWorkoutData && <WorkoutPrintView workout={printWorkoutData} />}
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
