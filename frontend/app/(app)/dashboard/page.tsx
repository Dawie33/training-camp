'use client'

import { CoachRecommendationWidget } from '@/components/coach/CoachRecommendationWidget'
import { useAuth } from '@/hooks/useAuth'
import { usePerformanceOverview } from '@/hooks/usePerformanceOverview'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { format } from 'date-fns'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { BentoCard } from './components/bento/BentoCard'
import { PerformanceCards } from './components/bento/PerformanceCards'
import { PeriodFilter } from './components/bento/PeriodFilter'
import { QuickActions } from './components/QuickActions'
import { SkillOfTheDayCard } from './components/SkillOfTheDayCard'
import { WeeklyCalendar } from './components/WeeklyCalendar'

function DashboardContent() {
  const user = useAuth()
  const dateNow = format(new Date(), 'dd-MM-yyyy')
  const [months, setMonths] = useState(3)
  const { overview, loading, refreshing, error } = usePerformanceOverview(months)

  return (
    <motion.div className="min-h-screen" initial="hidden" animate="visible" variants={staggerContainer}>
      <div className="max-w-[1800px] mx-auto p-4 sm:p-6 lg:p-8 space-y-5">
        <motion.header variants={fadeInUp}>
          <div className="eyebrow mb-3">{dateNow} · Où tu en es aujourd&apos;hui</div>
          <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-none tracking-tight">
            Salut, {user?.user?.firstName || 'Champion'}
          </h1>
        </motion.header>

        <motion.div variants={fadeInUp}>
          <QuickActions />
        </motion.div>

        {/* Un seul filtre, au-dessus de tout ce qu'il cadre */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between gap-4 flex-wrap">
          <PeriodFilter months={months} onChange={setMonths} refreshing={refreshing} />
          {overview && (
            <span className="text-xs text-muted-foreground">
              Calculé le {new Date(overview.computed_at).toLocaleDateString('fr-FR')}
            </span>
          )}
        </motion.div>

        {/* Suivi — l'état de l'athlète occupe le haut et les grandes surfaces */}
        <motion.section
          variants={fadeInUp}
          aria-label="Suivi de performance"
          className={`grid grid-cols-1 md:grid-cols-4 2xl:grid-cols-6 gap-3 transition-opacity ${refreshing ? 'opacity-60' : ''}`}
        >
          {error && !overview ? (
            <BentoCard eyebrow="Suivi" className="md:col-span-4 2xl:col-span-6">
              <p className="text-sm text-muted-foreground">{error}</p>
            </BentoCard>
          ) : (
            <PerformanceCards overview={overview} loading={loading} />
          )}
        </motion.section>

        {/* Semaine en cours */}
        <motion.section variants={fadeInUp} aria-label="Ta semaine">
          <WeeklyCalendar />
        </motion.section>

        {/* Compétence du jour — la carte porte déjà son en-tête, la BentoCard ne fournit que la surface */}
        <motion.section variants={fadeInUp} aria-label="Compétence du jour">
          <BentoCard>
            <SkillOfTheDayCard />
          </BentoCard>
        </motion.section>

        {/* Recommandation coach */}
        <motion.section variants={fadeInUp} aria-label="Recommandation du coach">
          <CoachRecommendationWidget />
        </motion.section>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  return <DashboardContent />
}
