'use client'

import { Button } from '@/components/ui/button'
import { RichSectionDisplay } from '@/components/workout/display/RichSectionDisplay'
import { GeneratedWorkout } from '@/domain/entities/workout'
import { workoutsApi, workoutsService } from '@/services/workouts'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { ArrowLeft, Brain, Clock, Loader2, Save, Search, TrendingUp, Zap } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

export type WodCaptureMode = 'instagram' | 'search'
type Phase = 'input' | 'preview' | 'saving'

interface WodCaptureFormProps {
  mode: WodCaptureMode
  selectedDate?: Date
  onSchedule?: (payload: { workout_id?: string; personalized_workout_id?: string }, notes?: string) => Promise<void>
  onSaved?: () => void
  onCancel?: () => void
}

const difficultyColors: Record<string, string> = {
  beginner: 'bg-green-600/10 text-green-700 border-green-600/30',
  intermediate: 'bg-yellow-600/10 text-yellow-700 border-yellow-600/30',
  advanced: 'bg-red-600/10 text-red-700 border-red-600/30',
  elite: 'bg-purple-600/10 text-purple-700 border-purple-600/30',
}

const intensityColors: Record<string, string> = {
  low: 'bg-blue-600/10 text-blue-700 border-blue-600/30',
  moderate: 'bg-primary/10 text-primary border-primary/30',
  high: 'bg-rose-600/10 text-rose-700 border-rose-600/30',
  very_high: 'bg-purple-600/10 text-purple-700 border-purple-600/30',
}

export function WodCaptureForm({ mode, selectedDate, onSchedule, onSaved, onCancel }: WodCaptureFormProps) {
  const [phase, setPhase] = useState<Phase>('input')
  const [text, setText] = useState('')
  const [searchName, setSearchName] = useState('')
  const [referenceData, setReferenceData] = useState('')
  const [parsedWorkout, setParsedWorkout] = useState<GeneratedWorkout | null>(null)
  const [analyzing, setAnalyzing] = useState(false)

  const resetInput = () => {
    setText('')
    setSearchName('')
    setReferenceData('')
  }

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

  const handleLookup = async () => {
    if (!searchName.trim() || searchName.trim().length < 2) return
    try {
      setAnalyzing(true)
      const result = await workoutsService.lookupWorkout(searchName.trim(), referenceData.trim() || undefined)
      setParsedWorkout(result)
      setPhase('preview')
    } catch {
      toast.error(`WOD "${searchName}" non trouvé. S'il est récent, colle ses détails dans le champ ci-dessous.`)
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
        is_benchmark: mode === 'search',
        ...({ ai_generated: true } as object),
      } as Parameters<typeof workoutsApi.create>[0])

      if (onSchedule) {
        await onSchedule({ workout_id: saved.id })
        toast.success(`"${parsedWorkout.name}" planifié pour le ${format(selectedDate!, 'dd MMMM', { locale: fr })}`)
      } else {
        toast.success(`"${parsedWorkout.name}" ajouté à ta bibliothèque`)
      }

      setPhase('input')
      resetInput()
      setParsedWorkout(null)
      onSaved?.()
    } catch {
      toast.error('Erreur lors de la sauvegarde. Veuillez réessayer.')
      setPhase('preview')
    }
  }

  const handleCancel = () => {
    setPhase('input')
    resetInput()
    setParsedWorkout(null)
    setAnalyzing(false)
    onCancel?.()
  }

  return (
    <>
      {/* Phase: input — Instagram mode */}
      {phase === 'input' && mode === 'instagram' && (
        <div className="flex flex-col gap-4 flex-1">
          <textarea
            className="flex-1 min-h-[260px] w-full rounded-md border border-border bg-card p-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
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
            <Button variant="ghost" onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
              Annuler
            </Button>
            <Button
              onClick={handleAnalyze}
              disabled={analyzing || text.trim().length < 10}
              className="bg-primary/10 text-primary border border-primary/30 hover:bg-primary/15"
            >
              {analyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analyse en cours...</>
              ) : (
                <><Brain className="w-4 h-4 mr-2" />Analyser</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Phase: input — Search mode */}
      {phase === 'input' && mode === 'search' && (
        <div className="flex flex-col gap-4 flex-1">
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Entre le nom d&apos;un WOD officiel : benchmark (Fran, Murph, Helen...), CrossFit Open (18.1, 24.3...) ou Hero WOD.
            </p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleLookup()}
                placeholder="ex: Fran, Open 18.1, Murph, DT..."
                className="w-full pl-10 pr-4 py-3 rounded-md border border-border bg-card text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600/30"
                autoFocus
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {['Fran', 'Murph', 'Helen', 'Cindy', 'DT', 'Grace', 'Open 18.1', 'Open 24.1'].map((name) => (
                <button
                  key={name}
                  onClick={() => setSearchName(name)}
                  className="px-3 py-1 rounded-full text-xs border border-border bg-muted/60 text-muted-foreground hover:text-foreground hover:border-blue-600/40 transition-all"
                >
                  {name}
                </button>
              ))}
            </div>
            <div className="space-y-1.5 pt-1">
              <p className="text-xs text-muted-foreground">
                WOD récent ou inconnu de l&apos;IA ? Colle ses détails ici (optionnel) :
              </p>
              <textarea
                className="w-full min-h-[100px] rounded-md border border-border bg-card p-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600/30 resize-none"
                placeholder={`Exemple :\n3 rounds for time:\n24m DB overhead walking lunge (22.5/15 kg)\n20 DB alternating snatches\n20 pull-ups`}
                value={referenceData}
                onChange={(e) => setReferenceData(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-auto">
            <Button variant="ghost" onClick={handleCancel} className="text-muted-foreground hover:text-foreground">
              Annuler
            </Button>
            <Button
              onClick={handleLookup}
              disabled={analyzing || searchName.trim().length < 2}
              className="bg-blue-600/10 text-blue-700 border border-blue-600/30 hover:bg-blue-600/15"
            >
              {analyzing ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Recherche en cours...</>
              ) : (
                <><Search className="w-4 h-4 mr-2" />Rechercher</>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Phase: preview */}
      {phase === 'preview' && parsedWorkout && (
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-foreground">{parsedWorkout.name}</h3>
            <p className="text-sm text-muted-foreground">{parsedWorkout.description}</p>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 px-2 py-1 rounded-full text-xs border bg-muted/60 text-muted-foreground border-border">
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

          <div className="flex-1 overflow-y-auto pr-1 space-y-4">
            {parsedWorkout.blocks?.sections?.map((section, idx) => (
              <RichSectionDisplay key={idx} section={section} />
            ))}
          </div>

          <div className="flex justify-between gap-2 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => { setPhase('input'); setParsedWorkout(null) }} className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {mode === 'search' ? 'Autre WOD' : 'Ré-analyser'}
            </Button>
            <Button onClick={handleSaveAndSchedule}>
              <Save className="w-4 h-4 mr-2" />
              {onSchedule ? 'Sauvegarder & Planifier' : 'Sauvegarder dans la bibliothèque'}
            </Button>
          </div>
        </div>
      )}

      {/* Phase: saving */}
      {phase === 'saving' && (
        <div className="flex flex-col items-center justify-center flex-1 gap-4 py-12">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Sauvegarde en cours...</p>
        </div>
      )}
    </>
  )
}
