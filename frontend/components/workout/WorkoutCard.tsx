'use client'

import { Workouts } from '@/lib/types/workout'
import { motion } from 'framer-motion'
import { Clock, Zap } from 'lucide-react'

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


export function WorkoutCard({ workout }: WorkoutCardProps) {
  return (
    <motion.div
      className="relative h-[300px] rounded-lg overflow-hidden bg-gradient-to-br from-gray-800 to-gray-900"
      whileHover={{
        scale: 1.02,
        y: -4,
        transition: { duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Image de fond du workout */}
      {workout.image_url && (
        <motion.div
          className="absolute inset-0 bg-cover bg-top"
          style={{ backgroundImage: `url(${workout.image_url})` }}
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />

      {/* Contenu */}
      <div className="relative h-full flex flex-col justify-between p-6 text-white">
        {/* Badge difficulté en haut */}
        <motion.div
          className="flex gap-2 items-start justify-between"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <motion.div
            className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider rounded-full border backdrop-blur-sm ${difficultyColors[workout.difficulty as keyof typeof difficultyColors]}`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {difficultyLabels[workout.difficulty as keyof typeof difficultyLabels]}
          </motion.div>

          {/* Badge BENCHMARK */}
          {workout.is_benchmark && (
            <motion.div
              className="px-3 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase backdrop-blur-sm"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              BENCHMARK
            </motion.div>
          )}
        </motion.div>

        {/* Titre et infos en bas */}
        <motion.div
          className="space-y-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div>
            <motion.h3
              className="text-3xl font-bold uppercase tracking-tight mb-2"
              whileHover={{
                color: 'hsl(var(--primary))',
                transition: { duration: 0.2 }
              }}
            >
              {workout.name}
            </motion.h3>
            <p className="text-sm text-gray-300/90 line-clamp-2 mb-3">
              {workout.description}
            </p>
          </div>

          {/* Infos compactes en bas */}
          <div className="flex items-center gap-3 text-xs text-gray-300/80">
            {workout.estimated_duration && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{workout.estimated_duration}min</span>
              </div>
            )}
            {workout.intensity && (
              <div className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" />
                <span className="capitalize">{intensityLabels[workout.intensity as keyof typeof intensityLabels]}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Effet hover */}
      <motion.div
        className="absolute inset-0 bg-primary/10 pointer-events-none"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  )
}
