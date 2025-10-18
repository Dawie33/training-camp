'use client'

import { Workouts } from '@/lib/types/workout'
import { Clock, Dumbbell, Zap } from 'lucide-react'

interface WorkoutCardProps {
  workout: Workouts
}

const difficultyLabels = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
}

const difficultyColors = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const intensityLabels = {
  low: 'Faible',
  moderate: 'Modérée',
  high: 'Élevée',
}

const intensityColors = {
  low: 'text-blue-400',
  moderate: 'text-orange-400',
  high: 'text-red-400',
}


export function WorkoutCard({ workout }: WorkoutCardProps) {
  return (
    <div className="relative h-[400px] rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900 transition-transform duration-300 group-hover:scale-[1.02]">
      {/* Image de fond - placeholder pour l'instant */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Contenu */}
      <div className="relative h-full flex flex-col justify-between p-6 text-white">
        {/* Badges en haut */}
        <div className="flex gap-2 flex-wrap">
          <div className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded border backdrop-blur-sm ${difficultyColors[workout.difficulty as keyof typeof difficultyColors]}`}>
            <div className="flex items-center gap-1.5">
              <Dumbbell className="w-3 h-3" />
              {difficultyLabels[workout.difficulty as keyof typeof difficultyLabels]}
            </div>
          </div>
          <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded border border-white/20 bg-white/10 backdrop-blur-sm">
            <div className={`flex items-center gap-1.5 ${intensityColors[workout.intensity as keyof typeof intensityColors]}`}>
              <Zap className="w-3 h-3" />
              {intensityLabels[workout.intensity as keyof typeof intensityLabels]}
            </div>
          </div>
          <div className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded border border-white/20 bg-white/10 backdrop-blur-sm">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3 h-3" />
              {workout.estimated_duration ? `${workout.estimated_duration}min` : 'N/A'}
            </div>
          </div>
        </div>

        {/* Titre et description en bas */}
        <div className="space-y-3">
          <div>
            <h3 className="text-3xl font-bold uppercase tracking-tight mb-2 group-hover:text-primary transition-colors">
              {workout.name}
            </h3>
            <p className="text-sm text-gray-300 line-clamp-2">
              {workout.description}
            </p>
          </div>

          {/* Badge Premium / Featured */}
          {workout.workout_type && (
            <div className="inline-block px-3 py-1 text-xs font-semibold uppercase tracking-wider bg-white/10 backdrop-blur-sm text-white rounded border border-white/20">
              {workout.workout_type}
            </div>
          )}
        </div>
      </div>

      {/* Effet hover */}
      <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/10 transition-colors pointer-events-none" />
    </div>
  )
}
