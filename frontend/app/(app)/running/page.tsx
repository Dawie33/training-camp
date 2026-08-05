'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { formatDuration, formatPace, RUN_TYPE_LABELS, runningService, RunningSession, RunType } from '@/services/running'
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table'
import { motion } from 'framer-motion'
import { ArrowUpDown, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { RunningSessionDetailModal } from './_components/RunningSessionDetailModal'

const RUN_TYPES: RunType[] = ['easy', 'tempo', 'intervals', 'long_run', 'fartlek', 'recovery', 'race']

export default function RunningPage() {
  const [sessions, setSessions] = useState<RunningSession[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedSession, setSelectedSession] = useState<RunningSession | null>(null)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await runningService.getSessions({ limit: 200 })
      setSessions(data.rows)
    } catch {
      toast.error('Impossible de charger les séances')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Supprimer cette sortie ?')) return
    try {
      await runningService.delete(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      toast.success('Sortie supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }, [])

  const filtered = useMemo(() => sessions.filter(s => {
    if (typeFilter && s.run_type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const name = (s.ai_plan?.name ?? RUN_TYPE_LABELS[s.run_type]).toLowerCase()
      if (!name.includes(q)) return false
    }
    return true
  }), [sessions, typeFilter, search])

  const columns = useMemo<ColumnDef<RunningSession>[]>(() => [
    {
      id: 'name',
      header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="text-muted-foreground hover:text-foreground px-0">Sortie <ArrowUpDown className="ml-1 h-3 w-3" /></Button>,
      accessorFn: row => row.ai_plan?.name ?? RUN_TYPE_LABELS[row.run_type],
      cell: ({ getValue }) => <span className="font-medium text-foreground">{getValue() as string}</span>,
    },
    {
      accessorKey: 'session_date',
      header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="text-muted-foreground hover:text-foreground px-0">Date <ArrowUpDown className="ml-1 h-3 w-3" /></Button>,
      cell: ({ row }) => new Date(row.getValue('session_date')).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    {
      accessorKey: 'run_type',
      header: 'Type',
      cell: ({ row }) => <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">{RUN_TYPE_LABELS[row.getValue('run_type') as RunType]}</span>,
    },
    {
      accessorKey: 'distance_km',
      header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="text-muted-foreground hover:text-foreground px-0">Distance <ArrowUpDown className="ml-1 h-3 w-3" /></Button>,
      cell: ({ row }) => {
        const d = row.getValue('distance_km')
        return d != null ? `${Number(d).toFixed(1)} km` : '—'
      },
    },
    {
      accessorKey: 'duration_seconds',
      header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="text-muted-foreground hover:text-foreground px-0">Durée <ArrowUpDown className="ml-1 h-3 w-3" /></Button>,
      cell: ({ row }) => {
        const s = row.getValue('duration_seconds') as number | null
        return s ? <span className="font-mono text-primary">{formatDuration(s)}</span> : '—'
      },
    },
    {
      accessorKey: 'avg_pace_seconds_per_km',
      header: 'Allure',
      cell: ({ row }) => {
        const p = row.getValue('avg_pace_seconds_per_km') as number | null
        return p ? formatPace(p) : '—'
      },
    },
    {
      accessorKey: 'avg_heart_rate',
      header: 'FC moy.',
      cell: ({ row }) => {
        const hr = row.getValue('avg_heart_rate') as number | null
        return hr ? `${hr} bpm` : '—'
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={e => { e.stopPropagation(); handleDelete(row.original.id) }}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ], [handleDelete])

  const table = useReactTable({ data: filtered, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })

  if (!loading && sessions.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg px-4 py-10 text-center">
        <p className="text-muted-foreground mb-3 text-sm">Aucune sortie enregistrée</p>
        <Link href="/running/log" className="text-sm text-primary hover:underline underline-offset-2">
          Enregistrer ma première sortie
        </Link>
      </div>
    )
  }

  return (
    <>
      <motion.div className="space-y-4 pb-8" initial="hidden" animate="visible" variants={staggerContainer}>

        <motion.div variants={fadeInUp} className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-card border-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <button onClick={() => setTypeFilter('')} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${typeFilter === '' ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>Tous</button>
              {RUN_TYPES.map(type => (
                <button key={type} onClick={() => setTypeFilter(type)} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${typeFilter === type ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>
                  {RUN_TYPE_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{loading ? '...' : `${filtered.length} sortie${filtered.length !== 1 ? 's' : ''}`}</p>
        </motion.div>

        <motion.div variants={fadeInUp} className="rounded-lg border border-border bg-card overflow-hidden">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id} className="border-border hover:bg-transparent">
                  {hg.headers.map(h => (
                    <TableHead key={h.id} className="text-muted-foreground text-xs uppercase tracking-wide">
                      {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow className="border-border">
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto" />
                  </TableCell>
                </TableRow>
              ) : filtered.length === 0 ? (
                <TableRow className="border-border">
                  <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground text-sm">
                    Aucun résultat
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map(row => (
                  <TableRow
                    key={row.id}
                    className="border-border hover:bg-secondary/60 transition-colors cursor-pointer"
                    onClick={() => setSelectedSession(row.original)}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id} className="text-foreground text-sm py-2.5">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </motion.div>

      </motion.div>

      <RunningSessionDetailModal
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
      />
    </>
  )
}
