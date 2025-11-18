'use client'

import { ArrowUpDown, Edit, Plus, Search, Trash2 } from "lucide-react"
import Link from 'next/link'
import React, { useCallback, useEffect, useState } from 'react'

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
import { deleteEquipment, getEquipments } from '@/lib/api/equipments'
import { Equipment } from '@/lib/types/equipment'
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable
} from "@tanstack/react-table"
import { toast } from 'sonner'

const ITEMS_PER_PAGE = 10

export default function EquipmentsPage() {
  const [equipments, setEquipments] = useState<Equipment[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  // Server-side pagination & sorting state
  const [pageIndex, setPageIndex] = useState(0)
  const pageSize = ITEMS_PER_PAGE
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [orderBy, setOrderBy] = useState<string>("label")
  const [orderDir, setOrderDir] = useState<"asc" | "desc">("asc")

  // Table state (client-side only for UI)
  const [sorting, setSorting] = React.useState<SortingState>([])

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery)
      setPageIndex(0) // Reset to first page on search
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Load equipments from API with server-side params
  const fetchEquipments = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getEquipments({
        limit: pageSize,
        offset: pageIndex * pageSize,
        search: debouncedSearch || undefined,
        orderBy: orderBy,
        orderDir: orderDir
      })
      setEquipments(data.rows)
      setTotal(data.count)
    } catch {
      toast.error('Erreur lors du chargement des équipements')
    } finally {
      setLoading(false)
    }
  }, [pageIndex, pageSize, debouncedSearch, orderBy, orderDir])

  useEffect(() => {
    fetchEquipments()
  }, [fetchEquipments])

  // Sync sorting state with server
  useEffect(() => {
    if (sorting.length > 0) {
      const sort = sorting[0]
      setOrderBy(sort.id)
      setOrderDir(sort.desc ? "desc" : 'asc')
      setPageIndex(0) // Reset to first page on sort change
    }
  }, [sorting])

  const handleDelete = async (id: string, label: string) => {
    if (!confirm(`Supprimer l'équipement "${label}" ?`)) return

    try {
      await deleteEquipment(id)
      toast.success('Équipement supprimé')
      fetchEquipments()
    } catch {
      toast.error('Erreur lors de la suppression de l\'équipement')
    }
  }

  // Define columns
  const columns: ColumnDef<Equipment>[] = [
    {
      accessorKey: "label",
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
      cell: ({ row }) => <div className="font-medium">{row.getValue("label")}</div>,
    },
    {
      id: "actions",
      header: () => <div className="text-right">Actions</div>,
      enableHiding: false,
      cell: ({ row }) => {
        const equipment = row.original

        return (
          <div className="flex items-center justify-end gap-2">
            <Link href={`/equipments/${equipment.id}`}>
              <Button variant="outline" size="sm">
                <Edit className="mr-2 h-4 w-4" />

              </Button>
            </Link>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleDelete(equipment.id, equipment.label)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />

            </Button>
          </div>
        )
      },
    },
  ]

  // Calculate page count
  const pageCount = Math.ceil(total / pageSize)

  const table = useReactTable({
    data: equipments,
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
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="w-140 flex-initial">
          <h1 className="text-3xl font-bold">Équipements</h1>
        </div>
        <Link href="/equipments/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un équipement
          </Button>
        </Link>
      </div>

      {/* Filters & Controls */}
      <div className="flex items-center gap-30 mb-4">
        <div className="relative w-96">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un équipement..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 max-w-sm"
          />
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-end space-x-2 py-4 ">
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
              Page {pageIndex + 1} sur {pageCount || 1}
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

      {/* Vue Desktop - Table */}
      <div className="hidden md:block rounded-md border max-w-3xl">
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
            ) : equipments.length > 0 ? (
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
                  Aucun équipement trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Vue Mobile - Cards */}
      <div className="md:hidden space-y-3 max-w-3xl">
        {loading ? (
          <div className="bg-card border rounded-lg p-6 text-center">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </div>
        ) : equipments.length === 0 ? (
          <div className="bg-card border rounded-lg p-6 text-center text-muted-foreground">
            Aucun équipement trouvé
          </div>
        ) : (
          equipments.map((equipment) => (
            <div
              key={equipment.id}
              className="bg-card border rounded-lg p-4 space-y-3"
            >
              {/* Header avec nom et actions */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm">{equipment.label}</h3>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <Link href={`/equipments/${equipment.id}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Edit className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => handleDelete(equipment.id, equipment.label)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
