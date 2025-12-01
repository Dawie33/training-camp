'use client'

import { useWorkoutStats } from '@/app/tracking/hooks/useWorkoutStats'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import { useMemo, useState } from 'react'
import { MetricType, PeriodType } from './types'



export function PerformanceChart() {
  const { workoutStats, formatDuration } = useWorkoutStats()
  const [period, setPeriod] = useState<PeriodType>('month')
  const [metric, setMetric] = useState<MetricType>('count')

  // Calculer les données selon la période sélectionnée
  const { labels, data, durations } = useMemo(() => {
    if (!workoutStats?.workoutsByDay) {
      return { labels: [], data: [], durations: [] }
    }

    const now = new Date()

    if (period === 'week') {
      // 7 derniers jours
      const weekData = workoutStats.workoutsByDay.slice(-7)
      return {
        labels: weekData.map(d => {
          const date = new Date(d.date)
          return date.toLocaleDateString('fr-FR', { weekday: 'short' })
        }),
        data: weekData.map(d => d.count),
        durations: weekData.map(d => d.duration)
      }
    } else if (period === 'month') {
      // 30 derniers jours groupés par semaine (environ 4-5 semaines)
      const weeklyData: { label: string; count: number; duration: number }[] = []
      const monthData = workoutStats.workoutsByDay.slice(-30)

      for (let i = 0; i < monthData.length; i += 7) {
        const weekSlice = monthData.slice(i, i + 7)
        const totalCount = weekSlice.reduce((sum, d) => sum + d.count, 0)
        const totalDuration = weekSlice.reduce((sum, d) => sum + d.duration, 0)
        const startDate = new Date(weekSlice[0].date)
        const endDate = new Date(weekSlice[weekSlice.length - 1].date)

        weeklyData.push({
          label: `${startDate.getDate()}-${endDate.getDate()}`,
          count: totalCount,
          duration: totalDuration
        })
      }

      return {
        labels: weeklyData.map(w => w.label),
        data: weeklyData.map(w => w.count),
        durations: weeklyData.map(w => w.duration)
      }
    } else {
      // Derniers 12 mois (simulé pour l'instant avec les 30 derniers jours)
      // TODO: Améliorer pour gérer de vraies données mensuelles
      const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
      const currentMonth = now.getMonth()
      const last12Months = []

      for (let i = 11; i >= 0; i--) {
        const monthIndex = (currentMonth - i + 12) % 12
        last12Months.push(months[monthIndex])
      }

      // Pour l'instant, on simule avec des 0 et le mois actuel avec les vraies données
      const yearData = new Array(12).fill(0)
      const yearDurations = new Array(12).fill(0)
      yearData[11] = workoutStats.totalWorkouts
      yearDurations[11] = workoutStats.totalDuration

      return {
        labels: last12Months,
        data: yearData,
        durations: yearDurations
      }
    }
  }, [workoutStats, period])

  const displayData = metric === 'count' ? data : durations
  const maxValue = Math.max(...displayData, 1)

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold">Performance au fil du temps</h3>
          <div className="flex items-center gap-4 mt-2">
            <Button
              variant={metric === 'count' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setMetric('count')}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                <span>Workouts</span>
              </div>
            </Button>
            <Button
              variant={metric === 'duration' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => setMetric('duration')}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>Durée</span>
              </div>
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={period === 'week' ? 'default' : 'outline'}
            size="sm"
            className="text-xs sm:text-sm"
            onClick={() => setPeriod('week')}
          >
            Semaine
          </Button>
          <Button
            variant={period === 'month' ? 'default' : 'outline'}
            size="sm"
            className="text-xs sm:text-sm"
            onClick={() => setPeriod('month')}
          >
            Mois
          </Button>
          <Button
            variant={period === 'year' ? 'default' : 'outline'}
            size="sm"
            className="text-xs sm:text-sm"
            onClick={() => setPeriod('year')}
          >
            Année
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>

      {/* Graphique simplifié */}
      <div className="h-48 sm:h-64 flex items-end justify-between gap-1 sm:gap-2">
        {displayData.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p className="text-sm">Aucune donnée disponible</p>
          </div>
        ) : (
          displayData.map((value, index) => {
            const height = (value / maxValue) * 100
            const countValue = data[index]
            const durationValue = durations[index]
            const barColor = metric === 'count' ? 'from-blue-500 to-blue-300' : 'from-green-500 to-green-300'

            return (
              <motion.div
                key={`${labels[index]}-${index}`}
                className="flex-1 flex flex-col items-center gap-1 sm:gap-2"
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="w-full flex flex-col items-center gap-1">
                  <motion.div
                    className={`w-full bg-gradient-to-t ${barColor} rounded-t-md relative group cursor-pointer`}
                    style={{ height: `${height}%`, minHeight: value > 0 ? '20px' : '0px' }}
                    whileHover={{ opacity: 0.8 }}
                  >
                    {value > 0 && (
                      <div className="absolute -top-14 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="bg-popover border border-border rounded-lg shadow-lg p-2 text-xs whitespace-nowrap">
                          <p className="font-medium">{countValue} workout{countValue > 1 ? 's' : ''}</p>
                          <p className="text-muted-foreground">
                            {formatDuration(durationValue)}
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
                <span className="text-[10px] sm:text-xs text-muted-foreground truncate max-w-full">
                  {labels[index]}
                </span>
              </motion.div>
            )
          })
        )}
      </div>
    </div>
  )
}
