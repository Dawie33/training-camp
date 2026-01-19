'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { WORKOUT_TYPES } from '@/domain/entities/workout-structure'
import { sportsService } from '@/services'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import type { WorkoutFormProps } from '../types'
import { BlocksEditor } from './BlocksEditor'
import { TagInput } from './TagInput'

export function WorkoutForm({ formData, setFormData, onSubmit, saving, isNewMode }: WorkoutFormProps) {
  const router = useRouter()
  const [sportId, setSportId] = useState<string>('')

  // Charger l'ID du sport crossfit au montage
  useEffect(() => {
    const fetchSportId = async () => {
      try {
        const result = await sportsService.getAll({ slug: 'crossfit' })
        if (result.rows.length > 0) {
          const id = result.rows[0].id
          setSportId(id)
          // Auto-set sport_id if not already set
          if (!formData.sport_id) {
            setFormData({ ...formData, sport_id: id })
          }
        }
      } catch (err) {
        console.error('Error loading sport:', err)
      }
    }
    fetchSportId()
  }, [])

  // Obtenir les types de workout disponibles pour crossfit
  const availableWorkoutTypes = useMemo(() => {
    return WORKOUT_TYPES.crossfit
  }, [])

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Informations de base</h3>

        <div>
          <label className="text-sm font-medium">Nom du workout</label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Type de workout</label>
          <select
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            value={formData.workout_type}
            onChange={(e) => setFormData({ ...formData, workout_type: e.target.value })}
          >
            <option value="">Sélectionner un type...</option>
            {availableWorkoutTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Temps estimé (min)</label>
          <Input
            type="number"
            value={formData.estimated_duration}
            onChange={(e) =>
              setFormData({ ...formData, estimated_duration: Number(e.target.value) })
            }
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Difficulté</label>
          <select
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
          >
            <option value="beginner">Débutant</option>
            <option value="intermediate">Intermédiaire</option>
            <option value="advanced">Avancé</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Intensité</label>
          <Input
            value={formData.intensity}
            onChange={(e) => setFormData({ ...formData, intensity: e.target.value })}
            placeholder="e.g., low, moderate, high"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Statut</label>
          <select
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
            className="h-4 w-4"
          />
          <label htmlFor="isActive" className="text-sm font-medium">
            Active
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isFeatured"
            checked={formData.isFeatured}
            onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
            className="h-4 w-4"
          />
          <label htmlFor="isFeatured" className="text-sm font-medium">
            Featured
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="isPublic"
            checked={formData.isPublic}
            onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
            className="h-4 w-4"
          />
          <label htmlFor="isPublic" className="text-sm font-medium">
            Public
          </label>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="is_benchmark"
            checked={formData.is_benchmark}
            onChange={(e) => setFormData({ ...formData, is_benchmark: e.target.checked })}
            className="h-4 w-4"
          />
          <label htmlFor="is_benchmark" className="text-sm font-medium">
            Benchmark
          </label>
        </div>
      </div>

      {/* Advanced Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Détails avancés</h3>

        <div>
          <label className="text-sm font-medium">Notes du coach</label>
          <Textarea
            value={formData.coach_notes}
            onChange={(e) => setFormData({ ...formData, coach_notes: e.target.value })}
            rows={3}
            placeholder="Notes pour les coachs..."
          />
        </div>

        <TagInput
          label="Etiquettes (tags)"
          value={formData.tags}
          onChange={(value) => setFormData({ ...formData, tags: value })}
          placeholder="cardio, strength, endurance..."
        />

        <TagInput
          label="Options de Scaling"
          value={formData.scaling_options}
          onChange={(value) => setFormData({ ...formData, scaling_options: value })}
          placeholder="rx, scaled, beginner..."
        />

        <TagInput
          label="Equipement requis"
          value={formData.equipment_required}
          onChange={(value) => setFormData({ ...formData, equipment_required: value })}
          placeholder="barbell, pull-up bar, rower..."
        />

        <TagInput
          label="Zones ciblées"
          value={formData.focus_areas}
          onChange={(value) => setFormData({ ...formData, focus_areas: value })}
          placeholder="endurance, strength, technique..."
        />

        <TagInput
          label="Suivis de Metrics"
          value={formData.metrics_tracked}
          onChange={(value) => setFormData({ ...formData, metrics_tracked: value })}
          placeholder="time, rounds, reps..."
        />

        <BlocksEditor
          label="Structure du Workout (Blocks)"
          value={formData.blocks}
          onChange={(value) => setFormData({ ...formData, blocks: value })}
        />
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={saving || !sportId}>
          {saving ? 'Enregistrement...' : isNewMode ? 'Creer' : 'Sauvegarder'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
