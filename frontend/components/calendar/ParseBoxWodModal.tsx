'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { WodCaptureForm, WodCaptureMode } from '@/components/workout/WodCaptureForm'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Instagram, Search } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ParseBoxWodModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate?: Date
  initialMode?: WodCaptureMode
  onSchedule?: (payload: { workout_id?: string; personalized_workout_id?: string }, notes?: string) => Promise<void>
}

export function ParseBoxWodModal({ open, onOpenChange, selectedDate, initialMode = 'instagram', onSchedule }: ParseBoxWodModalProps) {
  const [mode, setMode] = useState<WodCaptureMode>(initialMode)

  useEffect(() => {
    if (open) {
      setMode(initialMode)
    }
  }, [open, initialMode])

  const dateLabel = selectedDate ? format(selectedDate, 'EEEE dd MMMM', { locale: fr }) : null

  const titleIcon = mode === 'search'
    ? <Search className="w-5 h-5 text-blue-700" />
    : <Instagram className="w-5 h-5 text-cyan-700" />

  const titleLabel = mode === 'search' ? 'Rechercher un WOD connu' : 'Coller depuis Instagram'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-hidden flex flex-col bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-foreground">
            {titleIcon}
            {titleLabel}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            {dateLabel ? `Pour le ${dateLabel}` : 'Sera ajouté à ta bibliothèque de workouts'}
          </DialogDescription>
        </DialogHeader>

        {open && (
          <WodCaptureForm
            key={mode}
            mode={mode}
            selectedDate={selectedDate}
            onSchedule={onSchedule}
            onSaved={() => onOpenChange(false)}
            onCancel={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
