import { CROSSFIT_LIFTS, type OneRepMax, type OneRepMaxHistoryEntry, type OneRepMaxInput } from '@/services'
import { toLocalDateString } from '@/lib/date-only'

interface OneRepMaxTabProps {
  oneRepMaxes: OneRepMax[]
  history: Record<string, OneRepMaxHistoryEntry[]>
  liftValues: Record<string, OneRepMaxInput>
  savingLift: string | null
  deletingId: string | null
  onSetEntry: (lift: string, patch: Partial<OneRepMaxInput>) => void
  onSave: (lift: string) => void
  onDelete: (lift: string, id: string) => void
}

export function OneRepMaxTab({
  oneRepMaxes,
  history,
  liftValues,
  savingLift,
  deletingId,
  onSetEntry,
  onSave,
  onDelete,
}: OneRepMaxTabProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-4 lg:p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold text-foreground">Mes 1 Rep Max</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Renseignez vos maximums pour que l'IA calibre les charges en conséquence.
        </p>
      </div>

      <div className="space-y-3">
        {CROSSFIT_LIFTS.map(lift => {
          const entry = liftValues[lift.value] ?? { value: '', source: 'real' as const, measured_at: '' }
          const existing = oneRepMaxes.find(r => r.lift === lift.value)
          const isSaving = savingLift === lift.value

          return (
            <div key={lift.value} className="p-3 rounded-md bg-secondary/40 border border-border">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{lift.label}</p>
                  {existing && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Courant : {existing.value} kg · {existing.source === 'real' ? 'Réel' : 'Estimé'} ·{' '}
                      {existing.measured_at}
                    </p>
                  )}
                </div>

                {/* Source toggle */}
                <div className="flex rounded-md overflow-hidden border border-border text-xs font-medium flex-shrink-0">
                  {(['real', 'estimated'] as const).map(src => (
                    <button
                      key={src}
                      type="button"
                      onClick={() => onSetEntry(lift.value, { source: src })}
                      className={`px-2.5 py-1.5 transition-colors ${
                        entry.source === src
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-secondary/40 text-muted-foreground hover:text-foreground'
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
                    aria-label={`Charge ${lift.label} en kg`}
                    value={entry.value}
                    onChange={e => onSetEntry(lift.value, { value: e.target.value })}
                    placeholder="kg"
                    min="0.5"
                    max="500"
                    step="0.5"
                    className="w-20 px-2.5 py-1.5 rounded-md bg-background border border-border text-foreground text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors"
                  />
                  <span className="text-xs text-muted-foreground">kg</span>
                </div>

                <label className="text-xs text-muted-foreground">
                  Date du relevé (facultative)
                  <input
                    type="date"
                    value={entry.measured_at}
                    max={toLocalDateString()}
                    onChange={e => onSetEntry(lift.value, { measured_at: e.target.value })}
                    aria-label={`Date du relevé ${lift.label}`}
                    className="block mt-1 px-2 py-1.5 rounded-md bg-background border border-border text-foreground text-sm"
                  />
                </label>

                <button
                  type="button"
                  onClick={() => onSave(lift.value)}
                  disabled={savingLift !== null || deletingId !== null || !entry.value}
                  className="px-3 py-1.5 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-semibold transition-all shadow-sm shadow-primary/30 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  {isSaving ? '...' : 'OK'}
                </button>
              </div>
              <details className="mt-3 text-sm">
                <summary className="cursor-pointer text-muted-foreground">
                  Historique ({history[lift.value]?.length ?? 0})
                </summary>
                <ul className="mt-2 space-y-2">
                  {[...(history[lift.value] ?? [])].reverse().map(point => (
                    <li key={point.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span>
                        {new Date(point.measured_at).toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' })}
                        {' · '}
                        {point.value} kg · {point.source === 'real' ? 'Réel' : 'Estimé'}
                      </span>
                      <button
                        type="button"
                        disabled={savingLift !== null || deletingId !== null}
                        onClick={() => onDelete(lift.value, point.id)}
                        aria-label={`Supprimer le relevé ${lift.label} de ${point.value} kg du ${point.measured_at}`}
                        className="text-destructive text-xs px-2 py-1 rounded border border-border disabled:opacity-40"
                      >
                        {deletingId === point.id ? '...' : 'Supprimer'}
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            </div>
          )
        })}
      </div>
    </div>
  )
}
