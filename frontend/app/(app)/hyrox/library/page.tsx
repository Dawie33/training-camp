'use client'

import { Button } from '@/components/ui/button'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import { formatTime, hyroxService, HyroxSession, HyroxSessionType, HYROX_SESSION_TYPE_LABELS } from '@/services/hyrox'
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table'
import { motion } from 'framer-motion'
import { ArrowUpDown, Search, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'

const SESSION_TYPES: HyroxSessionType[] = ['full_simulation', 'station_prep', 'run_prep', 'mixed']

export default function HyroxLibraryPage() {
  const [sessions, setSessions] = useState<HyroxSession[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await hyroxService.getSessions({ limit: 200 })
      setSessions(data.rows)
    } catch {
      toast.error('Impossible de charger les séances')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchSessions() }, [fetchSessions])

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Supprimer cette séance ?')) return
    try {
      await hyroxService.delete(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      toast.success('Séance supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }, [])

  const filtered = useMemo(() => sessions.filter(s => {
    if (typeFilter && s.session_type !== typeFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const name = (s.ai_plan?.name ?? HYROX_SESSION_TYPE_LABELS[s.session_type]).toLowerCase()
      if (!name.includes(q)) return false
    }
    return true
  }), [sessions, typeFilter, search])

  const columns = useMemo<ColumnDef<HyroxSession>[]>(() => [
    {
      id: 'name',
      header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="text-slate-400 hover:text-white px-0">Séance <ArrowUpDown className="ml-1 h-3 w-3" /></Button>,
      accessorFn: row => row.ai_plan?.name ?? HYROX_SESSION_TYPE_LABELS[row.session_type],
      cell: ({ getValue }) => <span className="font-medium text-white">{getValue() as string}</span>,
    },
    {
      accessorKey: 'session_date',
      header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="text-slate-400 hover:text-white px-0">Date <ArrowUpDown className="ml-1 h-3 w-3" /></Button>,
      cell: ({ row }) => new Date(row.getValue('session_date')).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    {
      accessorKey: 'session_type',
      header: 'Type',
      cell: ({ row }) => <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-500/15 text-yellow-400">{HYROX_SESSION_TYPE_LABELS[row.getValue('session_type') as HyroxSessionType]}</span>,
    },
    {
      accessorKey: 'total_time_seconds',
      header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="text-slate-400 hover:text-white px-0">Temps total <ArrowUpDown className="ml-1 h-3 w-3" /></Button>,
      cell: ({ row }) => {
        const secs = row.getValue('total_time_seconds') as number | null
        return secs ? <span className="font-mono text-yellow-400">{formatTime(secs)}</span> : '—'
      },
    },
    {
      accessorKey: 'perceived_effort',
      header: 'RPE',
      cell: ({ row }) => row.getValue('perceived_effort') ? `${row.getValue('perceived_effort')}/10` : '—',
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-500 hover:text-red-400 hover:bg-red-500/10" onClick={() => handleDelete(row.original.id)}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ], [handleDelete])

  const table = useReactTable({ data: filtered, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })

  return (
    <motion.div className="space-y-4 pb-8" initial="hidden" animate="visible" variants={staggerContainer}>

      <motion.div variants={fadeInUp} className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-yellow-500"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button onClick={() => setTypeFilter('')} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${typeFilter === '' ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>Tous</button>
            {SESSION_TYPES.map(type => (
              <button key={type} onClick={() => setTypeFilter(type)} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${typeFilter === type ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400' : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'}`}>
                {HYROX_SESSION_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-slate-500">{loading ? '...' : `${filtered.length} séance${filtered.length !== 1 ? 's' : ''}`}</p>
      </motion.div>

      <motion.div variants={fadeInUp} className="rounded-xl border border-slate-700/50 bg-slate-800/40 overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id} className="border-slate-700/50 hover:bg-transparent">
                {hg.headers.map(h => (
                  <TableHead key={h.id} className="text-slate-400 text-xs uppercase tracking-wide">
                    {h.isPlaceholder ? null : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow className="border-slate-700/50">
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-yellow-400 mx-auto" />
                </TableCell>
              </TableRow>
            ) : filtered.length === 0 ? (
              <TableRow className="border-slate-700/50">
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500 text-sm">
                  {sessions.length === 0 ? 'Aucune séance HYROX pour l\'instant' : 'Aucun résultat'}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} className="border-slate-700/40 hover:bg-slate-700/30 transition-colors">
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="text-slate-300 text-sm py-2.5">
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
  )
}
