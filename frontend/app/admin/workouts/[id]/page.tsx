'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { AdminWorkout, getWorkout, updateWorkout } from '@/lib/api/admin'
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
  const [loading, setLoading] = useState(true)
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
    blocks: '',
    tags: '',
    schedule_date: '',
  })

  useEffect(() => {
    /**
  * Récupérer l'entraînement par son identifiant et renseigner les données du formulaire.
  * Les données du formulaire sont définies sur les valeurs par défaut si les données d'entraînement ne sont pas disponibles.
  * En cas d'erreur lors de la récupération de l'entraînement, un message d'erreur s'affiche.
  * Enfin, l'état de chargement est défini sur faux.
  */
    const fetchWorkout = async () => {
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
          blocks: '',
          tags: '',
          schedule_date: data.scheduled_date || '',
        })
      } catch (error) {
        console.error('Erreur lors du chargement du workout', error)
        toast.error('Erreur lors du chargement du workout')
      } finally {
        setLoading(false)
      }
    }

    fetchWorkout()
  }, [params.id])


  /**
   * Envoie le formulaire de modification d'entraînement à l'API.
   * Si la modification réussit, affiche un message de succès et redirige vers la page de la liste des entraînements.
   * Sinon, affiche un message d'erreur.
   * Enfin, défini l'état de chargement sur faux.
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      await updateWorkout(params.id, formData)
      toast.success('Workout updated')
      router.push('/admin/workouts')
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la mise à jour du workout')
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
            <CardTitle>Edit Workout</CardTitle>
            <CardDescription>Sport: {workout?.name || 'N/A'}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Name</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
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
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="submit" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
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
