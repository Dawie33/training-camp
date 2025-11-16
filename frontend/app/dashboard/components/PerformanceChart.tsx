'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'

export function PerformanceChart() {
  // Données simulées pour le graphique
  const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']
  const data = [45, 52, 38, 45, 58, 42, 55, 48, 65, 42, 58, 49]
  const maxValue = Math.max(...data)

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
        <div>
          <h3 className="text-base sm:text-lg font-semibold">Performance au fil du temps</h3>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-blue-500"></div>
              <span className="text-xs sm:text-sm text-muted-foreground">Workouts complétés</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="text-xs sm:text-sm">
            Mois
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
            <Download className="w-3 h-3 sm:w-4 sm:h-4" />
          </Button>
        </div>
      </div>

      {/* Graphique simplifié */}
      <div className="h-48 sm:h-64 flex items-end justify-between gap-1 sm:gap-2">
        {data.map((value, index) => {
          const height = (value / maxValue) * 100
          return (
            <motion.div
              key={months[index]}
              className="flex-1 flex flex-col items-center gap-1 sm:gap-2"
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="w-full flex flex-col items-center gap-1">
                <motion.div
                  className="w-full bg-gradient-to-t from-blue-500 to-blue-300 rounded-t-md relative group cursor-pointer"
                  style={{ height: `${height}%`, minHeight: '20px' }}
                  whileHover={{ opacity: 0.8 }}
                >
                  <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] sm:text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    {value}
                  </span>
                </motion.div>
              </div>
              <span className="text-[10px] sm:text-xs text-muted-foreground">{months[index]}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
