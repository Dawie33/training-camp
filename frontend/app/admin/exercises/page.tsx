'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { deleteExercise, getExercises } from '@/lib/api/admin'
import { Edit, Plus, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export default function ExercisesPage() {
  const [exercises, setExercises] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [total, setTotal] = useState(0)

  const loadExercises = async () => {
    setLoading(true)
    try {
      const data = await getExercises({ limit: 100, search })
      setExercises(data.rows)
      setTotal(data.count)
    } catch (error) {
      toast.error('Failed to load exercises')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadExercises()
  }, [search])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete exercise "${name}"?`)) return

    try {
      await deleteExercise(id)
      toast.success('Exercise deleted')
      loadExercises()
    } catch (error) {
      toast.error('Failed to delete exercise')
    }
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Exercises</h1>
          <p className="text-muted-foreground">Total: {total}</p>
        </div>
        <Link href="/admin/exercises/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Exercise
          </Button>
        </Link>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid gap-4">
          {exercises.map((exercise) => (
            <Card key={exercise.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{exercise.name}</CardTitle>
                    <div className="text-sm text-muted-foreground mt-1">
                      <span className="mr-4">Category: {exercise.category}</span>
                      <span className="mr-4">Difficulty: {exercise.difficulty}</span>
                      <span>Type: {exercise.measurement_type}</span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Link href={`/admin/exercises/${exercise.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(exercise.id, exercise.name)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {exercise.description && (
                <CardContent>
                  <p className="text-sm text-muted-foreground">{exercise.description}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
