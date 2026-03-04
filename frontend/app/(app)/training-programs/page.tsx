'use client'

import type { ProgramSession } from '@/domain/entities/training-program'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, CalendarDays, Plus } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'
import { ProgramOverview } from './_components/ProgramOverview'
import { ScheduleWeekModal } from './_components/ScheduleWeekModal'
import { SessionCard } from './_components/SessionCard'
import { SwapSessionModal } from './_components/SwapSessionModal'
import { useActiveProgram } from './_hooks/useActiveProgram'

function TrainingProgramsContent() {
  const {
    enrollment,
    loading,
    weekSessions,
    weekPhase,
    weekLoading,
    viewedWeek,
    setViewedWeek,
    startProgram,
    pauseProgram,
    abandonProgram,
    advanceToNextWeek,
    scheduleCurrentWeek,
    swapSession,
  } = useActiveProgram()

  const [swapModalOpen, setSwapModalOpen] = useState(false)
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false)
  const [selectedSession, setSelectedSession] = useState<ProgramSession | null>(null)

  const handleSwapSession = (sessionInWeek: number) => {
    const session = weekSessions.find((s) => s.session_in_week === sessionInWeek) || null
    setSelectedSession(session)
    setSwapModalOpen(true)
  }

  const handleSwapExercise = (sessionInWeek: number, _movementName: string) => {
    const session = weekSessions.find((s) => s.session_in_week === sessionInWeek) || null
    setSelectedSession(session)
    setSwapModalOpen(true)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400" />
      </div>
    )
  }

  // Pas de programme actif
  if (!enrollment || ['abandoned', 'completed'].includes(enrollment.status)) {
    return (
      <motion.div
        className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
        initial="hidden"
        animate="visible"
        variants={staggerContainer}
      >
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
          <motion.div variants={fadeInUp}>
            <h1 className="text-2xl sm:text-4xl font-bold">
              <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">
                Programme
              </span>
            </h1>
            <p className="text-sm sm:text-base text-slate-400 mt-1">Votre plan d&apos;entraînement structuré</p>
          </motion.div>

          <motion.div
            variants={fadeInUp}
            className="max-w-md mx-auto bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-8 text-center space-y-5"
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-orange-500/10 flex items-center justify-center">
              <CalendarDays className="w-8 h-8 text-orange-400" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white mb-2">Aucun programme actif</h2>
              <p className="text-sm text-slate-400">
                Laissez l&apos;IA générer un programme personnalisé adapté à votre niveau et vos objectifs.
              </p>
            </div>
            <Link
              href="/training-programs/new"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium hover:from-orange-600 hover:to-rose-600 transition-all"
            >
              <Plus className="w-5 h-5" />
              Créer mon programme
            </Link>
          </motion.div>
        </div>
      </motion.div>
    )
  }

  const canNavigatePrev = viewedWeek > 1
  const canNavigateNext = viewedWeek < enrollment.duration_weeks

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold">
              <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">
                Programme
              </span>
            </h1>
          </div>
          <Link
            href="/training-programs/new"
            className="text-xs text-slate-400 hover:text-white transition-colors"
          >
            + Nouveau
          </Link>
        </motion.div>

        {/* Program Overview */}
        <motion.div variants={fadeInUp}>
          <ProgramOverview
            enrollment={enrollment}
            onStart={startProgram}
            onPause={pauseProgram}
            onAbandon={abandonProgram}
            onAdvanceWeek={advanceToNextWeek}
          />
        </motion.div>

        {/* Week Navigator */}
        <motion.div variants={fadeInUp} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold text-white">
                  Semaine {viewedWeek}
                </h3>
                {viewedWeek === enrollment.current_week && (
                  <span className="text-xs text-orange-400 bg-orange-400/10 px-2 py-0.5 rounded-full border border-orange-400/20">
                    Semaine en cours
                  </span>
                )}
              </div>
              {weekPhase && (
                <p className="text-sm text-slate-400">{weekPhase.name} — {weekPhase.description}</p>
              )}
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewedWeek(viewedWeek - 1)}
                disabled={!canNavigatePrev}
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-slate-400 px-2">
                {viewedWeek} / {enrollment.duration_weeks}
              </span>
              <button
                onClick={() => setViewedWeek(viewedWeek + 1)}
                disabled={!canNavigateNext}
                className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Planifier la semaine */}
          <button
            onClick={() => setScheduleModalOpen(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-orange-500/30 text-orange-400 hover:bg-orange-500/10 transition-all text-sm"
          >
            <CalendarDays className="w-4 h-4" />
            Planifier cette semaine dans le calendrier
          </button>

          {/* Sessions */}
          {weekLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-400" />
            </div>
          ) : (
            <div className="space-y-4">
              {weekSessions.map((session) => (
                <SessionCard
                  key={session.session_in_week}
                  session={session}
                  weekNum={viewedWeek}
                  onSwapSession={handleSwapSession}
                  onSwapExercise={handleSwapExercise}
                />
              ))}
              {weekSessions.length === 0 && (
                <p className="text-center text-slate-500 py-8">Aucune session pour cette semaine</p>
              )}
            </div>
          )}
        </motion.div>
      </div>

      <SwapSessionModal
        open={swapModalOpen}
        onOpenChange={setSwapModalOpen}
        session={selectedSession}
        weekNum={viewedWeek}
        onSwap={swapSession}
      />

      <ScheduleWeekModal
        open={scheduleModalOpen}
        onOpenChange={setScheduleModalOpen}
        weekNum={viewedWeek}
        sessionsCount={weekSessions.length}
        onSchedule={scheduleCurrentWeek}
      />
    </motion.div>
  )
}

export default function TrainingProgramsPage() {
  return <TrainingProgramsContent />
}
