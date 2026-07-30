'use client'

import { useAuth } from '@/hooks/useAuth'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { DailyWorkoutCard } from './components/DailyWorkoutCard'
import { ActiveProgramCard } from './components/ActiveProgramCard'
import { SkillOfTheDayCard } from './components/SkillOfTheDayCard'
import { TrainingOverview } from './components/TrainingOverview'
import { QuickActions } from './components/QuickActions'
import { WeeklyCalendar } from './components/WeeklyCalendar'
import { CoachRecommendationWidget } from '@/components/coach/CoachRecommendationWidget'

function DashboardContent() {
  const user = useAuth()
  const dateNow = format(new Date(), 'dd-MM-yyyy')

  return (
    <motion.div
      className="min-h-screen"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >

      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-16">
        {/* Header*/}
        <header>
          <motion.div variants={fadeInUp} className="flex items-end justify-between">
            <div>
              <div className="eyebrow mb-3">
                {dateNow} · Prêt à t&apos;entraîner&nbsp;?
              </div>
              <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-none tracking-tight">
                Salut, {user?.user?.firstName || 'Champion'}
              </h1>
            </div>
          </motion.div>
        </header>
        {/* Recommandation Coach IA */}
        <motion.div variants={fadeInUp}>
          <CoachRecommendationWidget />
        </motion.div>

        {/* Actions rapides — remontées en tête pour un accès immédiat */}
        <motion.div variants={fadeInUp}>
          <QuickActions index="01" />
        </motion.div>

        {/* Workout du jour */}
        <motion.div variants={fadeInUp}>
          <DailyWorkoutCard index="02" />
        </motion.div>

        {/* Programme actif */}
        <motion.div variants={fadeInUp}>
          <ActiveProgramCard index="03" />
        </motion.div>

        {/* Skill du jour */}
        <motion.div variants={fadeInUp}>
          <SkillOfTheDayCard index="04" />
        </motion.div>

        {/* Vue d'ensemble */}
        <motion.div variants={fadeInUp}>
          <TrainingOverview />
        </motion.div>

        {/* Weekly Calendar */}
        <motion.div variants={fadeInUp}>
          <WeeklyCalendar />
        </motion.div>
      </div>
    </motion.div >
  )
}

export default function DashboardPage() {
  return <DashboardContent />
}
