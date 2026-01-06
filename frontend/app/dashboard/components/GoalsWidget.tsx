'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'
import type { Goal } from './types'


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

  const getProgressColor = (goal: Goal, progress: number) => {
    if (progress >= 100) return 'bg-gradient-to-r from-emerald-500 to-emerald-400'
    if (goal.title.includes('Workouts')) return 'bg-gradient-to-r from-orange-500 to-rose-500'
    if (goal.title.includes('Poids')) return 'bg-gradient-to-r from-blue-500 to-cyan-500'
    return 'bg-gradient-to-r from-orange-500 to-rose-500'
  }

  return (
    <div className="h-full rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 p-6 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Objectifs du mois</h3>
        <button className="text-sm text-orange-400 hover:text-orange-300 transition-colors">
          + Ajouter
        </button>
      </div>

      {/* Goals List */}
      <div className="space-y-6 flex-1">
        {goals.map((goal, index) => {
          const progress = Math.min((goal.current / goal.target) * 100, 100)

          return (
            <div key={goal.id}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-300">{goal.title}</span>
                <span className={`text-sm font-bold ${goal.completed ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {Math.round(progress)}%
                </span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, delay: index * 0.1 + 0.2 }}
                  className={`h-full rounded-full transition-all duration-500 ${getProgressColor(goal, progress)}`}
                />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                {goal.current.toLocaleString()} / {goal.target.toLocaleString()} {goal.unit}
              </p>
            </div>
          )
        })}
      </div>

      {/* Summary */}
      <p className="text-xs text-slate-500 mt-6 pt-4 border-t border-white/10">
        {goals.filter(g => g.completed).length} sur {goals.length} complétés • <button className="text-orange-400 hover:text-orange-300">Voir tout</button>
      </p>
    </div>
  )
}
