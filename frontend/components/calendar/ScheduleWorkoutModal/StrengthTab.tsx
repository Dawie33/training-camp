'use client'

import { SESSION_GOAL_LABELS, StrengthSession } from '@/services/strength'
import { Dumbbell, Search } from 'lucide-react'
import { useStrengthSessions } from './useStrengthSessions'

type StrengthHook = ReturnType<typeof useStrengthSessions>

const GOAL_FILTERS = ['', 'strength', 'hypertrophy', 'endurance', 'power']

interface StrengthTabProps {
  strength: StrengthHook
  notes: string
  onNotesChange: (value: string) => void
  submitting: boolean
  onSubmit: () => void
  onCancel: () => void
}

export function StrengthTab({ strength, notes, onNotesChange, submitting, onSubmit, onCancel }: StrengthTabProps) {
  const filtered = strength.sessions.filter((s: StrengthSession) => {
    const name = s.ai_plan?.session_name ?? ''
    const matchSearch =
      strength.search === '' ||
      name.toLowerCase().includes(strength.search.toLowerCase()) ||
      s.target_muscles.some(m => m.toLowerCase().includes(strength.search.toLowerCase()))
    const matchGoal = strength.goalFilter === '' || s.session_goal === strength.goalFilter
    return matchSearch && matchGoal
  })

  return (
    <div className="flex flex-col gap-3 flex-1 overflow-hidden min-h-0">
      <div className="space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Rechercher une séance..."
            value={strength.search}
            onChange={e => strength.setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-600/30"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {GOAL_FILTERS.map(goal => (
            <button
              key={goal}
              type="button"
              onClick={() => strength.setGoalFilter(goal)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-all ${strength.goalFilter === goal ? 'bg-red-600/10 border-red-600/30 text-red-700' : 'bg-card border-border text-muted-foreground hover:text-foreground hover:bg-muted/60'}`}
            >
              {goal === '' ? 'Tous' : SESSION_GOAL_LABELS[goal as keyof typeof SESSION_GOAL_LABELS]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0" style={{ maxHeight: '240px' }}>
        {strength.loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-red-600" />
          </div>
        ) : strength.sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm space-y-2">
            <Dumbbell className="w-8 h-8 mx-auto text-muted-foreground" />
            <p>Aucune séance force créée.</p>
            <a href="/force/generate" className="text-red-700 hover:underline text-xs">
              Générer une séance →
            </a>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground text-sm">Aucun résultat</p>
        ) : (
          filtered.map(session => {
            const name = session.ai_plan?.session_name ?? SESSION_GOAL_LABELS[session.session_goal]
            const isSelected = strength.selectedId === session.id
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => strength.setSelectedId(session.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md border transition-all ${isSelected ? 'bg-red-600/10 border-red-600/30 text-red-700' : 'bg-card border-border text-foreground hover:bg-muted/60'}`}
              >
                <p className="font-semibold text-sm">{name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {session.target_muscles.join(', ')} · {SESSION_GOAL_LABELS[session.session_goal]}
                </p>
              </button>
            )
          })
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes (optionnel)</label>
        <textarea
          placeholder="Objectif, charge cible, intention..."
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-600/30 resize-none"
        />
      </div>

      <div className="flex justify-end gap-2 pt-1 border-t border-border">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className="px-4 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${submitting ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-red-600 hover:bg-red-700 text-primary-foreground'}`}
        >
          {submitting ? 'Planification...' : 'Planifier'}
        </button>
      </div>
    </div>
  )
}
