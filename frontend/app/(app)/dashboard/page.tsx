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

        {/* Suivi — toutes les cartes (coach, stats, séance du jour, skill) partagent une seule grille
            auto-adaptative : chaque carte prend sa largeur naturelle et la grille se réajuste seule,
            sans jamais laisser une carte isolée sur une ligne. */}
        <motion.section
          variants={fadeInUp}
          aria-label="Suivi de performance"
          className={`grid gap-3 grid-cols-[repeat(auto-fit,minmax(480px,1fr))] transition-opacity ${refreshing ? 'opacity-60' : ''}`}
        >
          {/* Contenu plus dense (texte + CTA) : garde toute la largeur de la ligne */}
          <div className="col-span-full">
            <CoachRecommendationWidget />
          </div>

          {error && !overview ? (
            <BentoCard eyebrow="Suivi" className="col-span-full">
              <p className="text-sm text-muted-foreground">{error}</p>
            </BentoCard>
          ) : (
            <PerformanceCards overview={overview} loading={loading} />
          )}
        </motion.section>
      </div>
    </motion.div>
  )
}

export default function DashboardPage() {
  return <DashboardContent />
}
