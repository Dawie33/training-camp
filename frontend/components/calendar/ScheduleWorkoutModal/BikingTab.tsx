'use client'

import { BIKE_TYPE_LABELS, BikingSession } from '@/services/biking'
import { Bike, Search } from 'lucide-react'
import { useBikingSessions } from './useBikingSessions'

type BikingHook = ReturnType<typeof useBikingSessions>

interface BikingTabProps {
  biking: BikingHook
  notes: string
  onNotesChange: (value: string) => void
  submitting: boolean
  onSubmit: () => void
  onCancel: () => void
}

export function BikingTab({ biking, notes, onNotesChange, submitting, onSubmit, onCancel }: BikingTabProps) {
  const filtered = biking.sessions.filter((s: BikingSession) => {
    const name = s.ai_plan?.name ?? ''
    return (
      biking.search === '' ||
      name.toLowerCase().includes(biking.search.toLowerCase()) ||
      BIKE_TYPE_LABELS[s.bike_type].toLowerCase().includes(biking.search.toLowerCase())
    )
  })

  return (
    <div className="flex flex-col gap-3 flex-1 overflow-hidden min-h-0">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Rechercher une séance..."
          value={biking.search}
          onChange={e => biking.setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600/30"
        />
      </div>

      <div className="flex-1 overflow-y-auto pr-1 space-y-2 min-h-0" style={{ maxHeight: '280px' }}>
        {biking.loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600" />
          </div>
        ) : biking.sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm space-y-2">
            <Bike className="w-8 h-8 mx-auto text-muted-foreground" />
            <p>Aucune séance vélo créée.</p>
            <a href="/biking/generate" className="text-blue-700 hover:underline text-xs">
              Générer une séance →
            </a>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-center py-6 text-muted-foreground text-sm">Aucun résultat</p>
        ) : (
          filtered.map(session => {
            const name = session.ai_plan?.name ?? BIKE_TYPE_LABELS[session.bike_type]
            const isSelected = biking.selectedId === session.id
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => biking.setSelectedId(session.id)}
                className={`w-full text-left px-3 py-2.5 rounded-md border transition-all ${isSelected ? 'bg-blue-600/10 border-blue-600/30 text-blue-700' : 'bg-card border-border text-foreground hover:bg-muted/60'}`}
              >
                <p className="font-semibold text-sm">{name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{BIKE_TYPE_LABELS[session.bike_type]}</p>
              </button>
            )
          })
        )}
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes (optionnel)</label>
        <textarea
          placeholder="Objectif, intensité..."
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-blue-600/30 resize-none"
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
          disabled={submitting || !biking.selectedId}
          className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${submitting || !biking.selectedId ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-primary-foreground'}`}
        >
          {submitting ? 'Planification...' : 'Planifier'}
        </button>
      </div>
    </div>
  )
}
