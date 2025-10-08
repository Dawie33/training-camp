'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { DailyWorkout } from '@/lib/api'
import { deleteWorkout, getWorkouts } from '@/lib/api/admin'
import { Edit, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'

/**
 * Page des entraînements
 * Cette page affiche la liste des entraînements, ainsi que des boutons pour supprimer et modifier un entraînement
 * @returns {JSX.Element} La page des entraînements
 */
export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<DailyWorkout[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [total, setTotal] = useState(0)


  const fetchWorkouts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getWorkouts({ limit: 100, search, status: status || undefined })
      setWorkouts(data.rows)
      setTotal(data.count)
    } catch (error) {
      console.error('Erreur lors du chargement des workouts', error)
      toast.error('Erreur lors du chargement des workouts')
    } finally {
      setLoading(false)
    }
  }, [search, status])

  useEffect(() => {
    fetchWorkouts()
  }, [fetchWorkouts])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer l'entraînement "${name || id}" ?`)) return

    try {
      await deleteWorkout(id)
      toast.success('Workout supprimé')
      await fetchWorkouts()
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la suppression du workout')
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workouts</h1>
          <p className="text-muted-foreground">Total: {total}</p>
        </div>
      </div>

      <div className="mb-6 flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search workouts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          className="px-3 py-2 border border-input bg-background rounded-md"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {workouts.map((workout) => (
            <Card key={workout.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle>{workout.name || 'Unnamed Workout'}</CardTitle>
                    <div className="text-sm text-muted-foreground mt-2 space-y-1">
                      <div className="flex gap-4 flex-wrap">
                        {workout.name && <span>Sport: {workout.name}</span>}
                        {workout.workout_type && <span>Type: {workout.workout_type}</span>}
                        {workout.difficulty && <span>Difficulty: {workout.difficulty}</span>}
                        {workout.intensity && <span>Intensity: {workout.intensity}</span>}
                        <span>Status: {workout.status}</span>
                      </div>
                      {workout.scheduled_date && (
                        <div>Scheduled: {new Date(workout.scheduled_date).toLocaleDateString()}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/workouts/${workout.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(workout.id, workout.name)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {workout.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{workout.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
