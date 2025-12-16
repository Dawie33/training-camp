'use client'

import { Workouts } from '@/domain/entities/workout'
import { motion } from 'framer-motion'
import { Award, Clock, Flame, Zap } from 'lucide-react'

interface WorkoutCardProps {
  workout: Workouts
}

const difficultyLabels = {
  beginner: 'Débutant',
  intermediate: 'Intermédiaire',
  advanced: 'Avancé',
}

const difficultyColors = {
  beginner: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  intermediate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  advanced: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
}

const intensityLabels = {
  low: 'Faible',
  moderate: 'Modérée',
  high: 'Élevée',
}

export function WorkoutCard({ workout }: WorkoutCardProps) {
  return (
    <motion.div
      className="relative h-[280px] sm:h-[320px] rounded-2xl overflow-hidden bg-gradient-to-br from-gray-900 to-black shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{
        scale: 1.02,
        transition: { duration: 0.2, ease: [0.23, 1, 0.32, 1] }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Image de fond avec overlay gradient sophistiqué */}
      {workout.image_url && (
        <div className="absolute inset-0">
          <motion.div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${workout.image_url})` }}
            whileHover={{ scale: 1.1 }}
            transition={{ duration: 0.8, ease: [0.23, 1, 0.32, 1] }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
        </div>
      )}

      {/* Contenu */}
      <div className="relative h-full flex flex-col justify-between p-5 sm:p-6 text-white">
        {/* Header avec badges */}
        <div className="flex gap-2 items-start justify-between">
          <motion.div
            className={`px-3 py-1.5 text-[10px] sm:text-xs font-bold uppercase tracking-widest rounded-full border backdrop-blur-md ${difficultyColors[workout.difficulty as keyof typeof difficultyColors]}`}
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            {difficultyLabels[workout.difficulty as keyof typeof difficultyLabels]}
          </motion.div>

          {workout.is_benchmark && (
            <motion.div
              className="px-3 py-1.5 rounded-full bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-[10px] sm:text-xs font-black uppercase backdrop-blur-md shadow-lg flex items-center gap-1.5"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Award className="w-3 h-3" />
              <span>BENCHMARK</span>
            </motion.div>
          )}
        </div>

        {/* Footer avec titre et stats */}
        <motion.div
          className="space-y-3"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {/* Titre */}
          <div>
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight mb-1.5 leading-tight">
              {workout.name}
            </h3>
            <p className="text-xs sm:text-sm text-gray-300/90 line-clamp-2 leading-relaxed">
              {workout.description}
            </p>
          </div>

          {/* Stats en pills style Freeletics */}
          <div className="flex items-center gap-2 flex-wrap">
            {workout.estimated_duration && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-semibold">{workout.estimated_duration}min</span>
              </div>
            )}
            {workout.intensity && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 backdrop-blur-md rounded-full">
                {workout.intensity === 'high' ? (
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                ) : (
                  <Zap className="w-3.5 h-3.5 text-yellow-400" />
                )}
                <span className="text-xs font-semibold capitalize">
                  {intensityLabels[workout.intensity as keyof typeof intensityLabels]}
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Effet de brillance au survol */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"
        initial={{ x: '-100%', opacity: 0 }}
        whileHover={{ x: '100%', opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeInOut' }}
      />

      {/* Border glow effect */}
      <div className="absolute inset-0 rounded-2xl ring-1 ring-white/10 pointer-events-none" />
    </motion.div>
  )
}
