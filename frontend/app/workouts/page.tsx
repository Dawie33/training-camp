'use client'

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table"
import { ArrowUpDown, Edit, Eye, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"
import Link from 'next/link'
import * as React from "react"
import { useCallback, useEffect, useState } from 'react'

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { deleteWorkout, getWorkouts } from '@/lib/api/admin'
import { sportsService } from '@/lib/api/sports'
import type { AdminWorkout } from '@/lib/types/workout'
import { toast } from 'sonner'

const ITEMS_PER_PAGE = 10

export default function WorkoutsPage() {
  const [workouts, setWorkouts] = useState<AdminWorkout[]>([])
  const [sports, setSports] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Server-side pagination & sorting state
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = ITEMS_PER_PAGE
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [difficulty, setDifficulty] = useState<string>('')
  const [workoutType, setWorkoutType] = useState<string>('')
  const [selectedSportFilter, setSelectedSportFilter] = useState<string>('')
  const [orderBy, setOrderBy] = useState<string>("name")
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("asc")

  // Table state (client-side only for UI)
  const [sorting, setSorting] = React.useState<SortingState>([])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPageIndex(0)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Chargement des sports
  useEffect(() => {
    const fetchSports = async () => {
      try {
        const { rows: sportsData } = await sportsService.getAll()
        setSports(sportsData)
      } catch (error) {
        console.error('Erreur lors du chargement des sports', error)
        toast.error('Erreur lors du chargement des sports')
      }
    }
    fetchSports()
  }, [])

  // Chargement des workouts
  const fetchWorkouts = useCallback(async () => {
    setLoading(true)
    try {
      const params: Record<string, string | number | undefined> = {
        limit: pageSize,
        offset: pageIndex * pageSize,
        search: debouncedSearch || undefined,
        status: status || undefined,
        difficulty: difficulty || undefined,
        workout_type: workoutType || undefined,
        sport_id: selectedSportFilter || undefined,
        orderBy: orderBy,
        orderDir: orderDir
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
  }, [pageIndex, pageSize, debouncedSearch, status, difficulty, workoutType, selectedSportFilter, orderBy, orderDir])

  useEffect(() => {
    fetchWorkouts()
  }, [fetchWorkouts])

  // Sync sorting state with server
  useEffect(() => {
    if (sorting.length > 0) {
      const sort = sorting[0]
      setOrderBy(sort.id)
      setOrderDir(sort.desc ? "desc" : "asc")
      setPageIndex(0)
    }
  }, [sorting])

  const handleDelete = async (id: string, name?: string) => {
    if (!confirm(`Supprimer l'entraînement "${name}" ?`)) return

    try {
      await deleteWorkout(id)
      toast.success('Workout supprimé')
      fetchWorkouts()
    } catch (error) {
      console.error(error)
      toast.error('Erreur lors de la suppression du workout')
    }
  }

  // Define columns
  const columns: ColumnDef<AdminWorkout>[] = [
    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Nom
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "sport_id",
      header: "Sport",
      cell: ({ row }) => {
        const sportId = row.getValue("sport_id") as string
        const sport = sports.find(s => s.id === sportId)
        return <div className="capitalize">{sport?.name || '-'}</div>
      },
    },
    {
      accessorKey: "workout_type",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Type
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const type = row.getValue("workout_type") as string
        return <div className="capitalize">{type?.replace(/_/g, " ")}</div>
      },
    },
    {
      accessorKey: "difficulty",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Difficulté
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const difficulty = row.getValue("difficulty") as string
        const colors = {
          beginner: "text-green-600 bg-green-50 border-green-200",
          intermediate: "text-yellow-600 bg-yellow-50 border-yellow-200",
          advanced: "text-red-600 bg-red-50 border-red-200",
        }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[difficulty as keyof typeof colors] || ''}`}>
            {difficulty}
          </span>
        )
      },
    },
    {
      accessorKey: "intensity",
      header: "Intensité",
      cell: ({ row }) => {
        const intensity = row.getValue("intensity") as string
        return <div className="capitalize">{intensity}</div>
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = row.getValue("status") as string
        const colors = {
          draft: "text-gray-600 bg-gray-50 border-gray-200",
          published: "text-green-600 bg-green-50 border-green-200",
          archived: "text-orange-600 bg-orange-50 border-orange-200",
        }
        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[status as keyof typeof colors] || ''}`}>
            {status}
          </span>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const workout = row.original

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => navigator.clipboard.writeText(workout.id)}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Link href={`/workouts/${workout.id}`}>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(workout.id, workout.name)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
    },
  ]

  // Calculate page count
  const pageCount = Math.ceil(total / pageSize)

  const table = useReactTable({
    data: workouts,
    columns,
    pageCount: pageCount,
    state: {
      sorting,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
    manualSorting: true,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Workouts</h1>
          <p className="text-muted-foreground">Total: {total}</p>
        </div>
        <Link href="/workouts/generate-ai">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Workout
          </Button>
        </Link>
      </div>

      {/* Filters & Controls */}
      <div className="flex flex-col gap-4 mb-4">
        <div className="flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un workout..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedSportFilter} onValueChange={(value: string) => { setSelectedSportFilter(value === 'all' ? '' : value); setPageIndex(0) }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sport" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sports</SelectItem>
              {sports.map((sport) => (
                <SelectItem key={sport.id} value={sport.id}>
                  {sport.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={status} onValueChange={(value: string) => { setStatus(value === 'all' ? '' : value); setPageIndex(0) }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={difficulty} onValueChange={(value: string) => { setDifficulty(value === 'all' ? '' : value); setPageIndex(0) }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Difficulté" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Levels</SelectItem>
              <SelectItem value="beginner">Beginner</SelectItem>
              <SelectItem value="intermediate">Intermediate</SelectItem>
              <SelectItem value="advanced">Advanced</SelectItem>
            </SelectContent>
          </Select>

          <Select value={workoutType} onValueChange={(value: string) => { setWorkoutType(value === 'all' ? '' : value); setPageIndex(0) }}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="amrap">AMRAP</SelectItem>
              <SelectItem value="emom">EMOM</SelectItem>
              <SelectItem value="for_time">For Time</SelectItem>
              <SelectItem value="tabata">Tabata</SelectItem>
              <SelectItem value="chipper">Chipper</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
            disabled={pageIndex === 0}
          >
            Précédent
          </Button>
          <div className="text-sm font-medium">
            Page {pageIndex + 1} sur {pageCount || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex((prev) => Math.min(pageCount - 1, prev + 1))}
            disabled={pageIndex >= pageCount - 1}
          >
            Suivant
          </Button>
        </div>
      </div>

      {/* Vue Desktop - Table */}
      <div className="hidden md:block rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                </TableCell>
              </TableRow>
            ) : workouts.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => {
                    window.location.href = `/workout/${row.original.id}`
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      onClick={(e) => {
                        // Empêcher la navigation si on clique sur les actions
                        if (cell.column.id === 'actions') {
                          e.stopPropagation()
                        }
                      }}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Aucun workout trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Vue Mobile - Cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="bg-card border rounded-lg p-6 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        ) : workouts.length === 0 ? (
          <div className="bg-card border rounded-lg p-6 text-center text-muted-foreground">
            Aucun workout trouvé
          </div>
        ) : (
          workouts.map((workout) => {
            const sport = sports.find(s => s.id === workout.sport_id)
            const difficultyColors = {
              beginner: "bg-green-50 text-green-700 border-green-200",
              intermediate: "bg-yellow-50 text-yellow-700 border-yellow-200",
              advanced: "bg-red-50 text-red-700 border-red-200",
            }
            const statusColors = {
              draft: "bg-gray-50 text-gray-700 border-gray-200",
              published: "bg-green-50 text-green-700 border-green-200",
              archived: "bg-orange-50 text-orange-700 border-orange-200",
            }

            return (
              <div
                key={workout.id}
                className="bg-card border rounded-lg p-4 space-y-3 cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => {
                  window.location.href = `/workout/${workout.id}`
                }}
              >
                {/* Header avec nom et actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-1">{workout.name}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <Badge variant="outline" className="text-xs">
                        {sport?.name || 'N/A'}
                      </Badge>
                      <Badge variant={workout.workout_type === 'predefined' ? 'default' : 'secondary'} className="text-xs">
                        {workout.workout_type?.replace(/_/g, ' ') || 'N/A'}
                      </Badge>
                    </div>
                  </div>
                  <div
                    className="flex gap-1 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Link href={`/workout/${workout.id}`}>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleDelete(workout.id, workout.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Info grid */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Difficulté</p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${difficultyColors[workout.difficulty as keyof typeof difficultyColors] || ''}`}
                    >
                      {workout.difficulty}
                    </Badge>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Intensité</p>
                    <p className="text-sm font-medium capitalize">{workout.intensity || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Statut</p>
                    <Badge
                      variant="outline"
                      className={`text-xs ${statusColors[workout.status as keyof typeof statusColors] || ''}`}
                    >
                      {workout.status}
                    </Badge>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
