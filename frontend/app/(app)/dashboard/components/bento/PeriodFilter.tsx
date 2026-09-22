'use client'

export const PERIOD_OPTIONS = [
  { months: 1, label: '1 mois' },
  { months: 3, label: '3 mois' },
  { months: 6, label: '6 mois' },
  { months: 12, label: '1 an' },
] as const

/**
 * Filtre de période unique du dashboard.
 *
 * Il se place en une seule ligne au-dessus de tout ce qu'il cadre : chaque carte
 * et chaque graphe se recalcule sur la même tranche, pour que les chiffres
 * concordent toujours entre eux.
 */
export function PeriodFilter({
  months,
  onChange,
  refreshing = false,
}: {
  months: number
  onChange: (months: number) => void
  refreshing?: boolean
}) {
  return (
    <div className="flex items-center gap-2 flex-wrap" role="group" aria-label="Période d'analyse">
      {PERIOD_OPTIONS.map(option => {
        const isActive = option.months === months
        return (
          <button
            key={option.months}
            type="button"
            onClick={() => onChange(option.months)}
            aria-pressed={isActive}
            className={`px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${
              isActive
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
            }`}
          >
            {option.label}
          </button>
        )
      })}
      {refreshing && <span className="text-xs text-muted-foreground">Mise à jour…</span>}
    </div>
  )
}
