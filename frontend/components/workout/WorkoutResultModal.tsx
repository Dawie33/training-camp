'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useSport } from '@/contexts/SportContext'
import { WorkoutHistoryService } from '@/services/workout-history'
import { TimerConfig, TimerType } from '@/hooks/useWorkoutTimer'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Frown, Meh, Plus, Save, Smile, Sparkles, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface Exercise {
  name: string
  reps?: number
  weight?: number
  sets?: number
}

interface PersonalRecord {
  type: string
  value: number
  unit: string
}

interface WorkoutResultModalProps {
  isOpen: boolean
  onClose: () => void
  timerType: TimerType
  timerConfig: TimerConfig
  duration: number
  completedRounds?: number
  totalRounds?: number
}

type Difficulty = 'easy' | 'medium' | 'hard'
type Feeling = 'bad' | 'ok' | 'good' | 'great'

export function WorkoutResultModal({
  isOpen,
  onClose,
  timerType,
  timerConfig: _timerConfig,
  duration,
  completedRounds,
  totalRounds
}: WorkoutResultModalProps) {
  const router = useRouter()
  const { activeSport } = useSport()
  const [workoutName, setWorkoutName] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [feeling, setFeeling] = useState<Feeling>('good')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [personalRecords, setPersonalRecords] = useState<PersonalRecord[]>([])
  const [isSaving, setIsSaving] = useState(false)

  const difficulties: { value: Difficulty; label: string; color: string }[] = [
    { value: 'easy', label: 'Facile', color: 'bg-green-500' },
    { value: 'medium', label: 'Moyen', color: 'bg-yellow-500' },
    { value: 'hard', label: 'Difficile', color: 'bg-red-500' }
  ]

  const feelings: { value: Feeling; icon: React.ComponentType<{ className?: string }>; label: string; color: string }[] = [
    { value: 'bad', icon: Frown, label: 'Mauvais', color: 'text-red-500' },
    { value: 'ok', icon: Meh, label: 'Correct', color: 'text-yellow-500' },
    { value: 'good', icon: Smile, label: 'Bien', color: 'text-green-500' },
    { value: 'great', icon: Sparkles, label: 'Excellent', color: 'text-blue-500' }
  ]

  const addExercise = () => {
    setExercises([...exercises, { name: '', reps: undefined, weight: undefined, sets: undefined }])
  }

  const updateExercise = (index: number, field: keyof Exercise, value: string | number) => {
    const updated = [...exercises]
    updated[index] = { ...updated[index], [field]: value }
    setExercises(updated)
  }

  const removeExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index))
  }

  const addPersonalRecord = () => {
    setPersonalRecords([...personalRecords, { type: '', value: 0, unit: '' }])
  }

  const updatePersonalRecord = (index: number, field: keyof PersonalRecord, value: string | number) => {
    const updated = [...personalRecords]
    updated[index] = { ...updated[index], [field]: value }
    setPersonalRecords(updated)
  }

  const removePersonalRecord = (index: number) => {
    setPersonalRecords(personalRecords.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!activeSport) return

    setIsSaving(true)

    try {
      const userId = localStorage.getItem('userId') || 'default-user'

      WorkoutHistoryService.saveWorkoutResult({
        userId,
        sportId: activeSport.id,
        workoutName: workoutName || undefined,
        timerType,
        date: new Date().toISOString(),
        duration,
        completedRounds,
        totalRounds,
        notes: notes || undefined,
        difficulty,
        feeling,
        exercises: exercises.length > 0 ? exercises : undefined,
        personalRecords: personalRecords.length > 0 ? personalRecords : undefined
      })

      // Redirect to tracking page
      router.push('/tracking')
      onClose()
    } catch (error) {
      console.error('Error saving workout result:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`
    }
    return `${secs}s`
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Workout Terminé !</DialogTitle>
          <DialogDescription>
            Enregistre les détails de ton workout pour suivre ta progression
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Summary */}
          <div className="p-4 rounded-lg bg-muted/50 border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              <span className="font-bold">{timerType}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Durée</span>
              <span className="font-bold">{formatDuration(duration)}</span>
            </div>
            {completedRounds && totalRounds && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Rounds</span>
                <span className="font-bold">{completedRounds}/{totalRounds}</span>
              </div>
            )}
          </div>

          {/* Workout Name */}
          <div className="space-y-2">
            <Label htmlFor="workout-name">Nom du workout (optionnel)</Label>
            <Input
              id="workout-name"
              placeholder="Ex: Murph, Fran, Morning routine..."
              value={workoutName}
              onChange={(e) => setWorkoutName(e.target.value)}
            />
          </div>

          {/* Difficulty */}
          <div className="space-y-2">
            <Label>Difficulté</Label>
            <div className="flex gap-2">
              {difficulties.map((diff) => (
                <button
                  key={diff.value}
                  onClick={() => setDifficulty(diff.value)}
                  className={cn(
                    'flex-1 p-3 rounded-lg border-2 transition-all',
                    difficulty === diff.value
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  )}
                >
                  <div className={cn('w-3 h-3 rounded-full mx-auto mb-1', diff.color)} />
                  <p className="text-sm font-medium">{diff.label}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Feeling */}
          <div className="space-y-2">
            <Label>Ressenti</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {feelings.map((feel) => {
                const Icon = feel.icon
                return (
                  <button
                    key={feel.value}
                    onClick={() => setFeeling(feel.value)}
                    className={cn(
                      'p-3 rounded-lg border-2 transition-all',
                      feeling === feel.value
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <Icon className={cn('w-6 h-6 mx-auto mb-1', feel.color)} />
                    <p className="text-sm font-medium">{feel.label}</p>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              placeholder="Comment s'est passé ton workout ? Des remarques particulières ?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Exercises */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Exercices (optionnel)</Label>
              <Button type="button" variant="outline" size="sm" onClick={addExercise}>
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>
            {exercises.map((exercise, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 items-start"
              >
                <Input
                  placeholder="Nom"
                  value={exercise.name}
                  onChange={(e) => updateExercise(index, 'name', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Sets"
                  value={exercise.sets || ''}
                  onChange={(e) => updateExercise(index, 'sets', parseInt(e.target.value))}
                  className="w-20"
                />
                <Input
                  type="number"
                  placeholder="Reps"
                  value={exercise.reps || ''}
                  onChange={(e) => updateExercise(index, 'reps', parseInt(e.target.value))}
                  className="w-20"
                />
                <Input
                  type="number"
                  placeholder="Poids (kg)"
                  value={exercise.weight || ''}
                  onChange={(e) => updateExercise(index, 'weight', parseFloat(e.target.value))}
                  className="w-24"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeExercise(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>

          {/* Personal Records */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-500" />
                Records Personnels (optionnel)
              </Label>
              <Button type="button" variant="outline" size="sm" onClick={addPersonalRecord}>
                <Plus className="w-4 h-4 mr-1" />
                Ajouter
              </Button>
            </div>
            {personalRecords.map((pr, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-2 items-start"
              >
                <Input
                  placeholder="Type (ex: Back Squat)"
                  value={pr.type}
                  onChange={(e) => updatePersonalRecord(index, 'type', e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  placeholder="Valeur"
                  value={pr.value || ''}
                  onChange={(e) => updatePersonalRecord(index, 'value', parseFloat(e.target.value))}
                  className="w-24"
                />
                <Input
                  placeholder="Unité (kg, reps...)"
                  value={pr.unit}
                  onChange={(e) => updatePersonalRecord(index, 'unit', e.target.value)}
                  className="w-24"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removePersonalRecord(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose} className="flex-1" disabled={isSaving}>
            Annuler
          </Button>
          <Button onClick={handleSave} className="flex-1" disabled={isSaving}>
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
