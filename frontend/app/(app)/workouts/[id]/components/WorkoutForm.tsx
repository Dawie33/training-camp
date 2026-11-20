'use client'

import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { WORKOUT_TYPES } from '@/domain/entities/workout-structure'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'
import type { WorkoutFormProps } from '../types'
import { BlocksEditor } from './BlocksEditor'
import { TagInput } from './TagInput'

/**
 * Formulaire de création/édition d'un workout : type, format, tags, structure des
 * blocs (via `BlocksEditor`), objectif de force (si type strength) et notes.
 */
export function WorkoutForm({ formData, setFormData, onSubmit, saving, isNewMode }: WorkoutFormProps) {
  const router = useRouter()

  const availableWorkoutTypes = useMemo(() => {
    return WORKOUT_TYPES.crossfit
  }, [])

  const isStrengthType = formData.workout_type === 'strength_max' || formData.workout_type === 'strength_accessory'

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Type de workout */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="font-display text-2xl font-semibold text-foreground border-b border-border pb-3">
          Type de WOD
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="field-workoutform-0" className="text-sm font-medium text-foreground block mb-2">Catégorie</label>
            <select id="field-workoutform-0"
              className="w-full px-4 py-3 bg-background border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
              value={formData.workout_type}
              onChange={(e) => setFormData({ ...formData, workout_type: e.target.value })}
            >
              <option value="">Sélectionner...</option>
              {availableWorkoutTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="field-workoutform-1" className="text-sm font-medium text-foreground block mb-2">Format du WOD</label>
            <select id="field-workoutform-1"
              className="w-full px-4 py-3 bg-background border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
              value={formData.wod_format}
              onChange={(e) => setFormData({ ...formData, wod_format: e.target.value })}
            >
              <option value="">Sélectionner...</option>
              <option value="for_time">For Time</option>
              <option value="amrap">AMRAP</option>
              <option value="emom">EMOM</option>
              <option value="tabata">Tabata</option>
              <option value="circuit">Circuit / Rounds</option>
              <option value="intervals">Intervals</option>
              <option value="strength">Strength (séries/reps)</option>
            </select>
          </div>
        </div>

        <TagInput
          label="Etiquettes (tags)"
          value={formData.tags}
          onChange={(value) => setFormData({ ...formData, tags: value })}
          placeholder="cardio, strength, endurance..."
        />

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="w-5 h-5 rounded border-border bg-background text-primary focus:ring-ring/50"
            checked={formData.is_benchmark}
            onChange={(e) => setFormData({ ...formData, is_benchmark: e.target.checked })}
          />
          <span className="text-sm font-medium text-foreground">
            Marquer comme benchmark (WOD de référence à retester dans le temps)
          </span>
        </label>
      </div>

      {/* Bloc RM - visible uniquement pour les types Force */}
      {isStrengthType && (
        <div className="bg-card border border-primary/30 rounded-lg p-6 space-y-4">
          <h3 className="font-display text-2xl font-semibold text-foreground border-b border-border pb-3">
            🏋️ Objectif Force
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="field-workoutform-2" className="text-sm font-medium text-foreground block mb-2">Type RM</label>
              <select id="field-workoutform-2"
                className="w-full px-4 py-3 bg-background border border-border text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
                value={formData.rm_type}
                onChange={(e) => setFormData({ ...formData, rm_type: e.target.value })}
              >
                <option value="">Sélectionner...</option>
                <option value="1RM">1RM</option>
                <option value="3RM">3RM</option>
                <option value="5RM">5RM</option>
              </select>
            </div>
            <div>
              <label htmlFor="field-workoutform-3" className="text-sm font-medium text-foreground block mb-2">Exercice</label>
              <Input id="field-workoutform-3"
                type="text"
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
                value={formData.rm_exercise}
                onChange={(e) => setFormData({ ...formData, rm_exercise: e.target.value })}
                placeholder="ex: Back Squat"
              />
            </div>
            <div>
              <label htmlFor="field-workoutform-4" className="text-sm font-medium text-foreground block mb-2">Poids cible</label>
              <Input id="field-workoutform-4"
                type="text"
                className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all"
                value={formData.rm_weight}
                onChange={(e) => setFormData({ ...formData, rm_weight: e.target.value })}
                placeholder="ex: 120kg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Structure du workout */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="font-display text-2xl font-semibold text-foreground border-b border-border pb-3">
          Structure du WOD
        </h3>

        <BlocksEditor
          value={formData.blocks}
          onChange={(value) => setFormData({ ...formData, blocks: value })}
        />
      </div>

      {/* Notes personnelles */}
      <div className="bg-card border border-border rounded-lg p-6 space-y-4">
        <h3 className="font-display text-2xl font-semibold text-foreground border-b border-border pb-3">
          Notes
        </h3>

        <div>
          <label htmlFor="field-workoutform-5" className="text-sm font-medium text-foreground block mb-2">Notes personnelles</label>
          <Textarea id="field-workoutform-5"
            className="w-full px-4 py-3 bg-background border border-border text-foreground placeholder:text-muted-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary transition-all resize-none"
            value={formData.personal_notes}
            onChange={(e) => setFormData({ ...formData, personal_notes: e.target.value })}
            rows={3}
            placeholder="Remarques, objectifs, consignes..."
          />
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex flex-wrap gap-4 pt-2">
        <Button variant="default"
          type="submit"
          disabled={saving}
          className="flex-1 py-3 px-6 bg-primary text-primary-foreground hover:bg-primary/90  font-bold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {saving ? 'Enregistrement...' : isNewMode ? 'Créer le Workout' : 'Sauvegarder'}
        </Button>
        <Button variant="ghost"
          type="button"
          onClick={() => router.back()}
          className="py-3 px-6 bg-card border border-border text-foreground font-medium rounded-xl hover:bg-card transition-all"
        >
          Annuler
        </Button>
      </div>
    </form>
  )
}
