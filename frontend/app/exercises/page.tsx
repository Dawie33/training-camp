"use client"

import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table"
import { motion } from "framer-motion"
import { ArrowUpDown, Edit, Plus, Search, Trash2 } from "lucide-react"
import * as React from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { deleteExercise, getExercises } from "@/services/exercices"
import { Exercise } from "@/domain/entities/exercice"
import { fadeInUp, staggerContainer } from "@/lib/animations"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"


export default function ExercisesPage() {
  const router = useRouter()
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Pagination
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = 10
  const [searchQuery, setSearchQuery] = useState("")
  const [orderBy, setOrderBy] = useState<string>("name")
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("asc")

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([])


  // Load exercises from API with server-side params
  const loadExercises = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getExercises({
        limit: 10,
        offset: pageIndex * pageSize,
        search: searchQuery || undefined,
        orderBy: orderBy,
        orderDir: orderDir,
      })
      setExercises(data.rows)
      setTotal(data.count)
    } catch {
      toast.error("Failed to load exercises")
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize, searchQuery, orderBy, orderDir])

  useEffect(() => {
    loadExercises()
  }, [loadExercises])

  // Sync sorting state with server
  useEffect(() => {
    if (sorting.length > 0) {
      const sort = sorting[0]
      setOrderBy(sort.id)
      setOrderDir(sort.desc ? "desc" : "asc")
      setPageIndex(0) // Reset to first page on sort change
    }
  }, [sorting])

  /**
   * Delete an exercise by id
   * @param {string} id - The ID of the exercise to delete
   * @param {string} name - The name of the exercise to delete
   */
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete exercise "${name}"?`)) return

    try {
      await deleteExercise(id)
      toast.success("Exercise deleted")
      loadExercises()
    } catch {
      toast.error("Failed to delete exercise")
    }
  }

  // Definition des colonnes
  const columns: ColumnDef<Exercise>[] = [

    {
      accessorKey: "name",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Name
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
      accessorKey: "category",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Category
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const category = row.getValue("category") as string
        return (
          <div className="capitalize">
            {category.replace(/_/g, " ")}
          </div>
        )
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
            Difficulty
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        const difficulty = row.getValue("difficulty") as string | undefined
        if (!difficulty) return <span className="text-muted-foreground">-</span>

        const colors = {
          beginner: "text-emerald-400 bg-emerald-500/20 border-emerald-500/30",
          intermediate: "text-yellow-400 bg-yellow-500/20 border-yellow-500/30",
          advanced: "text-red-400 bg-red-500/20 border-red-500/30",
        }

        return (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[difficulty as keyof typeof colors]}`}>
            {difficulty}
          </span>
        )
      },
    },
    {
      accessorKey: "measurement_type",
      header: "Measurement",
      cell: ({ row }) => {
        const type = row.getValue("measurement_type") as string | undefined
        return type ? (
          <div className="capitalize">{type}</div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "bodyweight_only",
      header: "Bodyweight",
      cell: ({ row }) => {
        const bodyweight = row.getValue("bodyweight_only")
        return bodyweight ? (
          <span className="text-green-600">✓</span>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      },
    },
    {
      accessorKey: "isActive",
      header: "Status",
      cell: ({ row }) => {
        const isActive = row.getValue("isActive")
        return isActive ? (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-500/20 text-slate-400 border border-slate-500/30">
            Inactive
          </span>
        )
      },
    },
  ]

  // Calculate page count
  const pageCount = Math.ceil(total / pageSize)

  const table = useReactTable({
    data: exercises,
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
    manualPagination: true, // Server-side pagination
    manualSorting: true, // Server-side sorting
    // Disable client-side filtering since we use server-side search
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })
  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
      initial="hidden"
      animate="visible"
      variants={staggerContainer}
    >
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header */}
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold">
              <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">Exercises</span>
            </h1>
          </div>
          <Link href="/exercises/new">
            <Button className="bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un exercice
            </Button>
          </Link>
        </motion.div>

        {/* Filters & Controls */}
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 w-full sm:max-w-sm">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher un exercice..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-white/30"
            />
          </div>
          {/* Pagination */}
          <div className="flex items-center justify-end space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
              disabled={pageIndex === 0}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
            >
              Précédent
            </Button>
            <div className="text-sm font-medium text-slate-300">
              Page {pageIndex + 1} sur {pageCount || 1}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageIndex((prev) => Math.min(pageCount - 1, prev + 1))}
              disabled={pageIndex >= pageCount - 1}
              className="bg-white/5 border-white/10 text-white hover:bg-white/10 disabled:opacity-50"
            >
              Suivant
            </Button>
          </div>
        </motion.div>

        {/* Vue Desktop - Table */}
        <motion.div variants={fadeInUp} className="hidden md:block rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="border-white/10 hover:bg-white/5">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id} className="text-slate-300">
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
                <TableRow className="border-white/10">
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : exercises.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer border-white/10 hover:bg-white/10 transition-colors"
                    onClick={() => router.push(`/exercises/${row.original.id}`)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="text-slate-200">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-white/10">
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-slate-400"
                  >
                    Aucun exercice trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </motion.div>

        {/* Vue Mobile - Cards */}
        <motion.div variants={fadeInUp} className="md:hidden space-y-3">
          {loading ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
              </div>
            </div>
          ) : exercises.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center text-slate-400">
              Aucun exercice trouvé
            </div>
          ) : (
            exercises.map((exercise) => {
              const difficultyColors = {
                beginner: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
                intermediate: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
                advanced: "bg-red-500/20 text-red-400 border-red-500/30",
              }

              return (
                <motion.div
                  key={exercise.id}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                >
                  {/* Header avec nom et actions */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm line-clamp-1 text-white">{exercise.name}</h3>
                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <Badge className="text-xs capitalize bg-white/10 text-slate-300 border-white/20">
                          {exercise.category?.replace(/_/g, ' ')}
                        </Badge>
                        {exercise.difficulty && (
                          <Badge
                            variant="outline"
                            className={`text-xs ${difficultyColors[exercise.difficulty as keyof typeof difficultyColors] || ''}`}
                          >
                            {exercise.difficulty}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <Link href={`/exercises/${exercise.id}`}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10">
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                        onClick={() => handleDelete(exercise.id, exercise.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Info grid */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10">
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Type</p>
                      <p className="text-sm font-medium capitalize text-slate-200">
                        {exercise.measurement_type || '-'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Bodyweight</p>
                      <p className="text-sm font-medium text-slate-200">
                        {exercise.bodyweight_only ? '✓' : '-'}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-slate-500">Status</p>
                      <Badge
                        className={`text-xs ${exercise.isActive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}
                      >
                        {exercise.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              )
            })
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
