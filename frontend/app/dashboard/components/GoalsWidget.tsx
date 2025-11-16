'use client'

import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { motion } from 'framer-motion'
import { CheckCircle2, Circle, Plus, Target } from 'lucide-react'
import { useState } from 'react'

interface Goal {
  id: string
  title: string
  target: number
  current: number
  unit: string
  color: string
  completed: boolean
}

export function GoalsWidget() {
  // Données simulées - À remplacer par des vraies données
  const [goals] = useState<Goal[]>([
    {
      id: '1',
      title: 'Workouts ce mois',
      target: 16,
      current: 12,
      unit: 'séances',
      color: 'bg-blue-500',
      completed: false
    },
    {
      id: '2',
      title: 'Poids soulevé',
      target: 5000,
      current: 3750,
      unit: 'kg',
      color: 'bg-purple-500',
      completed: false
    },
    {
      id: '3',
      title: 'Minutes actives',
      target: 300,
      current: 300,
      unit: 'min',
      color: 'bg-green-500',
      completed: true
    }
  ])

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500'
    if (progress >= 75) return 'bg-blue-500'
    if (progress >= 50) return 'bg-yellow-500'
    return 'bg-orange-500'
  }

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 sm:mb-6">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="text-base sm:text-lg font-semibold">Objectifs du mois</h3>
        </div>
        <Button variant="ghost" size="sm" className="h-8 text-xs sm:text-sm gap-1">
          <Plus className="w-3 h-3 sm:w-4 sm:h-4" />
          <span className="hidden sm:inline">Ajouter</span>
        </Button>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.map((goal, index) => {
          const progress = Math.min((goal.current / goal.target) * 100, 100)

          return (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="space-y-2"
            >
              {/* Goal Header */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  {goal.completed ? (
                    <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm sm:text-base font-medium truncate ${
                      goal.completed ? 'text-muted-foreground line-through' : 'text-foreground'
                    }`}>
                      {goal.title}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                      {goal.current} / {goal.target} {goal.unit}
                    </p>
                  </div>
                </div>
                <span className={`text-xs sm:text-sm font-bold ${
                  goal.completed ? 'text-green-600' : 'text-foreground'
                }`}>
                  {Math.round(progress)}%
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative">
                <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                    className={`h-full rounded-full ${getProgressColor(progress)}`}
                  />
                </div>
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 pt-4 border-t">
        <div className="flex items-center justify-between text-xs sm:text-sm">
          <span className="text-muted-foreground">
            {goals.filter(g => g.completed).length} sur {goals.length} complétés
          </span>
          <Button variant="link" size="sm" className="h-auto p-0 text-xs sm:text-sm">
            Voir tout
          </Button>
        </div>
      </div>
    </div>
  )
}
