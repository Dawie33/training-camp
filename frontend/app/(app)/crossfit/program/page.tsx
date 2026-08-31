'use client'

import { fadeInUp, staggerContainer } from '@/lib/animations'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { EmptyState } from './_components/EmptyState'
import { ProgramHeader } from './_components/ProgramHeader'
import { ScheduleWeekPanel } from './_components/ScheduleWeekPanel'
import { WeekNavigator } from './_components/WeekNavigator'
import { WeekSessionCard } from './_components/WeekSessionCard'
import { useTrainingProgram } from './_hooks/useTrainingProgram'

function TrainingProgramsContent() {
  const {
    enrollment,
    weekData,
    loading,
    loadingWeek,
    actionLoading,
    viewWeek,
    setViewWeek,
    showSchedule,
    setShowSchedule,
    scheduleDate,
    setScheduleDate,
    sessionDates,
    setSessionDates,
    scheduling,
    addingBonus,
    handleStart,
    handlePause,
    handleAbandon,
    handleSchedule,
    handleAddBonus,
  } = useTrainingProgram()

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!enrollment) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8">
        <EmptyState />
      </div>
    )
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-10"
    >
      {/* En-tête programme */}
      <motion.div variants={fadeInUp}>
        <ProgramHeader
          enrollment={enrollment}
          actionLoading={actionLoading}
          onStart={handleStart}
          onPause={handlePause}
          onAbandon={handleAbandon}
        />
      </motion.div>

      <div className="rule-strong" />

      {/* Semaine */}
      <motion.div variants={fadeInUp}>
        <WeekNavigator
          enrollment={enrollment}
          viewWeek={viewWeek}
          onPrevWeek={() => setViewWeek((v) => Math.max(1, v - 1))}
          onNextWeek={() => setViewWeek((v) => Math.min(enrollment.duration_weeks, v + 1))}
          addingBonus={addingBonus}
          onAddBonus={handleAddBonus}
          showSchedule={showSchedule}
          onToggleSchedule={() => setShowSchedule((v) => !v)}
        />

        {showSchedule && weekData && (
          <ScheduleWeekPanel
            viewWeek={viewWeek}
            sessions={weekData.sessions}
            scheduleDate={scheduleDate}
            onScheduleDateChange={setScheduleDate}
            sessionDates={sessionDates}
            onSessionDateChange={(i, date) => {
              const next = [...sessionDates]
              next[i] = date
              setSessionDates(next)
            }}
            scheduling={scheduling}
            onSchedule={handleSchedule}
          />
        )}

        {loadingWeek ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : weekData ? (
          <div className="space-y-3">
            {weekData.phase && (
              <div className="text-xs text-muted-foreground px-1 mb-2">
                <span className="text-foreground font-medium">
                  Phase {weekData.phase.phase_number} — {weekData.phase.name}
                </span>
                {' · '}
                {weekData.phase.description}
                {(weekData.sessions.some((session) => session.week === viewWeek)) && (
                  <span className="ml-2 text-primary">Semaine spécifique</span>
                )}
              </div>
            )}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {weekData.sessions.map((session, i) => (
                <WeekSessionCard key={i} session={session} num={i + 1} />
              ))}
            </div>
          </div>
        ) : null}
      </motion.div>
    </motion.div>
  )
}

export default function TrainingProgramsPage() {
  return <TrainingProgramsContent />
}
