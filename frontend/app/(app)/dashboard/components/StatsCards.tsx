'use client'

import { StatsCard } from '@/app/(app)/tracking/components/StatsCard'
import { useWorkoutStats } from '@/app/(app)/tracking/_hooks/useWorkoutStats'
import { fadeInUp } from '@/lib/animations'
import { motion } from 'framer-motion'
import { Calendar, Clock, Dumbbell, Flame } from 'lucide-react'

export function StatsCards() {
  const { workoutStats, formatDuration } = useWorkoutStats()

  return (
    <motion.div
      variants={fadeInUp}
      className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4"
    >
      <StatsCard
        title="Total Workouts"
        value={workoutStats?.totalWorkouts ?? 0}
        icon={Dumbbell}
        color="blue"
      />
      <StatsCard
        title="Temps Total"
        value={workoutStats ? formatDuration(workoutStats.totalDuration) : '0m'}
        icon={Clock}
        color="green"
      />
      <StatsCard
        title="Série actuelle"
        value={workoutStats ? `${workoutStats.currentStreak} jours` : '0 jours'}
        icon={Flame}
        color="orange"
      />
      <StatsCard
        title="Cette Semaine"
        value={workoutStats ? formatDuration(workoutStats.totalDurationThisWeek) : '0m'}
        icon={Calendar}
        color="purple"
      />
    </motion.div>
  )
}
