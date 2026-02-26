'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { RichSectionDisplay } from '@/components/workout/display/RichSectionDisplay'
import { GeneratedWorkout } from '@/domain/entities/workout'
import { workoutsService } from '@/services/workouts'
import { workoutsApi } from '@/services/workouts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, Brain, Clock, Loader2, RotateCcw, Save, TrendingUp, Zap } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface ParseBoxWodModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedDate: Date
  onSchedule: (workoutId: string, notes?: string) => Promise<void>
}

type Phase = 'input' | 'preview' | 'saving'

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-500/20 text-green-400 border-green-500/30',
  intermediate: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  advanced: 'bg-red-500/20 text-red-400 border-red-500/30',
}

const intensityColors: Record<string, string> = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  moderate: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  high: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  very_high: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

export function ParseBoxWodModal({ open, onOpenChange, selectedDate, onSchedule }: ParseBoxWodModalProps) {
  const [phase, setPhase] = useState<Phase>('input')
  const [text, setText] = useState('')
  const [parsedWorkout, setParsedWorkout] = useState<GeneratedWorkout | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const handleAnalyze = async () => {
    if (!text.trim() || text.trim().length < 10) return
    try {
      setAnalyzing(true)
      const result = await workoutsService.parseWorkoutText(text)
      setParsedWorkout(result)
      setPhase('preview')
    } catch {
      toast.error('Impossible d\'analyser ce texte. Assure-toi qu\'il décrit bien un workout.')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleSaveAndSchedule = async () => {
    if (!parsedWorkout) return
    try {
      setPhase('saving')
      const saved = await workoutsApi.create({
        name: parsedWorkout.name,
        description: parsedWorkout.description,
        workout_type: parsedWorkout.workout_type,
        estimated_duration: parsedWorkout.estimated_duration,
        difficulty: parsedWorkout.difficulty,
        intensity: parsedWorkout.intensity,
        blocks: parsedWorkout.blocks,
        equipment_required: parsedWorkout.equipment_required,
        tags: parsedWorkout.tags,
        isPublic: false,
        status: 'published',
        ...({ ai_generated: true } as object),
      } as Parameters<typeof workoutsApi.create>[0])

      await onSchedule(saved.id)
      toast.success(`"${parsedWorkout.name}" planifié pour le ${format(selectedDate, 'dd MMMM', { locale: fr })}`)
      handleClose()
    } catch {
      toast.error('Erreur lors de la sauvegarde. Veuillez réessayer.')
      setPhase('preview')
    }
  }

  const handleClose = () => {
    setPhase('input')
    setText('')
    setParsedWorkout(null)
    setAnalyzing(false)
    onOpenChange(false)
  }

  const dateLabel = format(selectedDate, 'EEEE dd MMMM', { locale: fr })

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] overflow-hidden flex flex-col bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Brain className="w-5 h-5 text-orange-400" />
            Box WOD — Importer depuis Instagram
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Colle la légende du post Instagram de ta box pour le {dateLabel}
          </DialogDescription>
        </DialogHeader>

        {/* Phase: input */}
        {phase === 'input' && (
          <div className="flex flex-col gap-4 flex-1">
            <textarea
              className="flex-1 min-h-[260px] w-full rounded-xl border border-white/10 bg-slate-800/50 p-4 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-400/50 resize-none"
              placeholder="Colle ici la légende du post Instagram de ta box...

Exemple :
WOD du jeudi 26/02

AMRAP 20 minutes :
- 5 Pull-ups
- 10 Push-ups
- 15 Air Squats"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-slate-400 hover:text-white"
              >
                Annuler
              </Button>
              <Button
                onClick={handleAnalyze}
                disabled={analyzing || text.trim().length < 10}
                className="bg-orange-500/20 text-orange-400 border border-orange-500/30 hover:bg-orange-500/30"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyse en cours...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4 mr-2" />
                    Analyser
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Phase: preview */}
        {phase === 'preview' && parsedWorkout && (
          <div className="flex flex-col gap-4 flex-1 overflow-hidden">
            {/* Workout header */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white">{parsedWorkout.name}</h3>
              <p className="text-sm text-slate-400">{parsedWorkout.description}</p>
              <div className="flex flex-wrap gap-2">
                <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs border bg-slate-700/50 text-slate-300 border-slate-600">
                  <Clock className="w-3 h-3" />
                  {parsedWorkout.estimated_duration} min
                </span>
                <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${difficultyColors[parsedWorkout.difficulty] || difficultyColors.intermediate}`}>
                  <TrendingUp className="w-3 h-3" />
                  {parsedWorkout.difficulty}
                </span>
                <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border ${intensityColors[parsedWorkout.intensity] || intensityColors.moderate}`}>
                  <Zap className="w-3 h-3" />
                  {parsedWorkout.intensity.replace('_', ' ')}
                </span>
              </div>
            </div>

            {/* Sections */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              {parsedWorkout.blocks?.sections?.map((section, idx) => (
                <RichSectionDisplay key={idx} section={section} />
              ))}
            </div>

            {/* Actions */}
            <div className="flex justify-between gap-2 pt-2 border-t border-white/10">
              <Button
                variant="ghost"
                onClick={() => setPhase('input')}
                className="text-slate-400 hover:text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Ré-analyser
              </Button>
              <Button
                onClick={handleSaveAndSchedule}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder & Planifier
              </Button>
            </div>
          </div>
        )}

        {/* Phase: saving */}
        {phase === 'saving' && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 py-12">
            <Loader2 className="w-10 h-10 animate-spin text-orange-400" />
            <p className="text-slate-400 text-sm">Sauvegarde en cours...</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
