'use client'

import { fadeInUp, staggerContainer } from '@/lib/animations'
import { motion } from 'framer-motion'
import { Activity, Bike, Dumbbell, Footprints, History, LayoutDashboard, TrendingUp, Trophy, Zap } from 'lucide-react'
import { useState } from 'react'
import { useMultiSportStats } from './_hooks/useMultiSportStats'
import { useWodRunningSegments } from './_hooks/useWodRunningSegments'
import { useOneRepMaxHistory } from './_hooks/useOneRepMaxHistory'
import { useWorkoutProgress } from './_hooks/useWorkoutProgress'
import { useWorkoutStats } from './_hooks/useWorkoutStats'
import { BikingStatsPanel } from './components/BikingStatsPanel'
import { BilansHistoryPanel } from './components/BilansHistoryPanel'
import { GlobalOverview } from './components/GlobalOverview'
import { OneRepMaxChart } from './components/OneRepMaxChart'
import { PersonalRecords } from './components/PersonalRecords'
import { ProgressChart } from './components/ProgressChart'
import { ProgressionReportPanel } from './components/ProgressionReport'
import { RunningStatsPanel } from './components/RunningStatsPanel'
import { WorkoutHistoryList } from './components/WorkoutHistoryList'
import { WorkoutProgressComparison } from './components/WorkoutProgressComparison'

type Tab = 'global' | 'crossfit' | 'running' | 'biking' | 'history'

const TABS: { id: Tab; label: string; icon: React.ReactNode; activeColor: string }[] = [
  {
    id: 'global',
    label: 'Vue globale',
    icon: <LayoutDashboard className="w-4 h-4" />,
    activeColor: 'text-primary border-primary bg-primary/10',
  },
  {
    id: 'crossfit',
    label: 'CrossFit',
    icon: <Activity className="w-4 h-4" />,
    activeColor: 'text-orange-600 border-orange-600 bg-orange-600/10',
  },
  {
    id: 'running',
    label: 'Running',
    icon: <Footprints className="w-4 h-4" />,
    activeColor: 'text-orange-600 border-orange-600 bg-orange-600/10',
  },
  {
    id: 'biking',
    label: 'Vélo',
    icon: <Bike className="w-4 h-4" />,
    activeColor: 'text-orange-600 border-orange-600 bg-orange-600/10',
  },
  {
    id: 'history',
    label: 'Bilans',
    icon: <History className="w-4 h-4" />,
    activeColor: 'text-foreground border-foreground/60 bg-foreground/5',
  },
]

function TrackingContent() {
  const [activeTab, setActiveTab] = useState<Tab>('global')

  const { workoutStats, workoutSessions } = useWorkoutStats()
  const { progressData, loading: progressLoading } = useWorkoutProgress()
  const { liftsWithHistory, loading: ormsLoading } = useOneRepMaxHistory()
  const { stats: multiStats, loading: multiLoading } = useMultiSportStats()
  const { segments: wodRunSegments, loading: wodRunLoading } = useWodRunningSegments()

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
          <p className="text-muted-foreground text-lg mt-2">Analyse tes progrès sur toutes tes disciplines</p>
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

          {/* Vue globale */}
          {activeTab === 'global' && (
            <div className="space-y-6">
              <GlobalOverview
                workoutStats={workoutStats}
                runningStats={multiStats.running}
                bikingStats={multiStats.biking}
                onTabChange={(tab) => setActiveTab(tab as Tab)}
              />
              <ProgressionReportPanel sport="global" />
            </div>
          )}

          {/* CrossFit */}
          {activeTab === 'crossfit' && (
            <div className="space-y-6">
              <ProgressionReportPanel sport="crossfit" />

              {(progressLoading || progressData.length > 0) && (
                <WorkoutProgressComparison progressData={progressData} loading={progressLoading} />
              )}

              <div className="p-6 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-6">
                  <TrendingUp className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-display text-2xl font-semibold">Activité & Progression</h2>
                </div>
                {workoutSessions.length > 0 ? (
                  <ProgressChart sessions={workoutSessions} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <p className="text-muted-foreground">Complète tes premiers workouts pour voir ta progression</p>
                  </div>
                )}
              </div>

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

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-6 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-4 h-4 text-muted-foreground" />
                    <h2 className="font-display text-xl font-semibold">Workouts par Type</h2>
                  </div>
                  {workoutStats && workoutStats.totalWorkouts > 0 ? (
                    <div className="space-y-3">
                      {Object.entries(workoutStats.workoutsByType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="font-medium text-foreground">{type.replace(/_/g, ' ')}</span>
                          <div className="flex items-center gap-3">
                            <div className="w-32 h-2 bg-border rounded-full overflow-hidden">
                              <div
                                className="h-full bg-orange-600 transition-all"
                                style={{
                                  width: `${workoutStats.totalWorkouts > 0 ? (count / workoutStats.totalWorkouts) * 100 : 0}%`,
                                }}
                              />
                            </div>
                            <span className="text-sm text-muted-foreground w-12 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm py-4">Aucun workout complété pour le moment</p>
                  )}
                </div>

                <div className="p-6 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-4 h-4 text-muted-foreground" />
                    <h2 className="font-display text-xl font-semibold">Records Personnels</h2>
                  </div>
                  {workoutStats && workoutStats.personalRecords.length > 0 ? (
                    <PersonalRecords records={workoutStats.personalRecords} />
                  ) : (
                    <p className="text-muted-foreground text-sm py-4">Complète des workouts pour établir tes records</p>
                  )}
                </div>
              </div>

              <div className="p-6 bg-card border border-border rounded-lg">
                <h2 className="font-display text-2xl font-semibold mb-6">Historique Complet</h2>
                <WorkoutHistoryList />
              </div>
            </div>
          )}

          {/* Running */}
          {activeTab === 'running' && (
            <div className="space-y-6">
              <ProgressionReportPanel sport="running" />
              <div className="p-6 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-6">
                  <Footprints className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-display text-2xl font-semibold">Statistiques Running</h2>
                </div>
                <RunningStatsPanel
                  stats={multiStats.running}
                  loading={multiLoading}
                  wodSegments={wodRunSegments}
                  wodSegmentsLoading={wodRunLoading}
                />
              </div>
            </div>
          )}

          {/* Vélo */}
          {activeTab === 'biking' && (
            <div className="space-y-6">
              <ProgressionReportPanel sport="biking" />
              <div className="p-6 bg-card border border-border rounded-lg">
                <div className="flex items-center gap-2 mb-6">
                  <Bike className="w-4 h-4 text-muted-foreground" />
                  <h2 className="font-display text-2xl font-semibold">Statistiques Vélo</h2>
                </div>
                <BikingStatsPanel stats={multiStats.biking} loading={multiLoading} />
              </div>
            </div>
          )}

          {/* Historique des bilans */}
          {activeTab === 'history' && <BilansHistoryPanel />}

        </motion.div>
      </div>
    </motion.div>
  )
}

export default function TrackingPage() {
  return <TrackingContent />
}
