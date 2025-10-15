'use client'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { deleteWorkout, getWorkouts } from '@/lib/api/admin'
import { sportsService } from '@/lib/api/sports'
import type { AdminWorkout } from '@/lib/types/workout'
import { Edit, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
/**
 * Page des entraînements
 * Cette page affiche la liste des entraînements, ainsi que des boutons pour supprimer et modifier un entraînement
 * @returns {JSX.Element} La page des entraînements
 */
export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<AdminWorkout[]>([])
  const [sports, setSports] = useState<{ id: string; name: string }[]>([])
  const [selectedSport, setSelectedSport] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [total, setTotal] = useState(0)

  // Chargement des sports
  const fetchSports = useCallback(async () => {
    try {
      const { rows: sports } = await sportsService.getAll()
      setSports(sports)
      setSelectedSport(sports[0]?.id)
    } catch (error) {
      console.error('Erreur lors du chargement des sports', error)
      toast.error('Erreur lors du chargement des sports')
    }
  }, [])

  // Chargement des workouts en fonction du sport sélectionné
  const fetchWorkouts = useCallback(async () => {
    setLoading(true)
    try {
      // Construire les paramètres de requête en excluant les valeurs vides
      const params: Record<string, string | number | undefined> = {
        limit: 100,
        search: search || undefined,
        status: status || undefined,
        sport_id: selectedSport || undefined,
      }

      const data = await getWorkouts(params)
      setWorkouts(data.rows)
      setTotal(data.count)
    } catch (error) {
      console.error('Erreur lors du chargement des workouts', error)
      toast.error('Erreur lors du chargement des workouts')
    } finally {
      setLoading(false)
    }
  }, [search, status, selectedSport])

  useEffect(() => {
    fetchSports()
  }, [fetchSports])

  useEffect(() => {
    fetchWorkouts()
  }, [fetchWorkouts])

  const handleDelete = async (id: string, name?: string) => {
    if (!confirm(`Supprimer l'entraînement "${name}" ?`)) return

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
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Equipments</h1>
          <p className="text-muted-foreground">Total: {total}</p>
        </div>
        <Link href="/admin/workouts/new">
          <Button className='hover:bg-red-500 hover:text-white'>
            <Plus className="mr-2 h-4 w-4" />
            New Workout
          </Button>
        </Link>
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
        <>
          <div >
            {sports.length > 0 && (
              <div className="grid grid-cols-5 gap-4 mb-4 cursor-pointer">
                {sports.map((sport) => (
                  <Card
                    key={sport.id}
                    onClick={() => setSelectedSport(sport.id === selectedSport ? null : sport.id)}
                    className={`cursor-pointer transition-transform hover:bg-black hover:text-white hover:scale-105 ${sport.id === selectedSport ? 'border-primary shadow-lg' : ''
                      }`}
                  >
                    <div className="flex justify-center items-center py-6 font-medium">
                      {sport.name}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableCell colSpan={7}>Total</TableCell>
                <TableCell className="text-right">{total}</TableCell>
              </TableRow>
              <TableRow>
                <TableHead className="w-[150px]">Nom</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Difficulté</TableHead>
                <TableHead>Intensité</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead >Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workouts.map((workout) => (
                <TableRow key={workout.id}>
                  <TableCell className="font-medium">{workout.name}</TableCell>
                  <TableCell className="font-medium">{workout.workout_type}</TableCell>
                  <TableCell className="font-medium">{workout.difficulty}</TableCell>
                  <TableCell className="font-medium">{workout.intensity}</TableCell>
                  <TableCell className="font-medium">{workout.status}</TableCell>
                  <TableCell className="font-medium"> {workout.scheduled_date && (
                    <div>{new Date(workout.scheduled_date).toLocaleDateString()}</div>
                  )}</TableCell>
                  <TableCell className="font-medium">{workout.description}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Link href={`/admin/workouts/${workout.id}`}>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(workout.id, workout?.name)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>

                </TableRow>
              ))}
            </TableBody>
            <TableFooter>

            </TableFooter>
          </Table>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(payment.id)}
              >
                Copy payment ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem>View customer</DropdownMenuItem>
              <DropdownMenuItem>View payment details</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </>
      )}
    </div>
  )
}
