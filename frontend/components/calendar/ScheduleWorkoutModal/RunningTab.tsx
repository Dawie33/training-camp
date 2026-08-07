'use client'

import { RUN_TYPE_LABELS, RunType } from '@/services/running'
import { SportTabConfig } from './types'

interface RunningTabProps {
  activeSport: SportTabConfig
  runType: RunType
  onRunTypeChange: (value: RunType) => void
  notes: string
  onNotesChange: (value: string) => void
  submitting: boolean
  onSubmit: () => void
  onCancel: () => void
}

export function RunningTab({
  activeSport,
  runType,
  onRunTypeChange,
  notes,
  onNotesChange,
  submitting,
  onSubmit,
  onCancel,
}: RunningTabProps) {
  return (
    <div className="flex flex-col gap-4 flex-1">
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Type de séance</label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(RUN_TYPE_LABELS) as [RunType, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onRunTypeChange(value)}
              className={`px-3 py-2.5 rounded-md border text-sm text-left transition-all ${runType === value ? activeSport.activeColor + ' border' : 'bg-card border-border text-foreground hover:bg-muted/60'}`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Notes (optionnel)</label>
        <textarea
          placeholder="Objectif, distance visée, intensité..."
          value={notes}
          onChange={e => onNotesChange(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 bg-card border border-border rounded-md text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
        />
      </div>

      <div className="flex justify-end gap-2 mt-auto pt-1 border-t border-border">
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
          className={`px-5 py-2 rounded-md text-sm font-semibold transition-all ${submitting ? 'bg-muted text-muted-foreground cursor-not-allowed' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
        >
          {submitting ? 'Planification...' : 'Planifier'}
        </button>
      </div>
    </div>
  )
}
