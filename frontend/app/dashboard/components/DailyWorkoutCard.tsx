'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { Calendar, Clock, Dumbbell, Flame } from 'lucide-react'
import Link from 'next/link'
import { useDailyWorkout } from '../_hooks/useDailyWorkout'

export function DailyWorkoutCard() {
  const { dailyWorkout, workoutLoading } = useDailyWorkout()

  if (workoutLoading) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-base sm:text-lg font-semibold">Workout du jour</h3>
        </div>
        <div className="animate-pulse space-y-3">
          <div className="h-6 bg-muted rounded w-3/4"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
          <div className="h-20 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  if (!dailyWorkout) {
    return (
      <div className="bg-card rounded-lg border p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-base sm:text-lg font-semibold">Workout du jour</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Aucun workout disponible pour aujourd'hui
        </p>
      </div>
    )
  }

  return (
    <motion.div
      className="bg-card rounded-lg border p-4 sm:p-6 hover:shadow-md transition-all"
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary" />
          <h3 className="text-base sm:text-lg font-semibold">Workout du jour</h3>
        </div>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
          Aujourd'hui
        </span>
      </div>

      <div className="space-y-4">
        {/* Workout Title */}
        <div>
          <h4 className="text-lg sm:text-xl font-bold text-foreground mb-2">
            {dailyWorkout.name}
          </h4>
          {dailyWorkout.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">
              {dailyWorkout.description}
            </p>
          )}
        </div>

        {/* Workout Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 rounded-lg bg-blue-500/10">
              <Clock className="w-4 h-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Durée</p>
              <p className="font-semibold text-sm">
                {dailyWorkout.estimated_duration || 'N/A'} min
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <div className="p-2 rounded-lg bg-orange-500/10">
              <Flame className="w-4 h-4 text-orange-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Intensité</p>
              <p className="font-semibold text-sm capitalize">
                {dailyWorkout.intensity || 'Modérée'}
              </p>
            </div>
          </div>
        </div>

        {/* Blocks Preview */}
        {dailyWorkout.blocks?.sections && dailyWorkout.blocks.sections.length > 0 && (
          <div className="bg-muted/50 rounded-lg p-3 space-y-1">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs font-medium text-muted-foreground">
                {dailyWorkout.blocks.sections.length} bloc{dailyWorkout.blocks.sections.length > 1 ? 's' : ''}
              </p>
            </div>
            <div className="space-y-1">
              {dailyWorkout.blocks.sections.slice(0, 2).map((section, index) => (
                <div key={index} className="text-xs text-muted-foreground">
                  • {section.title || `Bloc ${index + 1}`}
                </div>
              ))}
              {dailyWorkout.blocks.sections.length > 2 && (
                <div className="text-xs text-muted-foreground">
                  • +{dailyWorkout.blocks.sections.length - 2} autre{dailyWorkout.blocks.sections.length - 2 > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button asChild className="w-full text-xs sm:text-sm h-8 sm:h-9">
          <Link href={`/workout/${dailyWorkout.id}`}>
            Commencer le workout
          </Link>
        </Button>
      </div>
    </motion.div>
  )
}
