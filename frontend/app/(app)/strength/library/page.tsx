'use client'

import { fadeInUp, staggerContainer } from '@/lib/animations'
import { MUSCLE_GROUPS, MUSCLE_LABELS, SESSION_GOAL_LABELS, SessionGoal, strengthService, StrengthSession } from '@/services/strength'
import { motion } from 'framer-motion'
import { ArrowLeft, Dumbbell, Search } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { StrengthSessionCard } from '../_components/StrengthSessionCard'

const GOALS: SessionGoal[] = ['strength', 'hypertrophy', 'endurance', 'power']

export default function StrengthLibraryPage() {
  const [sessions, setSessions] = useState<StrengthSession[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [goalFilter, setGoalFilter] = useState('')
  const [muscleFilter, setMuscleFilter] = useState('')

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

  const handleDelete = async (id: string) => {
    try {
      await strengthService.delete(id)
      setSessions(prev => prev.filter(s => s.id !== id))
      toast.success('Séance supprimée')
    } catch {
      toast.error('Erreur lors de la suppression')
    }
  }

  const filtered = useMemo(() => {
    return sessions.filter(s => {
      if (goalFilter && s.session_goal !== goalFilter) return false
      if (muscleFilter && !s.target_muscles.includes(muscleFilter)) return false
      if (search) {
        const q = search.toLowerCase()
        const nameMatch = (s.ai_plan?.session_name ?? '').toLowerCase().includes(q)
        const muscleMatch = s.target_muscles.some(m => MUSCLE_LABELS[m as keyof typeof MUSCLE_LABELS]?.toLowerCase().includes(q))
        if (!nameMatch && !muscleMatch) return false
      }
      return true
    })
  }, [sessions, goalFilter, muscleFilter, search])

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
      initial="hidden" animate="visible" variants={staggerContainer}
    >
      <div className="p-4 sm:p-6 lg:p-8 space-y-6">

        {/* Header */}
        <motion.div variants={fadeInUp} className="flex items-center gap-3">
          <Link
            href="/strength"
            className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">Bibliothèque</span>
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
              placeholder="Rechercher par nom ou muscle..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500"
            />
          </div>

          {/* Filtre objectif */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setGoalFilter('')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                goalFilter === ''
                  ? 'bg-violet-500/20 border-violet-500/40 text-violet-400'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              Tous
            </button>
            {GOALS.map(goal => (
              <button
                key={goal}
                onClick={() => setGoalFilter(goal)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  goalFilter === goal
                    ? 'bg-violet-500/20 border-violet-500/40 text-violet-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {SESSION_GOAL_LABELS[goal]}
              </button>
            ))}
          </div>

          {/* Filtre muscle */}
          <div className="flex gap-1.5 flex-wrap">
            <button
              onClick={() => setMuscleFilter('')}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                muscleFilter === ''
                  ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                  : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              Tous muscles
            </button>
            {MUSCLE_GROUPS.map(muscle => (
              <button
                key={muscle}
                onClick={() => setMuscleFilter(muscle)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                  muscleFilter === muscle
                    ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-400'
                    : 'bg-white/5 border-white/10 text-slate-400 hover:text-white'
                }`}
              >
                {MUSCLE_LABELS[muscle]}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Liste */}
        <motion.div variants={fadeInUp} className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center">
              <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400">
                {sessions.length === 0 ? 'Aucune séance de force pour l\'instant' : 'Aucune séance ne correspond aux filtres'}
              </p>
            </div>
          ) : (
            filtered.map(session => (
              <StrengthSessionCard key={session.id} session={session} onDelete={handleDelete} />
            ))
          )}
        </motion.div>

      </div>
    </motion.div>
  )
}
