'use client'

import { ProtectedRoute } from '@/components/auth/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { useWorkoutSession } from '@/app/tracking/hooks/useWorkoutSession'
import { workoutsService } from '@/lib/api/workouts'
import { Workouts } from '@/lib/types/workout'
import { motion } from 'framer-motion'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { fadeInUp, staggerContainer } from '@/lib/animations'

type ViewMode = 'day' | 'week' | 'month'

interface DayWorkout {
  id: string
  name: string
  type: 'scheduled' | 'completed' | 'rest'
  intensity?: 'low' | 'medium' | 'high'
  duration?: number
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
  const [viewMode, setViewMode] = useState<ViewMode>('day')
  const [currentDate, setCurrentDate] = useState(new Date())
  const { workoutSessions } = useWorkoutSession()
  const [workoutsDetails, setWorkoutsDetails] = useState<Map<string, Workouts>>(new Map())

  // Récupérer les détails des workouts
  useEffect(() => {
    const fetchWorkoutDetails = async () => {
      if (!workoutSessions || workoutSessions.length === 0) return

      const uniqueWorkoutIds = [...new Set(workoutSessions.map(s => s.workout_id))]
      const details = new Map<string, Workouts>()

      await Promise.all(
        uniqueWorkoutIds.map(async (workoutId) => {
          try {
            const workout = await workoutsService.getById(workoutId)
            details.set(workoutId, workout)
          } catch (error) {
            console.error(`Failed to fetch workout ${workoutId}:`, error)
          }
        })
      )

      setWorkoutsDetails(details)
    }

    fetchWorkoutDetails()
  }, [workoutSessions])

  // Helper pour récupérer les workouts d'un jour
  const getWorkoutsForDate = (date: Date): DayWorkout[] => {
    const dateStr = date.toISOString().split('T')[0]
    const dayWorkouts: DayWorkout[] = []

    if (workoutSessions && workoutSessions.length > 0) {
      workoutSessions.forEach(session => {
        const sessionDate = new Date(session.started_at).toISOString().split('T')[0]

        if (sessionDate === dateStr) {
          const isCompleted = !!session.completed_at
          const duration = isCompleted && session.completed_at
            ? Math.floor((new Date(session.completed_at).getTime() - new Date(session.started_at).getTime()) / 1000)
            : undefined

          const workoutDetail = workoutsDetails.get(session.workout_id)
          const workoutName = workoutDetail?.name || `Workout ${session.workout_id.substring(0, 8)}`

          let intensity: 'low' | 'medium' | 'high' | undefined
          if (workoutDetail?.intensity) {
            const intensityMap: { [key: string]: 'low' | 'medium' | 'high' } = {
              'low': 'low',
              'medium': 'medium',
              'high': 'high',
              'faible': 'low',
              'moyen': 'medium',
              'intense': 'high'
            }
            intensity = intensityMap[workoutDetail.intensity.toLowerCase()]
          }

          dayWorkouts.push({
            id: session.id,
            name: workoutName,
            type: isCompleted ? 'completed' : 'scheduled',
            duration,
            intensity
          })
        }
      })
    }

    return dayWorkouts
  }

