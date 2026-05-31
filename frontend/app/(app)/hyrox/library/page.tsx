'use client'

import { fadeInUp, staggerContainer } from '@/lib/animations'
import { hyroxService, HyroxSession, HyroxSessionType, HYROX_SESSION_TYPE_LABELS } from '@/services/hyrox'
import { motion } from 'framer-motion'
import { ArrowLeft, Search, Trophy } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { HyroxSessionCard } from '../_components/HyroxSessionCard'

const SESSION_TYPES: HyroxSessionType[] = ['full_simulation', 'station_prep', 'run_prep', 'mixed']

export default function HyroxLibraryPage() {
  const [sessions, setSessions] = useState<HyroxSession[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

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

  const handleDelete = async (id: string) => {
    try {
      await hyroxService.delete(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      toast.success('Séance supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      if (typeFilter && s.session_type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        const nameMatch = (s.ai_plan?.name ?? HYROX_SESSION_TYPE_LABELS[s.session_type]).toLowerCase().includes(q)
        if (!nameMatch) return false
      }
      return true
    })
  }, [sessions, typeFilter, search])

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
      initial="hidden" animate="visible" variants={staggerContainer}
    >
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <Link
            href="/hyrox"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-yellow-400 to-orange-400 bg-clip-text text-transparent">Bibliothèque</span>
            </h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {loading ? '...' : `${filtered.length} séance${filtered.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </motion.div>

        {/* Filtres */}
        <motion.div variants={fadeInUp} className="space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher une séance..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-yellow-500"
            />
          </div>
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setTypeFilter('')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                typeFilter === ''
                  ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              Tous
            </button>
            {SESSION_TYPES.map(type => (
              <button
                key={type}
                onClick={() => setTypeFilter(type)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  typeFilter === type
                    ? 'bg-yellow-500/20 border-yellow-500/40 text-yellow-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {HYROX_SESSION_TYPE_LABELS[type]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Liste */}
        <motion.div variants={fadeInUp} className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
              <Trophy className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">
                {sessions.length === 0 ? 'Aucune séance HYROX pour l\'instant' : 'Aucune séance ne correspond aux filtres'}
              </p>
            </div>
          ) : (
            filtered.map(session => (
              <HyroxSessionCard key={session.id} session={session} onDelete={handleDelete} />
            ))
          )}
        </motion.div>

      </div>
    </motion.div>
  )
}
