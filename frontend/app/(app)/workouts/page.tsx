'use client'

import { WorkoutsCatalogTable } from '@/components/workout/WorkoutsCatalogTable'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { motion } from 'framer-motion'

export default function WorkoutsPage() {
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        <motion.div variants={fadeInUp}>
          <h1 className="text-3xl sm:text-4xl font-bold">
            <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">Workouts</span>
          </h1>
        </motion.div>

        <WorkoutsCatalogTable />
      </div>
    </motion.div>
  )
}
