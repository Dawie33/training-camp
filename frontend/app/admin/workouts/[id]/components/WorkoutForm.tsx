'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useRouter } from 'next/navigation'

interface FormData {
  name: string
  description: string
  workout_type: string
  difficulty: string
  intensity: string
  estimated_duration: number
  status: string
  isActive: boolean
  isFeatured: boolean
  isPublic: boolean
  is_benchmark: boolean
  ai_generated: boolean
  sport_id: string
  blocks: string
  tags: string
  scheduled_date: string
  scaling_options: string
  equipment_required: string
  focus_areas: string
  metrics_tracked: string
  coach_notes: string
  target_metrics: string
  ai_parameters: string
  image_url: string
}

interface WorkoutFormProps {
  formData: FormData
  setFormData: (data: FormData) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
  saving: boolean
  isNewMode: boolean
}

export function WorkoutForm({ formData, setFormData, onSubmit, saving, isNewMode }: WorkoutFormProps) {
  const router = useRouter()

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold border-b pb-2">Informations de base</h3>

        <div>
          <label className="text-sm font-medium">Name *</label>
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

      <div>
        <label className="text-sm font-medium">Image</label>
        <Input
          type='url'
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          placeholder="https://example.com/image.jpg"
        />
        <p className="text-xs text-muted-foreground mt-1">
          URL de l'image du workout (Unsplash recommandé)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Workout Type</label>
          <Input
            value={formData.workout_type}
            onChange={(e) => setFormData({ ...formData, workout_type: e.target.value })}
            placeholder="e.g., AMRAP, For Time, EMOM"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Estimated Duration (min)</label>
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
          <label className="text-sm font-medium">Difficulty</label>
          <select
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
            value={formData.difficulty}
            onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
          >
            <option value="beginner">Beginner</option>
            <option value="intermediate">Intermediate</option>
            <option value="advanced">Advanced</option>
          </select>
        </div>

        <div>
          <label className="text-sm font-medium">Intensity</label>
          <Input
            value={formData.intensity}
            onChange={(e) => setFormData({ ...formData, intensity: e.target.value })}
            placeholder="e.g., low, moderate, high"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Status</label>
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
        <h3 className="text-lg font-semibold border-b pb-2">Details avances</h3>

        <div>
          <label className="text-sm font-medium">Sport ID</label>
          <Input
            value={formData.sport_id}
            onChange={(e) => setFormData({ ...formData, sport_id: e.target.value })}
            placeholder="UUID du sport"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Scheduled Date</label>
          <Input
            type="date"
            value={formData.scheduled_date}
            onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
          />
        </div>

        <div>
          <label className="text-sm font-medium">Coach Notes</label>
          <Textarea
            value={formData.coach_notes}
            onChange={(e) => setFormData({ ...formData, coach_notes: e.target.value })}
            rows={3}
            placeholder="Notes pour les coachs..."
          />
        </div>

        <div>
          <label className="text-sm font-medium">Tags (separes par des virgules)</label>
          <Input
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="cardio, strength, endurance"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Scaling Options (JSON ou comma-separated)</label>
          <Textarea
            value={formData.scaling_options}
            onChange={(e) => setFormData({ ...formData, scaling_options: e.target.value })}
            rows={2}
            placeholder='["rx", "scaled", "beginner"]'
          />
        </div>

        <div>
          <label className="text-sm font-medium">Equipment Required (JSON ou comma-separated)</label>
          <Textarea
            value={formData.equipment_required}
            onChange={(e) => setFormData({ ...formData, equipment_required: e.target.value })}
            rows={2}
            placeholder='["barbell", "pull-up bar", "rower"]'
          />
        </div>

        <div>
          <label className="text-sm font-medium">Focus Areas (JSON ou comma-separated)</label>
          <Textarea
            value={formData.focus_areas}
            onChange={(e) => setFormData({ ...formData, focus_areas: e.target.value })}
            rows={2}
            placeholder='["endurance", "strength", "technique"]'
          />
        </div>

        <div>
          <label className="text-sm font-medium">Metrics Tracked (JSON ou comma-separated)</label>
          <Textarea
            value={formData.metrics_tracked}
            onChange={(e) => setFormData({ ...formData, metrics_tracked: e.target.value })}
            rows={2}
            placeholder='["time", "rounds", "reps"]'
          />
        </div>

        <div>
          <label className="text-sm font-medium">Blocks (JSON)</label>
          <Textarea
            value={formData.blocks}
            onChange={(e) => setFormData({ ...formData, blocks: e.target.value })}
            rows={8}
            placeholder='{"warmup": [], "strength": {}, "metcon": {}}'
            className="font-mono text-xs"
          />
        </div>
      </div>

      {/* Submit Buttons */}
      <div className="flex gap-4 pt-4">
        <Button type="submit" disabled={saving}>
          {saving ? 'Enregistrement...' : isNewMode ? 'Creer' : 'Sauvegarder'}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Annuler
        </Button>
      </div>
    </form>
  )
}