  // Génère les jours pour la vue jour
  const dayView = useMemo(() => {
    const today = new Date()
    const isToday =
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()

    const dayName = currentDate.toLocaleDateString('fr-FR', { weekday: 'long' })

    return {
      date: currentDate,
      dayName: dayName.charAt(0).toUpperCase() + dayName.slice(1),
      dayNumber: currentDate.getDate(),
      isToday,
      workouts: getWorkoutsForDate(currentDate)
    }
  }, [currentDate, workoutSessions, workoutsDetails])

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
        workouts: getWorkoutsForDate(date)
      })
    }

    return days
  }, [currentDate, workoutSessions, workoutsDetails])

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
        workouts: getWorkoutsForDate(date)
      })
    }

    return days
  }, [currentDate, workoutSessions, workoutsDetails])

  const getHeaderTitle = () => {
    switch (viewMode) {
      case 'day':
        return currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
      case 'week':
        if (weekView.length === 0) return ''
        const monday = weekView[0].date
        const sunday = weekView[6].date
        return `${monday.getDate()} - ${sunday.getDate()} ${monday.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
      case 'month':
        return currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    }
  }

  const handlePrevious = () => {
    const newDate = new Date(currentDate)
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() - 1)
        break
      case 'week':
        newDate.setDate(newDate.getDate() - 7)
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() - 1)
        break
    }
    setCurrentDate(newDate)
  }

  const handleNext = () => {
    const newDate = new Date(currentDate)
    switch (viewMode) {
      case 'day':
        newDate.setDate(newDate.getDate() + 1)
        break
      case 'week':
        newDate.setDate(newDate.getDate() + 7)
        break
      case 'month':
        newDate.setMonth(newDate.getMonth() + 1)
        break
    }
    setCurrentDate(newDate)
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
      case 'rest':
        return 'bg-purple-500/10 border-purple-500/50'
      default:
        return 'bg-muted border-border'
    }
  }

  const handleAddWorkout = (date: Date) => {
    console.log('Ajouter un workout pour le', date.toLocaleDateString('fr-FR'))
  }

  const handleWorkoutClick = (workout: DayWorkout, date: Date) => {
    console.log('Éditer le workout', workout.name, 'du', date.toLocaleDateString('fr-FR'))
  }

  const renderDayView = () => (
    <div className="max-w-2xl mx-auto">
      <div className="bg-card rounded-lg border p-6">
        <div className="text-center mb-6 pb-4 border-b">
          <h2 className="text-3xl font-bold capitalize">{dayView.dayName}</h2>
          <p className="text-4xl font-bold text-primary mt-2">{dayView.dayNumber}</p>
          <p className="text-sm text-muted-foreground mt-1">
            {currentDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="space-y-3">
          {dayView.workouts.map((workout) => (
            <motion.button
              key={workout.id}
              onClick={() => handleWorkoutClick(workout, dayView.date)}
              className={`
                w-full p-4 rounded-lg border text-left
                transition-all hover:scale-[1.02]
                ${getWorkoutTypeStyle(workout.type)}
              `}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className={`
                text-base font-semibold mb-2
                ${workout.type === 'completed' ? 'text-green-700 dark:text-green-400' : ''}
                ${workout.type === 'scheduled' ? 'text-blue-700 dark:text-blue-400' : ''}
                ${workout.type === 'rest' ? 'text-purple-700 dark:text-purple-400' : ''}
              `}>
                {workout.name}
              </div>
              <div className="flex items-center gap-3">
                {workout.duration && (
                  <div className="text-sm text-muted-foreground">
                    {Math.floor(workout.duration / 60)} minutes
                  </div>
                )}
                {workout.intensity && (
                  <div className={`
                    text-xs px-2 py-1 rounded font-medium
                    ${workout.intensity === 'low' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                    ${workout.intensity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                    ${workout.intensity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                  `}>
                    {workout.intensity === 'low' && 'Faible'}
                    {workout.intensity === 'medium' && 'Moyen'}
                    {workout.intensity === 'high' && 'Intense'}
                  </div>
                )}
              </div>
            </motion.button>
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
              <motion.button
                key={workout.id}
                onClick={() => handleWorkoutClick(workout, day.date)}
                className={`
                  w-full p-2 rounded border text-left
                  transition-all
                  ${getWorkoutTypeStyle(workout.type)}
                `}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className={`
                  text-xs font-medium line-clamp-2
                  ${workout.type === 'completed' ? 'text-green-700 dark:text-green-400' : ''}
                  ${workout.type === 'scheduled' ? 'text-blue-700 dark:text-blue-400' : ''}
                  ${workout.type === 'rest' ? 'text-purple-700 dark:text-purple-400' : ''}
                `}>
                  {workout.name}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  {workout.duration && (
                    <div className="text-[10px] text-muted-foreground">
                      {Math.floor(workout.duration / 60)}min
                    </div>
                  )}
                  {workout.intensity && (
                    <div className={`
                      text-[8px] px-1 py-0.5 rounded font-medium
                      ${workout.intensity === 'low' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : ''}
                      ${workout.intensity === 'medium' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}
                      ${workout.intensity === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : ''}
                    `}>
                      {workout.intensity === 'low' && '●'}
                      {workout.intensity === 'medium' && '●●'}
                      {workout.intensity === 'high' && '●●●'}
                    </div>
                  )}
                </div>
              </motion.button>
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
                <button
                  key={workout.id}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleWorkoutClick(workout, day.date)
                  }}
                  className={`
                    w-full text-[9px] px-1 py-0.5 rounded truncate text-left
                    transition-all hover:scale-[1.02]
                    ${getWorkoutTypeStyle(workout.type)}
                    ${workout.type === 'completed' ? 'text-green-700 dark:text-green-400' : ''}
                    ${workout.type === 'scheduled' ? 'text-blue-700 dark:text-blue-400' : ''}
                    ${workout.type === 'rest' ? 'text-purple-700 dark:text-purple-400' : ''}
                  `}
                >
                  {workout.name}
                </button>
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
          {viewMode === 'day' && renderDayView()}
          {viewMode === 'week' && renderWeekView()}
          {viewMode === 'month' && renderMonthView()}

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
              <div className="w-3 h-3 rounded bg-purple-500/10 border border-purple-500/50" />
              <span className="text-muted-foreground">Repos</span>
            </div>
          </div>
        </motion.div>
      </div>
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
