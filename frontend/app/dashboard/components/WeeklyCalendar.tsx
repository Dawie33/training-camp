'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Calendar, ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'

interface DayWorkout {
  id: string
  name: string
  type: 'scheduled' | 'completed' | 'rest'
  intensity?: 'low' | 'medium' | 'high'
}

interface WeekDay {
  date: Date
  dayName: string
  dayNumber: number
  isToday: boolean
  workout?: DayWorkout
}

export function WeeklyCalendar() {
  const [currentWeekOffset, setCurrentWeekOffset] = useState(0)

  // Génère les jours de la semaine
  const getWeekDays = (offset: number): WeekDay[] => {
    const today = new Date()
    const currentDay = today.getDay()
    const monday = new Date(today)
    monday.setDate(today.getDate() - currentDay + 1 + offset * 7)

    const days: WeekDay[] = []
    const dayNames = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)

      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear()

      // Données simulées - À remplacer par des vraies données
      let workout: DayWorkout | undefined
      if (i === 1) {
        workout = { id: '1', name: 'HIIT Cardio', type: 'scheduled', intensity: 'high' }
      } else if (i === 3) {
        workout = { id: '2', name: 'Force', type: 'completed', intensity: 'medium' }
      } else if (i === 6) {
        workout = { id: '3', name: 'Repos actif', type: 'rest' }
      }

      days.push({
        date,
        dayName: dayNames[i],
        dayNumber: date.getDate(),
        isToday,
        workout
      })
    }

    return days
  }

  const weekDays = getWeekDays(currentWeekOffset)
  const currentMonth = weekDays[3].date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const getIntensityColor = (intensity?: string) => {
    switch (intensity) {
      case 'low':
        return 'bg-green-500/20 text-green-700 border-green-500/30'
      case 'medium':
        return 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30'
      case 'high':
        return 'bg-red-500/20 text-red-700 border-red-500/30'
      default:
        return 'bg-muted/50 text-muted-foreground border-border'
    }
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

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <div>
            <h3 className="text-base sm:text-lg font-semibold">Planning hebdomadaire</h3>
            <p className="text-xs sm:text-sm text-muted-foreground capitalize">{currentMonth}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentWeekOffset(prev => prev - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8"
            onClick={() => setCurrentWeekOffset(0)}
          >
            Aujourd'hui
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentWeekOffset(prev => prev + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {weekDays.map((day, index) => (
          <motion.div
            key={`${day.date.toISOString()}-${index}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`
              relative rounded-lg border p-2 sm:p-3 min-h-[80px] sm:min-h-[100px]
              transition-all cursor-pointer
              ${day.isToday ? 'ring-2 ring-primary bg-primary/5' : 'bg-card'}
              ${day.workout ? getWorkoutTypeStyle(day.workout.type) : 'hover:bg-accent'}
            `}
          >
            {/* Day Header */}
            <div className="flex flex-col items-center mb-2">
              <span className="text-[10px] sm:text-xs text-muted-foreground font-medium">
                {day.dayName}
              </span>
              <span className={`
                text-sm sm:text-base font-bold mt-0.5
                ${day.isToday ? 'text-primary' : 'text-foreground'}
              `}>
                {day.dayNumber}
              </span>
            </div>

            {/* Workout Info */}
            {day.workout ? (
              <div className="space-y-1">
                <div className={`
                  text-[9px] sm:text-xs font-medium line-clamp-2 text-center
                  ${day.workout.type === 'completed' ? 'text-green-700' : ''}
                  ${day.workout.type === 'scheduled' ? 'text-blue-700' : ''}
                  ${day.workout.type === 'rest' ? 'text-purple-700' : ''}
                `}>
                  {day.workout.name}
                </div>
                {day.workout.intensity && (
                  <div className={`
                    text-[8px] sm:text-[10px] px-1 py-0.5 rounded text-center font-medium
                    ${getIntensityColor(day.workout.intensity)}
                  `}>
                    {day.workout.intensity === 'low' && 'Faible'}
                    {day.workout.intensity === 'medium' && 'Moyen'}
                    {day.workout.intensity === 'high' && 'Intense'}
                  </div>
                )}
              </div>
            ) : (
              <button className="w-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                <Plus className="w-3 h-3 sm:w-4 sm:h-4 text-muted-foreground" />
              </button>
            )}

            {/* Today Indicator */}
            {day.isToday && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-primary rounded-full" />
            )}
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t flex flex-wrap gap-3 sm:gap-4">
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
    </div>
  )
}
