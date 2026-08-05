'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { fadeInUp, staggerContainer } from '@/lib/animations'
import {
  BODY_FOCUS_LABELS,
  BodyFocus,
  MUSCLE_LABELS,
  SESSION_GOAL_LABELS,
  SessionGoal,
  strengthService,
  StrengthSession,
} from '@/services/strength'
import { ColumnDef, flexRender, getCoreRowModel, getSortedRowModel, SortingState, useReactTable } from '@tanstack/react-table'
import { motion } from 'framer-motion'
import { ArrowUpDown, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { StrengthSessionDetailModal } from './_components/StrengthSessionDetailModal'

const GOALS: SessionGoal[] = ['strength', 'hypertrophy', 'endurance', 'power']
const BODY_FOCUSES: BodyFocus[] = ['upper_body', 'lower_body', 'full_body']

export default function ForcePage() {
  const [sessions, setSessions] = useState<StrengthSession[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [goalFilter, setGoalFilter] = useState('')
  const [bodyFocusFilter, setBodyFocusFilter] = useState('')
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedSession, setSelectedSession] = useState<StrengthSession | null>(null)

  const fetchSessions = useCallback(async () => {
    setLoading(true)
    try {
      const data = await strengthService.getSessions({ limit: 200 })
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
      await strengthService.delete(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      toast.success('Séance supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }, [])

  const handleSessionUpdate = useCallback((updated: StrengthSession) => {
    setSessions(prev => prev.map(s => s.id === updated.id ? updated : s))
    setSelectedSession(updated)
  }, [])

  const filtered = useMemo(() => sessions.filter(s => {
    if (goalFilter && s.session_goal !== goalFilter) return false
    if (bodyFocusFilter && s.body_focus !== bodyFocusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const name = (s.ai_plan?.session_name ?? '').toLowerCase()
      const muscles = s.target_muscles.some(m => (MUSCLE_LABELS[m as keyof typeof MUSCLE_LABELS] ?? m).toLowerCase().includes(q))
      if (!name.includes(q) && !muscles) return false
    }
    return true
  }), [sessions, goalFilter, bodyFocusFilter, search])

  const columns = useMemo<ColumnDef<StrengthSession>[]>(() => [
    {
      id: 'name',
      header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="text-muted-foreground hover:text-foreground px-0">Séance <ArrowUpDown className="ml-1 h-3 w-3" /></Button>,
      accessorFn: row => row.ai_plan?.session_name ?? 'Séance de force',
      cell: ({ getValue }) => <span className="font-medium text-foreground">{getValue() as string}</span>,
    },
    {
      accessorKey: 'session_date',
      header: ({ column }) => <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')} className="text-muted-foreground hover:text-foreground px-0">Date <ArrowUpDown className="ml-1 h-3 w-3" /></Button>,
      cell: ({ row }) => new Date(row.getValue('session_date')).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }),
    },
    {
      accessorKey: 'session_goal',
      header: 'Objectif',
      cell: ({ row }) => {
        const goal = row.getValue('session_goal') as SessionGoal
        return <span className="px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary">{SESSION_GOAL_LABELS[goal]}</span>
      },
    },
    {
      id: 'muscles',
      header: 'Muscles',
      accessorFn: row => row.target_muscles.slice(0, 2).map(m => MUSCLE_LABELS[m as keyof typeof MUSCLE_LABELS] ?? m).join(', '),
      cell: ({ getValue }) => <span className="text-muted-foreground text-sm">{getValue() as string || '—'}</span>,
    },
    {
      accessorKey: 'duration_minutes',
      header: 'Durée',
      cell: ({ row }) => row.getValue('duration_minutes') ? `${row.getValue('duration_minutes')} min` : '—',
    },
    {
      accessorKey: 'perceived_effort',
      header: 'RPE',
      cell: ({ row }) => row.getValue('perceived_effort') ? `${row.getValue('perceived_effort')}/10` : '—',
    },
    {
      id: 'actions',
      cell: ({ row }) => (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          onClick={e => { e.stopPropagation(); handleDelete(row.original.id) }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      ),
    },
  ], [handleDelete])

  const table = useReactTable({ data: filtered, columns, state: { sorting }, onSortingChange: setSorting, getCoreRowModel: getCoreRowModel(), getSortedRowModel: getSortedRowModel() })

  if (!loading && sessions.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg px-4 py-10 text-center">
        <p className="text-muted-foreground mb-3 text-sm">Aucune séance enregistrée</p>
        <Link href="/force/log" className="text-sm text-primary hover:underline underline-offset-2">
          Enregistrer ma première séance
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
            <button onClick={() => setGoalFilter('')} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${goalFilter === '' ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>Tous</button>
            {GOALS.map(goal => (
              <button key={goal} onClick={() => setGoalFilter(goal)} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${goalFilter === goal ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>
                {SESSION_GOAL_LABELS[goal]}
              </button>
            ))}
          </div>
        </div>
        <div className="flex gap-1.5 flex-wrap">
          <button onClick={() => setBodyFocusFilter('')} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${bodyFocusFilter === '' ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>Tous</button>
          {BODY_FOCUSES.map(focus => (
            <button key={focus} onClick={() => setBodyFocusFilter(focus)} className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${bodyFocusFilter === focus ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border text-muted-foreground hover:text-foreground'}`}>
              {BODY_FOCUS_LABELS[focus]}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">{loading ? '...' : `${filtered.length} séance${filtered.length !== 1 ? 's' : ''}`}</p>
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

    <StrengthSessionDetailModal
      session={selectedSession}
      onClose={() => setSelectedSession(null)}
      onUpdate={handleSessionUpdate}
    />
    </>
  )
}
