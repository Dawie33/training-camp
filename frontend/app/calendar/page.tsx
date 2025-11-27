'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { ScheduleWorkoutModal } from '@/components/calendar/ScheduleWorkoutModal'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { useWorkoutSchedule } from './hooks/useWorkoutSchedule'
import { format, startOfMonth, endOfMonth, addMonths, subMonths, addDays, addWeeks, subWeeks, subDays } from 'date-fns'
import { fr } from 'date-fns/locale'

type ViewMode = 'day' | 'week' | 'month'

interface DayWorkout {
  id: string
  scheduleId: string
  name: string
  type: 'scheduled' | 'completed' | 'skipped' | 'rescheduled'
  intensity?: string
  duration?: number
  difficulty?: string
  workout_type?: string
}

interface CalendarDay {
  date: Date
  dayName: string
  dayNumber: number
  isToday: boolean
  isCurrentMonth?: boolean
  workouts: DayWorkout[]
}

function CalendarContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  // Calculate date range for fetching schedules
  const dateRange = useMemo(() => {
    const start = startOfMonth(addMonths(currentDate, -1))
    const end = endOfMonth(addMonths(currentDate, 1))
    return {
      start_date: format(start, 'yyyy-MM-dd'),
      end_date: format(end, 'yyyy-MM-dd'),
    }
  }, [currentDate])

  const { schedules, loading, createSchedule, deleteSchedule, markAsCompleted, markAsSkipped } = useWorkoutSchedule(dateRange)

  // Helper pour récupérer les workouts d'un jour
  const getWorkoutsForDate = useCallback((date: Date): DayWorkout[] => {
    const dateStr = format(date, 'yyyy-MM-dd')
    return schedules
      .filter((s) => {
        // Normaliser la date du schedule pour la comparaison
        const scheduleDateObj = new Date(s.scheduled_date)
        const scheduleDate = new Date(scheduleDateObj.getTime() - scheduleDateObj.getTimezoneOffset() * 60000)
          .toISOString()
          .split('T')[0]
        return scheduleDate === dateStr
      })
      .map((schedule) => ({
        id: schedule.id,
        scheduleId: schedule.id,
        name: schedule.workout_name || 'Workout',
        type: schedule.status,
        intensity: schedule.intensity,
        duration: schedule.estimated_duration,
        difficulty: schedule.difficulty,
        workout_type: schedule.workout_type,
      }))
  }, [schedules])

  // Génère les jours pour la vue jour
  const dayView = useMemo(() => {
    const today = new Date()
    const isToday =
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()

    const dayName = format(currentDate, 'EEEE', { locale: fr })

    return {
      date: currentDate,
      dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      dayNumber: currentDate.getDate(),
      isToday,
      workouts: getWorkoutsForDate(currentDate),
    }
  }, [currentDate, getWorkoutsForDate])

  // Génère les jours de la semaine
  const weekView = useMemo(() => {
    const today = new Date()
    const currentDay = currentDate.getDay()
    const monday = new Date(currentDate)
    monday.setDate(currentDate.getDate() - currentDay + 1)

    const days: CalendarDay[] = []
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)

      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()

      days.push({
        date,
        dayName: dayNames[i],
        dayNumber: date.getDate(),
        isToday,
        workouts: getWorkoutsForDate(date),
      })
    }

    return days
  }, [currentDate, getWorkoutsForDate])

  // Génère les jours du mois
  const monthView = useMemo(() => {
    const today = new Date()
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1)

    // Trouver le lundi de la semaine contenant le premier jour du mois
    const startDay = new Date(firstDay)
    const dayOfWeek = firstDay.getDay()
    const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1
    startDay.setDate(firstDay.getDate() - diff)

    // Générer 6 semaines (42 jours) pour avoir une grille complète
    const days: CalendarDay[] = []
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

    for (let i = 0; i < 42; i++) {
      const date = new Date(startDay)
      date.setDate(startDay.getDate() + i)

      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()

      const isCurrentMonth = date.getMonth() === currentDate.getMonth()

      days.push({
        date,
        dayName: dayNames[i % 7],
        dayNumber: date.getDate(),
        isToday,
        isCurrentMonth,
        workouts: getWorkoutsForDate(date),
      })
    }

    return days
  }, [currentDate, getWorkoutsForDate])

  const getHeaderTitle = () => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, 'EEEE d MMMM yyyy', { locale: fr })
      case 'week': {
        if (weekView.length === 0) return ''
        const monday = weekView[0].date
        const sunday = weekView[6].date
        return `${monday.getDate()} - ${sunday.getDate()} ${format(monday, 'MMMM yyyy', { locale: fr })}`
      }
      case 'month':
        return format(currentDate, 'MMMM yyyy', { locale: fr })
    }
  }

  const handlePrevious = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(subDays(currentDate, 1))
        break
      case 'week':
        setCurrentDate(subWeeks(currentDate, 1))
        break
      case 'month':
        setCurrentDate(subMonths(currentDate, 1))
        break
    }
  }

  const handleNext = () => {
    switch (viewMode) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1))
        break
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1))
        break
      case 'month':
        setCurrentDate(addMonths(currentDate, 1))
        break
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date())
  }

  const getWorkoutTypeStyle = (type: string) => {
    switch (type) {
      case 'completed':
        return 'bg-green-500/10 border-green-500/50'
      case 'scheduled':
        return 'bg-blue-500/10 border-blue-500/50'
      case 'skipped':
        return 'bg-gray-500/10 border-gray-500/50'
      case 'rescheduled':
        return 'bg-orange-500/10 border-orange-500/50'
      default:
        return 'bg-muted border-border'
    }
  }

  const handleAddWorkout = (date: Date) => {
    setSelectedDate(date)
    setModalOpen(true)
  }

  const handleScheduleWorkout = async (workoutId: string, notes?: string) => {
    await createSchedule({
      workout_id: workoutId,
      scheduled_date: format(selectedDate, 'yyyy-MM-dd'),
      notes,
    })
  }

  const handleDeleteSchedule = async (scheduleId: string) => {
    if (confirm('Voulez-vous vraiment supprimer cette planification ?')) {
      await deleteSchedule(scheduleId)
    }
  }

  const renderDayView = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card rounded-lg border p-6">
        <div className="text-center mb-6 pb-4 border-b">
          <h2 className="text-3xl font-bold capitalize">{dayView.dayName}</h2>
          <p className="text-4xl font-bold text-primary mt-2">{dayView.dayNumber}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </p>
        </div>

        <div className="space-y-3">
          {dayView.workouts.map((workout) => (
            <motion.div
              key={workout.id}
              className={`
                w-full p-4 rounded-lg border
                ${getWorkoutTypeStyle(workout.type)}
              `}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className={`
                    text-base font-semibold mb-2
                    ${workout.type === 'completed' ? 'text-green-700 dark:text-green-400' : ''}
                    ${workout.type === 'scheduled' ? 'text-blue-700 dark:text-blue-400' : ''}
                    ${workout.type === 'skipped' ? 'text-gray-700 dark:text-gray-400' : ''}
                    ${workout.type === 'rescheduled' ? 'text-orange-700 dark:text-orange-400' : ''}
                  `}>
                    {workout.name}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {workout.workout_type && (
                      <div className="text-xs text-muted-foreground capitalize">
                        {workout.workout_type.replace(/_/g, ' ')}
                      </div>
                    )}
                    {workout.difficulty && (
                      <div className="text-xs px-2 py-1 rounded bg-muted font-medium capitalize">
                        {workout.difficulty}
                      </div>
                    )}
                    {workout.duration && (
                      <div className="text-xs text-muted-foreground">
                        {workout.duration} min
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteSchedule(workout.scheduleId)}
                  className="ml-2"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {workout.type === 'scheduled' && (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAsCompleted(workout.scheduleId)}
                  >
                    Marquer complété
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => markAsSkipped(workout.scheduleId)}
                  >
                    Marquer sauté
                  </Button>
                </div>
              )}
            </motion.div>
          ))}

          {dayView.workouts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Aucun workout prévu pour ce jour
            </div>
          )}

          <motion.button
            onClick={() => handleAddWorkout(dayView.date)}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-lg border-2 border-dashed transition-all hover:bg-accent hover:border-primary"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5 text-muted-foreground" />
            <span className="text-sm font-medium text-muted-foreground">Ajouter un workout</span>
          </motion.button>
        </div>
      </div>
    </div>
  )

  const renderWeekView = () => (
    <div className="grid grid-cols-7 gap-3">
      {weekView.map((day, index) => (
        <motion.div
          key={`${day.date.toISOString()}-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={`
            relative rounded-lg border p-4 min-h-[160px]
            transition-all
            ${day.isToday ? 'ring-2 ring-primary bg-primary/5' : 'bg-card hover:bg-accent'}
          `}
        >
          <div className="flex flex-col items-center mb-3 pb-2 border-b">
            <span className="text-xs text-muted-foreground font-medium">
              {day.dayName}
            </span>
            <span className={`
              text-lg font-bold mt-1
              ${day.isToday ? 'text-primary' : 'text-foreground'}
            `}>
              {day.dayNumber}
            </span>
          </div>

          <div className="space-y-2">
            {day.workouts.map((workout) => (
              <div
                key={workout.id}
                className={`
                  w-full p-2 rounded border
                  ${getWorkoutTypeStyle(workout.type)}
                `}
              >
                <div className={`
                  text-xs font-medium line-clamp-2
                  ${workout.type === 'completed' ? 'text-green-700 dark:text-green-400' : ''}
                  ${workout.type === 'scheduled' ? 'text-blue-700 dark:text-blue-400' : ''}
                  ${workout.type === 'skipped' ? 'text-gray-700 dark:text-gray-400' : ''}
                  ${workout.type === 'rescheduled' ? 'text-orange-700 dark:text-orange-400' : ''}
                `}>
                  {workout.name}
                </div>
              </div>
            ))}
          </div>

          <motion.button
            onClick={() => handleAddWorkout(day.date)}
            className={`
              w-full flex items-center justify-center gap-2 p-2 rounded border-2 border-dashed
              transition-all hover:bg-accent hover:border-primary
              ${day.workouts.length > 0 ? 'mt-2 opacity-50 hover:opacity-100' : 'mt-0'}
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">Ajouter</span>
          </motion.button>

          {day.isToday && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full" />
          )}
        </motion.div>
      ))}
    </div>
  )

  const renderMonthView = () => (
    <div>
      {/* Headers des jours */}
      <div className="grid grid-cols-7 gap-2 mb-2">
        {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((day) => (
          <div key={day} className="text-center text-sm font-semibold text-muted-foreground py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Grille du mois */}
      <div className="grid grid-cols-7 gap-2">
        {monthView.map((day, index) => (
          <motion.div
            key={`${day.date.toISOString()}-${index}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.01 }}
            className={`
              relative rounded-lg border p-2 min-h-[100px]
              transition-all
              ${day.isToday ? 'ring-2 ring-primary bg-primary/5' : 'bg-card'}
              ${!day.isCurrentMonth ? 'opacity-40' : ''}
            `}
          >
            <div className="text-right mb-1">
              <span className={`
                text-sm font-semibold
                ${day.isToday ? 'text-primary' : day.isCurrentMonth ? 'text-foreground' : 'text-muted-foreground'}
              `}>
                {day.dayNumber}
              </span>
            </div>

            <div className="space-y-1 mb-1">
              {day.workouts.slice(0, 2).map((workout) => (
                <div
                  key={workout.id}
                  className={`
                    w-full text-[9px] px-1 py-0.5 rounded truncate
                    ${getWorkoutTypeStyle(workout.type)}
                    ${workout.type === 'completed' ? 'text-green-700 dark:text-green-400' : ''}
                    ${workout.type === 'scheduled' ? 'text-blue-700 dark:text-blue-400' : ''}
                    ${workout.type === 'skipped' ? 'text-gray-700 dark:text-gray-400' : ''}
                    ${workout.type === 'rescheduled' ? 'text-orange-700 dark:text-orange-400' : ''}
                  `}
                >
                  {workout.name}
                </div>
              ))}
              {day.workouts.length > 2 && (
                <div className="text-[8px] text-center text-muted-foreground">
                  +{day.workouts.length - 2}
                </div>
              )}
            </div>

            {/* Add workout button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleAddWorkout(day.date)
              }}
              className="w-full flex items-center justify-center p-1 rounded border border-dashed border-muted-foreground/30 hover:border-primary hover:bg-accent transition-all group"
            >
              <Plus className="w-3 h-3 text-muted-foreground group-hover:text-primary" />
            </button>

            {day.isToday && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )

  return (
    <motion.div
      className="min-h-screen bg-background"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="p-4 sm:p-6 lg:p-8 space-y-6 pt-16 lg:pt-4">
        {/* Header */}
        <motion.div variants={fadeInUp}>
          <h1 className="text-2xl sm:text-3xl font-bold">Calendrier</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Gérez votre planning d'entraînement</p>
        </motion.div>

        {/* Calendar Card */}
        <motion.div variants={fadeInUp} className="bg-card rounded-lg border p-4 sm:p-6">
          {/* View Mode Tabs */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Button
              variant={viewMode === 'day' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('day')}
            >
              Jour
            </Button>
            <Button
              variant={viewMode === 'week' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('week')}
            >
              Semaine
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('month')}
            >
              Mois
            </Button>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              <div>
                <h3 className="text-lg font-semibold capitalize">{getHeaderTitle()}</h3>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToday}
              >
                Aujourd'hui
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Views */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <>
              {viewMode === 'day' && renderDayView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'month' && renderMonthView()}
            </>
          )}

          {/* Legend */}
          <div className="mt-6 pt-4 border-t flex flex-wrap gap-4">
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded bg-blue-500/10 border border-blue-500/50" />
              <span className="text-muted-foreground">Programmé</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded bg-green-500/10 border border-green-500/50" />
              <span className="text-muted-foreground">Complété</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded bg-gray-500/10 border border-gray-500/50" />
              <span className="text-muted-foreground">Sauté</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className="w-3 h-3 rounded bg-orange-500/10 border border-orange-500/50" />
              <span className="text-muted-foreground">Replanifié</span>
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
