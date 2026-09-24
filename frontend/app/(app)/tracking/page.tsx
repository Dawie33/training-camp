'use client'

import { fadeInUp, staggerContainer } from '@/lib/animations'
import { motion } from 'framer-motion'
import { Activity, Dumbbell, History, Stethoscope, Trophy } from 'lucide-react'
import { useState } from 'react'
import { useOneRepMaxHistory } from './_hooks/useOneRepMaxHistory'
import { useWorkoutStats } from './_hooks/useWorkoutStats'
import { BilansHistoryPanel } from './components/BilansHistoryPanel'
import { OneRepMaxChart } from './components/OneRepMaxChart'
import { PerformanceDiagnostic } from './components/PerformanceDiagnostic'
import { PersonalRecords } from './components/PersonalRecords'
import { ProgressionReportPanel } from './components/ProgressionReport'
import { WorkoutHistoryList } from './components/WorkoutHistoryList'

type Tab = 'diagnostic' | 'history' | 'reports'

const TABS: { id: Tab; label: string; icon: React.ReactNode; activeColor: string }[] = [
  {
    id: 'diagnostic',
    label: 'Diagnostic',
    icon: <Stethoscope className="w-4 h-4" />,
    activeColor: 'text-emerald-600 border-emerald-600 bg-emerald-600/10',
  },
  {
    id: 'history',
    label: 'Historique',
    icon: <Activity className="w-4 h-4" />,
    activeColor: 'text-orange-600 border-orange-600 bg-orange-600/10',
  },
  {
    id: 'reports',
    label: 'Bilans',
    icon: <History className="w-4 h-4" />,
    activeColor: 'text-foreground border-foreground/60 bg-foreground/5',
  },
]

function TrackingContent() {
  const [activeTab, setActiveTab] = useState<Tab>('diagnostic')

  const { workoutStats } = useWorkoutStats()
  const { liftsWithHistory, loading: ormsLoading } = useOneRepMaxHistory()

  return (
    <motion.div
      className="min-h-screen"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">

        {/* Header */}
        <motion.section variants={fadeInUp} className="space-y-2">
          <div className="eyebrow">Suivi</div>
          <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-none tracking-tight">
            Suivi des performances
          </h1>
          <p className="text-muted-foreground text-lg mt-2">Analyse tes progrès en CrossFit</p>
        </motion.section>

        {/* Onglets */}
        <motion.div variants={fadeInUp}>
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                    isActive
                      ? `${tab.activeColor} border-current`
                      : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              )
            })}
          </div>
        </motion.div>

        {/* Contenu de l'onglet */}
        <motion.div variants={fadeInUp}>

          {/* Diagnostic calculé */}
          {activeTab === 'diagnostic' && <PerformanceDiagnostic months={3} />}

          {/* Historique : bilan IA et données brutes */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              <ProgressionReportPanel sport="crossfit" />

              <div className="p-6 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-6">
                  <Dumbbell className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-display text-2xl font-semibold">Évolution des 1RMs</h2>
                </div>
                {ormsLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
                  </div>
                ) : liftsWithHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground">Enregistre tes 1RMs dans ton profil pour suivre ta progression</p>
                  </div>
                ) : (
                  <OneRepMaxChart liftsWithHistory={liftsWithHistory} />
                )}
              </div>

              <div className="p-6 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-6">
                  <Trophy className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-display text-2xl font-semibold">Records Personnels</h2>
                </div>
                {workoutStats && workoutStats.personalRecords.length > 0 ? (
                  <PersonalRecords records={workoutStats.personalRecords} />
                ) : (
                  <p className="text-muted-foreground text-sm py-4">Complète des workouts pour établir tes records</p>
                )}
              </div>

              <div className="p-6 bg-card border border-border rounded-lg">
                <h2 className="font-display text-2xl font-semibold mb-6">Historique Complet</h2>
                <WorkoutHistoryList />
              </div>
            </div>
          )}

          {/* Historique des bilans */}
          {activeTab === 'reports' && <BilansHistoryPanel />}

        </motion.div>
      </div>
    </motion.div>
  )
}

export default function TrackingPage() {
  return <TrackingContent />
}
