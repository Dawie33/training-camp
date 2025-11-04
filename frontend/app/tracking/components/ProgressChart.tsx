'use client'

import { ProgressData } from '@/lib/types/workout-history'
import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface ProgressChartProps {
  data: ProgressData[]
}

export function ProgressChart({ data }: ProgressChartProps) {
  const maxCount = useMemo(() => {
    return Math.max(...data.map(d => d.count), 1)
  }, [data])

  const maxDuration = useMemo(() => {
    return Math.max(...data.map(d => d.duration), 1)
  }, [data])

  return (
    <div className="space-y-6">
      {/* Graphique de fréquence des workouts */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Nombre de workouts par jour</h3>
        <div className="flex items-end justify-between gap-1 h-48">
          {data.map((item, index) => {
            const heightPercent = (item.count / maxCount) * 100
            const date = new Date(item.date)
            const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' })
            const dayNumber = date.getDate()

            return (
              <motion.div
                key={item.date}
                className="flex-1 flex flex-col items-center gap-2"
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ delay: index * 0.02 }}
              >
                <div className="relative flex-1 w-full flex items-end justify-center group">
                  <motion.div
                    className="w-full bg-primary rounded-t-md cursor-pointer transition-colors hover:bg-primary/80"
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ delay: index * 0.02, duration: 0.3 }}
                    style={{ minHeight: item.count > 0 ? '4px' : '0' }}
                  >
                    {/* Tooltip */}
                    {item.count > 0 && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="bg-popover border border-border rounded-lg shadow-lg p-2 text-xs whitespace-nowrap">
                          <p className="font-medium">{item.count} workout{item.count > 1 ? 's' : ''}</p>
                          <p className="text-muted-foreground">
                            {Math.floor(item.duration / 60)}m {item.duration % 60}s
                          </p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
                <div className="text-center">
                  <p className="text-xs font-medium capitalize">{dayName}</p>
                  <p className="text-xs text-muted-foreground">{dayNumber}</p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Graphique de durée */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground">Durée totale par jour (minutes)</h3>
        <div className="flex items-end justify-between gap-1 h-32">
          {data.map((item, index) => {
            const heightPercent = (item.duration / maxDuration) * 100
            const durationMinutes = Math.floor(item.duration / 60)

            return (
              <motion.div
                key={`duration-${item.date}`}
                className="flex-1 flex flex-col items-center gap-2"
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                transition={{ delay: index * 0.02 }}
              >
                <div className="relative flex-1 w-full flex items-end justify-center group">
                  <motion.div
                    className="w-full bg-gradient-to-t from-primary to-primary/50 rounded-t-md cursor-pointer transition-opacity hover:opacity-80"
                    initial={{ height: 0 }}
                    animate={{ height: `${heightPercent}%` }}
                    transition={{ delay: index * 0.02, duration: 0.3 }}
                    style={{ minHeight: item.duration > 0 ? '4px' : '0' }}
                  >
                    {/* Tooltip */}
                    {item.duration > 0 && (
                      <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        <div className="bg-popover border border-border rounded-lg shadow-lg p-2 text-xs whitespace-nowrap">
                          <p className="font-medium">{durationMinutes} min</p>
                        </div>
                      </div>
                    )}
                  </motion.div>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary rounded" />
          <span>Workouts</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-gradient-to-t from-primary to-primary/50 rounded" />
          <span>Durée</span>
        </div>
      </div>
    </div>
  )
}
