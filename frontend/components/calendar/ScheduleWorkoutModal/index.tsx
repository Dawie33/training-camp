'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { activitiesApi } from '@/services/activities'
import { RunType } from '@/services/running'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { BikingTab } from './BikingTab'
import { CrossfitTab } from './CrossfitTab'
import { RunningTab } from './RunningTab'
import { StrengthTab } from './StrengthTab'
import { SPORT_TABS, SportTab } from './types'
import { useBikingSessions } from './useBikingSessions'
import { usePersonalizedWorkouts } from './usePersonalizedWorkouts'
import { useStrengthSessions } from './useStrengthSessions'
import { useWorkoutLibrary } from './useWorkoutLibrary'

interface ScheduleWorkoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  onSchedule: (payload: { workout_id?: string; personalized_workout_id?: string }, notes?: string) => Promise<void>
  onActivityScheduled?: () => void
}

export function ScheduleWorkoutModal({
  open,
  onOpenChange,
  selectedDate,
  onSchedule,
  onActivityScheduled,
}: ScheduleWorkoutModalProps) {
  const [sportTab, setSportTab] = useState<SportTab>('crossfit')
  const [activeTab, setActiveTab] = useState<'library' | 'personalized'>('library')
  const [selectedWorkoutId, setSelectedWorkoutId] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [runType, setRunType] = useState<RunType>('easy')

  const library = useWorkoutLibrary(open, activeTab === 'library')
  const personalized = usePersonalizedWorkouts(open, activeTab === 'personalized')
  const biking = useBikingSessions(open, sportTab === 'biking')
  const strength = useStrengthSessions(open, sportTab === 'strength')

  useEffect(() => {
    if (!open) {
      library.reset()
      personalized.reset()
      biking.reset()
      strength.reset()
      setSelectedWorkoutId('')
      setActiveTab('library')
      setSportTab('crossfit')
      setNotes('')
      setRunType('easy')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const closeModal = () => {
    onOpenChange(false)
  }

  const handleTabChange = (tab: 'library' | 'personalized') => {
    setActiveTab(tab)
    setSelectedWorkoutId('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedWorkoutId) return
    try {
      setSubmitting(true)
      if (activeTab === 'library') {
        await onSchedule({ workout_id: selectedWorkoutId }, notes || undefined)
      } else {
        await onSchedule({ personalized_workout_id: selectedWorkoutId }, notes || undefined)
      }
      closeModal()
    } catch (error) {
      console.error('Error scheduling workout:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitSportActivity = async () => {
    const activityTypeMap: Record<Exclude<SportTab, 'crossfit'>, 'running' | 'biking' | 'strength'> = {
      running: 'running',
      biking: 'biking',
      strength: 'strength',
    }
    if (sportTab === 'crossfit') return
    setSubmitting(true)
    try {
      const activityId = sportTab === 'strength' ? strength.selectedId : sportTab === 'biking' ? biking.selectedId : undefined
      await activitiesApi.create({
        activity_type: activityTypeMap[sportTab],
        scheduled_date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
        activity_id: activityId || undefined,
        notes: notes || undefined,
      })
      toast.success('Séance planifiée !')
      onActivityScheduled?.()
      closeModal()
    } catch {
      toast.error('Erreur lors de la planification')
    } finally {
      setSubmitting(false)
    }
  }

  const activeSport = SPORT_TABS.find(t => t.id === sportTab)!

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">Planifier une séance</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 bg-muted/60 rounded-md p-1">
          {SPORT_TABS.map(tab => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSportTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-md text-xs font-medium transition-all border ${sportTab === tab.id ? `${tab.activeColor} border` : 'text-muted-foreground hover:text-foreground border-transparent'}`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </div>

        {sportTab === 'crossfit' && (
          <CrossfitTab
            activeTab={activeTab}
            onTabChange={handleTabChange}
            library={library}
            personalized={personalized}
            selectedWorkoutId={selectedWorkoutId}
            onSelectWorkout={setSelectedWorkoutId}
            notes={notes}
            onNotesChange={setNotes}
            submitting={submitting}
            onSubmit={handleSubmit}
            onCancel={closeModal}
          />
        )}

        {sportTab === 'running' && (
          <RunningTab
            activeSport={activeSport}
            runType={runType}
            onRunTypeChange={setRunType}
            notes={notes}
            onNotesChange={setNotes}
            submitting={submitting}
            onSubmit={handleSubmitSportActivity}
            onCancel={closeModal}
          />
        )}

        {sportTab === 'biking' && (
          <BikingTab
            biking={biking}
            notes={notes}
            onNotesChange={setNotes}
            submitting={submitting}
            onSubmit={handleSubmitSportActivity}
            onCancel={closeModal}
          />
        )}

        {sportTab === 'strength' && (
          <StrengthTab
            strength={strength}
            notes={notes}
            onNotesChange={setNotes}
            submitting={submitting}
            onSubmit={handleSubmitSportActivity}
            onCancel={closeModal}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
