'use client'

import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"
import { motion } from "framer-motion"
import { ArrowUpDown, Edit, Plus, Search, Trash2, ZoomIn } from "lucide-react"
import Link from 'next/link'
import { useRouter } from 'next/navigation'
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
import { deleteEquipment, getEquipments } from '@/services/equipments'
import { Equipment } from '@/domain/entities/equipment'
import { fadeInUp, staggerContainer } from '@/lib/animations'
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
  const router = useRouter()
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
      accessorKey: "image_url",
      header: "Image",
      cell: ({ row }) => {
        const imageUrl = row.getValue("image_url") as string
        if (!imageUrl) return <div className="w-20 h-14 bg-white/10 rounded-xl flex items-center justify-center text-slate-500 text-xs">No img</div>

        return (
          <Dialog>
            <DialogTrigger asChild>
              <div
                className="relative w-20 h-14 group cursor-pointer overflow-hidden rounded-xl border border-white/20"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={imageUrl}
                  alt={row.getValue("label")}
                  className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <ZoomIn className="w-5 h-5 text-white drop-shadow-md" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-3xl p-0 overflow-hidden bg-transparent border-none shadow-none">
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={imageUrl}
                  alt={row.getValue("label")}
                  className="max-w-full max-h-[85vh] object-contain rounded-md shadow-2xl"
                />
              </div>
            </DialogContent>
          </Dialog>
        )
      },
    },
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
      cell: ({ row }) => <div className="font-medium text-base">{row.getValue("label")}</div>,
    },
    {
      accessorKey: "description",
      header: "Description",
      cell: ({ row }) => <div className="text-sm text-slate-400 truncate max-w-[800px]">{row.getValue("description") || "-"}</div>,
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
              <span className="bg-gradient-to-r from-orange-400 to-rose-400 bg-clip-text text-transparent">Équipements</span>
            </h1>
          </div>
          <Link href="/equipments/new">
            <Button className="bg-white/10 backdrop-blur border border-white/20 hover:bg-white/20 text-white">
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un équipement
            </Button>
          </Link>
        </motion.div>

        {/* Filters & Controls */}
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Rechercher un équipement..."
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
        <motion.div variants={fadeInUp} className="hidden md:block rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl overflow-hidden w-full">
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
              ) : equipments.length > 0 ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className="cursor-pointer border-white/10 hover:bg-white/10 transition-colors"
                    onClick={() => router.push(`/equipments/${row.original.id}`)}
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
                    Aucun équipement trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </motion.div>

        {/* Vue Mobile - Cards */}
        <motion.div variants={fadeInUp} className="md:hidden space-y-3 w-full">
          {loading ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-400"></div>
              </div>
            </div>
          ) : equipments.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 text-center text-slate-400">
              Aucun équipement trouvé
            </div>
          ) : (
            equipments.map((equipment) => (
              <motion.div
                key={equipment.id}
                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 space-y-3 cursor-pointer hover:bg-white/10 transition-all"
                onClick={() => router.push(`/equipments/${equipment.id}`)}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                {/* Header avec nom et actions */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {equipment.image_url && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <div
                            className="relative w-16 h-16 flex-shrink-0 cursor-pointer border border-white/20 rounded-xl overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <img
                              src={equipment.image_url}
                              alt={equipment.label}
                              className="object-cover w-full h-full"
                            />
                          </div>
                        </DialogTrigger>
                        <DialogContent className="max-w-md p-0 overflow-hidden bg-transparent border-none shadow-none">
                          <img
                            src={equipment.image_url}
                            alt={equipment.label}
                            className="w-full h-auto rounded-md"
                          />
                        </DialogContent>
                      </Dialog>
                    )}
                    <div>
                      <h3 className="font-semibold text-sm text-white">{equipment.label}</h3>
                      {equipment.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1">{equipment.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-white hover:bg-white/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/equipments/${equipment.id}`)
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(equipment.id, equipment.label)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}
