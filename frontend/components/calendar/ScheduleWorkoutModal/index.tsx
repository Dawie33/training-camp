'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Building2, Home } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CrossfitTab } from './CrossfitTab'
import { usePersonalizedWorkouts } from './usePersonalizedWorkouts'
import { useWorkoutLibrary } from './useWorkoutLibrary'

type SessionLocation = 'home' | 'box'

interface ScheduleWorkoutModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  onSchedule: (payload: { workout_id?: string; personalized_workout_id?: string }, notes?: string, location?: SessionLocation) => Promise<void>
}

export function ScheduleWorkoutModal({
  open,
  onOpenChange,
  selectedDate,
  onSchedule,
}: ScheduleWorkoutModalProps) {
  const [activeTab, setActiveTab] = useState<'library' | 'personalized'>('library')
  const [selectedWorkoutId, setSelectedWorkoutId] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [location, setLocation] = useState<SessionLocation | undefined>(undefined)

  const library = useWorkoutLibrary(open, activeTab === 'library')
  const personalized = usePersonalizedWorkouts(open, activeTab === 'personalized')

  useEffect(() => {
    if (!open) {
      library.reset()
      personalized.reset()
      setSelectedWorkoutId('')
      setActiveTab('library')
      setNotes('')
      setLocation(undefined)
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
        await onSchedule({ workout_id: selectedWorkoutId }, notes || undefined, location)
      } else {
        await onSchedule({ personalized_workout_id: selectedWorkoutId }, notes || undefined, location)
      }
      closeModal()
    } catch (error) {
      console.error('Error scheduling workout:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-hidden flex flex-col bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="font-display text-foreground">Planifier une séance</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={() => setLocation(location === 'home' ? undefined : 'home')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium border transition-all ${location === 'home' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            <Home className="h-3.5 w-3.5" />
            Maison
          </button>
          <button
            type="button"
            onClick={() => setLocation(location === 'box' ? undefined : 'box')}
            className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium border transition-all ${location === 'box' ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:text-foreground'}`}
          >
            <Building2 className="h-3.5 w-3.5" />
            Box
          </button>
        </div>

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
      </DialogContent>
    </Dialog>
  )
}
