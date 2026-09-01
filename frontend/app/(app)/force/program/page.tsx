'use client'

import { EmptyState } from '@/components/program/EmptyState'
import { ProgramHeader } from '@/components/program/ProgramHeader'
import { ScheduleWeekPanel } from '@/components/program/ScheduleWeekPanel'
import { WeekNavigator } from '@/components/program/WeekNavigator'
import { WeekSessionCard } from '@/components/program/WeekSessionCard'
import { useTrainingProgram } from '@/hooks/useTrainingProgram'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { strengthProgramApi } from '@/services/strength-program'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

function StrengthProgramContent() {
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
    handleStart,
    handlePause,
    handleAbandon,
    handleSchedule,
  } = useTrainingProgram(strengthProgramApi)

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
        <EmptyState
          generateHref="/force/program/generate"
          description="Crée un programme de force structuré et périodisé, adapté à ton niveau et à ton objectif — force max, hypertrophie, powerlifting ou strongman."
        />
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

export default function StrengthProgramPage() {
  return <StrengthProgramContent />
}
