'use client'

interface RpeSelectorProps {
  value: number
  onChange: (rpe: number) => void
}

const RPE_LABELS: Record<number, string> = {
  1: 'Très facile — récupération',
  2: 'Très facile',
  3: 'Facile',
  4: 'Facile, conversation possible',
  5: 'Modéré',
  6: 'Modéré, respiration marquée',
  7: 'Difficile — quelques reps en réserve',
  8: 'Difficile — 2 reps en réserve',
  9: 'Très difficile — 1 rep en réserve',
  10: 'Maximal — rien de plus possible',
}

function rpeColor(rpe: number, isActive: boolean): string {
  if (!isActive) return 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
  if (rpe <= 4) return 'border-emerald-500 bg-emerald-500/15 text-emerald-600'
  if (rpe <= 6) return 'border-blue-500 bg-blue-500/15 text-blue-600'
  if (rpe <= 8) return 'border-orange-500 bg-orange-500/15 text-orange-600'
  return 'border-destructive bg-destructive/15 text-destructive'
}

/**
 * Sélecteur d'effort perçu sur l'échelle CR-10.
 * Croisé avec la durée de la séance, il donne la charge d'entraînement (sRPE),
 * base du suivi de charge hebdomadaire.
 */
export function RpeSelector({ value, onChange }: RpeSelectorProps) {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-10 gap-1.5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rpe) => (
          <button
            key={rpe}
            type="button"
            onClick={() => onChange(rpe === value ? 0 : rpe)}
            aria-label={`RPE ${rpe} — ${RPE_LABELS[rpe]}`}
            aria-pressed={rpe === value}
            className={`py-2 rounded-lg border text-sm font-semibold font-mono transition-all ${rpeColor(rpe, rpe === value)}`}
          >
            {rpe}
          </button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground min-h-4">
        {value > 0 ? RPE_LABELS[value] : 'De 1 (récupération) à 10 (effort maximal)'}
      </p>
    </div>
  )
}
