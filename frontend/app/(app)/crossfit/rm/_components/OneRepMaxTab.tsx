import { CROSSFIT_LIFTS, type OneRepMax } from '@/services'

interface OneRepMaxTabProps {
  oneRepMaxes: OneRepMax[]
  liftValues: Record<string, { value: string; source: 'real' | 'estimated' }>
  savingLift: string | null
  onSetEntry: (lift: string, patch: Partial<{ value: string; source: 'real' | 'estimated' }>) => void
  onSave: (lift: string) => void
}

export function OneRepMaxTab({ oneRepMaxes, liftValues, savingLift, onSetEntry, onSave }: OneRepMaxTabProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 lg:p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">Mes 1 Rep Max</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Renseignez vos maximums pour que l'IA calibre les charges en conséquence.
        </p>
      </div>

      <div className="space-y-3">
        {CROSSFIT_LIFTS.map((lift) => {
          const entry = liftValues[lift.value] ?? { value: '', source: 'real' as const }
          const existing = oneRepMaxes.find((r) => r.lift === lift.value)
          const isSaving = savingLift === lift.value

          return (
            <div key={lift.value} className="flex items-center gap-3 p-3 rounded-md bg-secondary/40 border border-border">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{lift.label}</p>
                {existing && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Dernier : {existing.value} kg · {existing.source === 'real' ? 'Réel' : 'Estimé'}
                  </p>
                )}
              </div>

              {/* Source toggle */}
              <div className="flex rounded-md overflow-hidden border border-border text-xs font-medium flex-shrink-0">
                {(['real', 'estimated'] as const).map((src) => (
                  <button
                    key={src}
                    type="button"
                    onClick={() => onSetEntry(lift.value, { source: src })}
                    className={`px-2.5 py-1.5 transition-colors ${
                      entry.source === src ? 'bg-primary text-primary-foreground' : 'bg-secondary/40 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {src === 'real' ? 'Réel' : 'Estimé'}
                  </button>
                ))}
              </div>

              {/* kg input */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <input
                  type="number"
                  value={entry.value}
                  onChange={(e) => onSetEntry(lift.value, { value: e.target.value })}
                  placeholder="kg"
                  min="0"
                  step="0.5"
                  className="w-20 px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                />
                <span className="text-xs text-muted-foreground">kg</span>
              </div>

              <button
                type="button"
                onClick={() => onSave(lift.value)}
                disabled={isSaving || !entry.value}
                className="px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all shadow-sm shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
              >
                {isSaving ? '...' : 'OK'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
