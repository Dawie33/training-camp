'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { createWorkout, getWorkout, updateWorkout } from '@/lib/api/admin'
import type { AdminWorkout } from '@/lib/types/workout'
import { ArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

/**
 * Page de modification d'un entraînement
 * @param {string} props.params.id - The workout id
 */

export default function WorkoutEditPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const isNewMode = params.id === 'new'
  const [loading, setLoading] = useState(!isNewMode)
  const [saving, setSaving] = useState(false)
  const [workout, setWorkout] = useState<AdminWorkout | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    workout_type: '',
    difficulty: 'intermediate',
    intensity: '',
    estimated_duration: 0,
    status: 'draft',
    isActive: true,
    isFeatured: false,
    isPublic: true,
    is_benchmark: false,
    ai_generated: false,
    sport_id: '',
    blocks: '',
    tags: '',
    scheduled_date: '',
    scaling_options: '',
    equipment_required: '',
    focus_areas: '',
    metrics_tracked: '',
    coach_notes: '',
    target_metrics: '',
    ai_parameters: '',
  })

  useEffect(() => {
    /**
  * Récupérer l'entraînement par son identifiant et renseigner les données du formulaire.
  * Les données du formulaire sont définies sur les valeurs par défaut si les données d'entraînement ne sont pas disponibles.
  * En cas d'erreur lors de la récupération de l'entraînement, un message d'erreur s'affiche.
  * Enfin, l'état de chargement est défini sur faux.
  */
    const fetchWorkout = async () => {
      // En mode création, ne pas charger de workout
      if (isNewMode) {
        setLoading(false)
        return
      }

      try {
        const data = await getWorkout(params.id)
        setWorkout(data)
        setFormData({
          name: data.name || '',
          description: data.description || '',
          workout_type: data.workout_type || '',
          difficulty: data.difficulty || 'intermediate',
          intensity: data.intensity || '',
          estimated_duration: data.estimated_duration || 0,
          status: data.status || 'draft',
          isActive: data.isActive !== undefined ? data.isActive : true,
          isFeatured: data.isFeatured || false,
          isPublic: data.isPublic !== undefined ? data.isPublic : true,
          is_benchmark: false,
          ai_generated: data.ai_generated || false,
          sport_id: data.sport_id || '',
          blocks: data.blocks ? JSON.stringify(data.blocks, null, 2) : '',
          tags: data.tags ? data.tags.join(', ') : '',
          scheduled_date: data.scheduled_date || '',
          scaling_options: '',
          equipment_required: '',
          focus_areas: '',
          metrics_tracked: '',
          coach_notes: '',
          target_metrics: '',
          ai_parameters: '',
        })
      } catch (error) {
        console.error('Erreur lors du chargement du workout', error)
        toast.error('Erreur lors du chargement du workout')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkout()
  }, [params.id, isNewMode])


  /**
   * Envoie le formulaire de création/modification d'entraînement à l'API.
   * Si la création/modification réussit, affiche un message de succès et redirige vers la page de la liste des entraînements.
   * Sinon, affiche un message d'erreur.
   * Enfin, défini l'état de chargement sur faux.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Helper pour parser JSON ou comma-separated values
      const parseJsonOrArray = (value: string) => {
        if (!value.trim()) return undefined
        try {
          return JSON.parse(value)
        } catch {
          return value.split(',').map(v => v.trim()).filter(Boolean)
        }
      }

      // Préparer les données: convertir les strings en objets/arrays
      const submitData: any = {
        name: formData.name,
        description: formData.description || undefined,
        workout_type: formData.workout_type || undefined,
        difficulty: formData.difficulty,
        intensity: formData.intensity || undefined,
        estimated_duration: formData.estimated_duration || undefined,
        status: formData.status,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
        isPublic: formData.isPublic,
        sport_id: formData.sport_id || undefined,
        scheduled_date: formData.scheduled_date || undefined,
        tags: parseJsonOrArray(formData.tags),
        blocks: formData.blocks ? JSON.parse(formData.blocks) : undefined,
      }

      if (isNewMode) {
        await createWorkout(submitData)
        toast.success('Workout créé avec succès')
      } else {
        await updateWorkout(params.id, submitData)
        toast.success('Workout mis à jour')
      }

      router.push('/admin/workouts')
    } catch (error) {
      console.error(error)
      toast.error(isNewMode ? 'Erreur lors de la création du workout' : 'Erreur lors de la mise à jour du workout')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="container mx-auto py-8">Loading...</div>

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{isNewMode ? 'Créer un Workout' : 'Modifier le Workout'}</CardTitle>
            <CardDescription>
              {isNewMode ? 'Créez un nouvel entraînement' : `Sport: ${workout?.name || 'N/A'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isNewMode && (
              <div className="mb-6 p-4 bg-primary/5 border border-primary/20 rounded-lg">
                <h3 className="text-sm font-medium mb-2">🤖 Génération IA</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Générez automatiquement un workout personnalisé avec l'IA
                </p>
                <Button type="button" variant="outline" className="w-full">
                  ✨ Générer un Workout avec l'IA
                </Button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
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

              <div className="space-y-4">
                <h3 className="text-lg font-semibold border-b pb-2">Détails avancés</h3>

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
                  <label className="text-sm font-medium">Tags (séparés par des virgules)</label>
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

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Enregistrement...' : isNewMode ? 'Créer' : 'Sauvegarder'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Annuler
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {workout?.exercises && workout.exercises.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Exercises ({workout.exercises.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workout.exercises.map((ex, idx) => (
                  <div key={ex.id} className="border-b pb-3 last:border-0">
                    <div className="font-medium">
                      {idx + 1}. {ex.exercise_name}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {ex.sets && <span className="mr-4">Sets: {ex.sets}</span>}
                      {ex.reps && <span className="mr-4">Reps: {ex.reps}</span>}
                      {ex.weight && <span className="mr-4">Weight: {ex.weight}</span>}
                      {ex.time && <span className="mr-4">Time: {ex.time}</span>}
                      {ex.distance && <span className="mr-4">Distance: {ex.distance}</span>}
                    </div>
                    {ex.specific_instructions && (
                      <div className="text-sm text-muted-foreground mt-1">
                        Note: {ex.specific_instructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
