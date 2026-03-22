'use client'

import { fadeInUp, staggerContainer } from '@/lib/animations'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { PersonalRecords } from './components/PersonalRecords'
import { ProgressChart } from './components/ProgressChart'
import { StatsCard } from './components/StatsCard'
import { WorkoutHistoryList } from './components/WorkoutHistoryList'
import { WorkoutProgressComparison } from './components/WorkoutProgressComparison'
import { OneRepMaxChart } from './components/OneRepMaxChart'
import { useWorkoutProgress } from './_hooks/useWorkoutProgress'
import { useWorkoutStats } from './_hooks/useWorkoutStats'
import { useOneRepMaxHistory } from './_hooks/useOneRepMaxHistory'

function TrackingContent() {
  const { workoutStats, formatDuration, workoutSessions } = useWorkoutStats()
  const { progressData, loading: progressLoading } = useWorkoutProgress()
  const { liftsWithHistory, loading: ormsLoading } = useOneRepMaxHistory()

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <motion.section variants={fadeInUp} className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">Suivi des performances</span>
            </h1>
            <p className="text-slate-400 text-lg">
              Analyse tes progrès et ton historique d'entraînement
            </p>
          </div>
          <Link
            href="/log-workout"
            className="flex-shrink-0 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white rounded-xl font-semibold text-sm shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 transition-all"
          >
            + Enregistrer un WOD
          </Link>
        </motion.section>

        {/* Stats Cards */}
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
        >
          <StatsCard
            title="Total Workouts"
            value={workoutStats?.totalWorkouts ?? 0}
            emoji="💪"
            color="blue"
          />
          <StatsCard
            title="Temps Total"
            value={workoutStats ? formatDuration(workoutStats.totalDuration) : '0m'}
            emoji="⏱"
            color="green"
          />
          <StatsCard
            title="Série Actuelle"
            value={workoutStats ? `${workoutStats.currentStreak} jours` : '0 jours'}
            emoji="🔥"
            color="orange"
            subtitle={workoutStats ? `Record: ${workoutStats.longestStreak} jours` : undefined}
          />
          <StatsCard
            title="Cette Semaine"
            value={workoutStats ? formatDuration(workoutStats.totalDurationThisWeek) : '0m'}
            emoji="📅"
            color="purple"
          />
        </motion.div>

        {/* Comparaison WOD — visible uniquement si des données existent */}
        {(progressLoading || progressData.length > 0) && (
          <motion.div variants={fadeInUp}>
            <WorkoutProgressComparison progressData={progressData} loading={progressLoading} />
          </motion.div>
        )}

        {/* Graphique de progression */}
        <motion.div variants={fadeInUp}>
          <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="text-lg">📈</span>
              <h2 className="text-2xl font-bold text-white">Activité & Progression</h2>
            </div>
            {workoutSessions.length > 0 ? (
              <ProgressChart sessions={workoutSessions} />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-4">
                  <span className="text-xl">📊</span>
                </div>
                <p className="text-slate-400">
                  Complète tes premiers workouts pour voir ta progression
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Évolution des 1RMs */}
        {(ormsLoading || liftsWithHistory.length > 0) && (
          <motion.div variants={fadeInUp}>
            <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-lg">🏋️</span>
                <h2 className="text-2xl font-bold text-white">Évolution des 1RMs</h2>
              </div>
              {ormsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400" />
                </div>
              ) : (
                <OneRepMaxChart liftsWithHistory={liftsWithHistory} />
              )}
            </div>
          </motion.div>
        )}

        {/* Statistiques détaillées */}
        <motion.div
          variants={fadeInUp}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
        >
          {/* Workouts par type */}
          <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">⚡</span>
              <h2 className="text-xl font-bold text-white">Workouts par Type</h2>
            </div>
            {workoutStats && workoutStats.totalWorkouts > 0 ? (
              <div className="space-y-3">
                {Object.entries(workoutStats.workoutsByType).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="font-medium text-slate-200">{type.replace(/_/g, ' ')}</span>
                    <div className="flex items-center gap-3">
                      <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 to-rose-400 transition-all"
                          style={{
                            width: `${workoutStats.totalWorkouts > 0 ? (count / workoutStats.totalWorkouts) * 100 : 0}%`
                          }}
                        />
                      </div>
                      <span className="text-sm text-slate-400 w-12 text-right">
                        {count}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-4">
                  <span className="text-xl">⚡</span>
                </div>
                <p className="text-slate-400">
                  Aucun workout complété pour le moment
                </p>
              </div>
            )}
          </div>

          {/* Records personnels */}
          <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">🏆</span>
              <h2 className="text-xl font-bold text-white">Records Personnels</h2>
            </div>
            {workoutStats && workoutStats.personalRecords.length > 0 ? (
              <PersonalRecords records={workoutStats.personalRecords} />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center mb-4">
                  <span className="text-xl">🏆</span>
                </div>
                <p className="text-slate-400">
                  Complète des workouts pour établir tes records
                </p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Historique complet */}
        <motion.div variants={fadeInUp}>
          <div className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl">
            <h2 className="text-2xl font-bold mb-6 text-white">Historique Complet</h2>
            <WorkoutHistoryList />
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}

export default function TrackingPage() {
  return     <TrackingContent />
}
