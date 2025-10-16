"use client"

import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table"
import { ArrowUpDown, Edit, MoreHorizontal, Plus, Search, Trash2 } from "lucide-react"
import * as React from "react"

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { deleteExercise, getExercises } from "@/lib/api/admin"
import { Exercise } from "@/lib/types/exercice"
import Link from "next/link"
import { useEffect, useState } from "react"
import { toast } from "sonner"


export default function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Pagination
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = 10
  const [searchQuery, setSearchQuery] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [orderBy, setOrderBy] = useState<string>("name")
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("asc")

  // Table state
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPageIndex(0) // Reset to first page on search
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load exercises from API with server-side params
  const loadExercises = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getExercises({
        limit: 10,
        offset: pageIndex * pageSize,
        search: debouncedSearch || undefined,
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
  }, [pageIndex, pageSize, debouncedSearch, orderBy, orderDir])

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
          beginner: "text-green-600 bg-green-50 border-green-200",
          intermediate: "text-yellow-600 bg-yellow-50 border-yellow-200",
          advanced: "text-red-600 bg-red-50 border-red-200",
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
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-200">
            Active
          </span>
        ) : (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-700 border border-gray-200">
            Inactive
          </span>
        )
      },
    },
    {
      id: "actions",
      enableHiding: false,
      cell: ({ row }) => {
        const exercise = row.original

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
                onClick={() => navigator.clipboard.writeText(exercise.id)}
              >
                Copy ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <Link href={`/admin/exercises/${exercise.id}`}>
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
              </Link>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => handleDelete(exercise.id, exercise.name)}
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
    data: exercises,
    columns,
    pageCount: pageCount,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: {
        pageIndex,
        pageSize,
      },
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true, // Server-side pagination
    manualSorting: true, // Server-side sorting
    // Disable client-side filtering since we use server-side search
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })
  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Exercises</h1>
        </div>
        <Link href="/admin/exercises/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Exercise
          </Button>
        </Link>
      </div>

      {/* Filters & Controls */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search exercises by name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageIndex((prev) => Math.max(0, prev - 1))}
            disabled={pageIndex === 0}
          >
            Précédent
          </Button>
          <div className="flex items-center gap-1">
            <div className="text-sm font-medium">
              Page {pageIndex + 1} à {pageCount || 1}
            </div>
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

      {/* Table */}
      <div className="rounded-md border">
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
            ) : exercises.length > 0 ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  No exercises found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>


    </div>
  )
}
