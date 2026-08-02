'use client'

import { WorkoutsCatalogTable } from '@/components/workout/WorkoutsCatalogTable'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { motion } from 'framer-motion'

export default function WorkoutsPage() {
  return (
    <motion.div
      className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <motion.div variants={fadeInUp}>
        <div className="eyebrow mb-3">Catalogue · tous les workouts</div>
        <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-none tracking-tight">Workouts</h1>
      </motion.div>

      <WorkoutsCatalogTable />
    </motion.div>
  )
}
