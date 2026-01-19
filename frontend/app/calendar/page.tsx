'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { ScheduleWorkoutModal } from '@/components/calendar/ScheduleWorkoutModal'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Trash2 } from 'lucide-react'
import { useCallback, useMemo, useState } from 'react'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { useWorkoutSchedule } from './hooks/useWorkoutSchedule'
import { format, addMonths, subMonths, addDays, addWeeks, subWeeks, subDays } from 'date-fns'
import type { ViewMode, DayWorkout, CalendarDay } from './types'
import { fr } from 'date-fns/locale'

function CalendarContent() {
  const [viewMode, setViewMode] = useState<ViewMode>('week')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())

  const { schedules, loading, createSchedule, deleteSchedule, markAsCompleted, markAsSkipped } = useWorkoutSchedule()

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
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
        <div className="text-center mb-6 pb-4 border-b border-white/10">
          <h2 className="text-3xl font-bold capitalize text-white">{dayView.dayName}</h2>
          <p className="text-4xl font-bold text-orange-400 mt-2">{dayView.dayNumber}</p>
          <p className="text-sm text-slate-400 mt-1">
            {format(currentDate, 'MMMM yyyy', { locale: fr })}
          </p>
        </div>

        <div className="space-y-3">
          {dayView.workouts.map((workout) => (
            <motion.div
              key={workout.id}
              className={`
                w-full p-4 rounded-xl border
                ${getWorkoutTypeStyle(workout.type)}
              `}
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className={`
                    text-base font-semibold mb-2
                    ${workout.type === 'completed' ? 'text-green-400' : ''}
                    ${workout.type === 'scheduled' ? 'text-blue-400' : ''}
                    ${workout.type === 'skipped' ? 'text-gray-400' : ''}
                    ${workout.type === 'rescheduled' ? 'text-orange-400' : ''}
                  `}>
                    {workout.name}
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {workout.workout_type && (
                      <div className="text-xs text-slate-400 capitalize">
                        {workout.workout_type.replace(/_/g, ' ')}
                      </div>
                    )}
                    {workout.difficulty && (
                      <div className="text-xs px-2 py-1 rounded-lg bg-white/10 font-medium capitalize text-slate-300">
                        {workout.difficulty}
                      </div>
                    )}
                    {workout.duration && (
                      <div className="text-xs text-slate-400">
                        {workout.duration} min
                      </div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteSchedule(workout.scheduleId)}
                  className="ml-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              {workout.type === 'scheduled' && (
                <div className="flex gap-2 mt-3">
                  <Button
                    size="sm"
                    onClick={() => markAsCompleted(workout.scheduleId)}
                    className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30"
                  >
                    Marquer complété
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => markAsSkipped(workout.scheduleId)}
                    className="bg-slate-500/20 text-slate-400 border border-slate-500/30 hover:bg-slate-500/30"
                  >
                    Marquer sauté
                  </Button>
                </div>
              )}
            </motion.div>
          ))}

          {dayView.workouts.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              Aucun workout prévu pour ce jour
            </div>
          )}

          <motion.button
            onClick={() => handleAddWorkout(dayView.date)}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-white/20 transition-all hover:bg-white/5 hover:border-orange-400"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-5 h-5 text-slate-400" />
            <span className="text-sm font-medium text-slate-400">Ajouter un workout</span>
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
            relative rounded-xl border p-4 min-h-[160px]
            transition-all
            ${day.isToday ? 'ring-2 ring-orange-400 bg-orange-500/10 border-orange-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}
          `}
        >
          <div className="flex flex-col items-center mb-3 pb-2 border-b border-white/10">
            <span className="text-xs text-slate-400 font-medium">
              {day.dayName}
            </span>
            <span className={`
              text-lg font-bold mt-1
              ${day.isToday ? 'text-orange-400' : 'text-white'}
            `}>
              {day.dayNumber}
            </span>
          </div>

          <div className="space-y-2">
            {day.workouts.map((workout) => (
              <div
                key={workout.id}
                className={`
                  w-full p-2 rounded-lg border
                  ${getWorkoutTypeStyle(workout.type)}
                `}
              >
                <div className={`
                  text-xs font-medium line-clamp-2
                  ${workout.type === 'completed' ? 'text-green-400' : ''}
                  ${workout.type === 'scheduled' ? 'text-blue-400' : ''}
                  ${workout.type === 'skipped' ? 'text-gray-400' : ''}
                  ${workout.type === 'rescheduled' ? 'text-orange-400' : ''}
                `}>
                  {workout.name}
                </div>
              </div>
            ))}
          </div>

          <motion.button
            onClick={() => handleAddWorkout(day.date)}
            className={`
              w-full flex items-center justify-center gap-2 p-2 rounded-lg border-2 border-dashed border-white/20
              transition-all hover:bg-white/10 hover:border-orange-400
              ${day.workouts.length > 0 ? 'mt-2 opacity-50 hover:opacity-100' : 'mt-0'}
            `}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Plus className="w-4 h-4 text-slate-400" />
            <span className="text-xs text-slate-400">Ajouter</span>
          </motion.button>

          {day.isToday && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-orange-400 rounded-full" />
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
          <div key={day} className="text-center text-sm font-semibold text-slate-400 py-2">
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
              relative rounded-xl border p-2 min-h-[100px]
              transition-all
              ${day.isToday ? 'ring-2 ring-orange-400 bg-orange-500/10 border-orange-500/30' : 'bg-white/5 border-white/10'}
              ${!day.isCurrentMonth ? 'opacity-40' : ''}
            `}
          >
            <div className="text-right mb-1">
              <span className={`
                text-sm font-semibold
                ${day.isToday ? 'text-orange-400' : day.isCurrentMonth ? 'text-white' : 'text-slate-500'}
              `}>
                {day.dayNumber}
              </span>
            </div>

            <div className="space-y-1 mb-1">
              {day.workouts.slice(0, 2).map((workout) => (
                <div
                  key={workout.id}
                  className={`
                    w-full text-[9px] px-1 py-0.5 rounded-lg truncate
                    ${getWorkoutTypeStyle(workout.type)}
                    ${workout.type === 'completed' ? 'text-green-400' : ''}
                    ${workout.type === 'scheduled' ? 'text-blue-400' : ''}
                    ${workout.type === 'skipped' ? 'text-gray-400' : ''}
                    ${workout.type === 'rescheduled' ? 'text-orange-400' : ''}
                  `}
                >
                  {workout.name}
                </div>
              ))}
              {day.workouts.length > 2 && (
                <div className="text-[8px] text-center text-slate-500">
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
              className="w-full flex items-center justify-center p-1 rounded-lg border border-dashed border-white/20 hover:border-orange-400 hover:bg-white/5 transition-all group"
            >
              <Plus className="w-3 h-3 text-slate-500 group-hover:text-orange-400" />
            </button>

            {day.isToday && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-400 rounded-full" />
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )

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
          <p className="text-sm sm:text-base text-slate-400">Gérez votre planning d'entraînement</p>
        </motion.div>

        {/* Calendar Card */}
        <motion.div variants={fadeInUp} className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4 sm:p-6">
          {/* View Mode Tabs */}
          <div className="flex items-center justify-center gap-2 mb-6">
            <Button
              size="sm"
              onClick={() => setViewMode('day')}
              className={viewMode === 'day' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
            >
              Jour
            </Button>
            <Button
              size="sm"
              onClick={() => setViewMode('week')}
              className={viewMode === 'week' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
            >
              Semaine
            </Button>
            <Button
              size="sm"
              onClick={() => setViewMode('month')}
              className={viewMode === 'month' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-white/10 border-white/20 text-white hover:bg-white/20'}
            >
              Mois
            </Button>
          </div>

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-orange-400" />
              <div>
                <h3 className="text-lg font-semibold capitalize text-white">{getHeaderTitle()}</h3>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="text-slate-300 hover:text-white hover:bg-white/10"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleToday}
                className="text-slate-300 hover:text-white hover:bg-white/10"
              >
                Aujourd'hui
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="text-slate-300 hover:text-white hover:bg-white/10"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Calendar Views */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
            </div>
          ) : (
            <>
              {viewMode === 'day' && renderDayView()}
              {viewMode === 'week' && renderWeekView()}
              {viewMode === 'month' && renderMonthView()}
            </>
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
