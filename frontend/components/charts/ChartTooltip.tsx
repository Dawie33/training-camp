'use client'

import { CHROME } from './chart-tokens'

export interface TooltipRow {
  label: string
  value: string
  /** Couleur de la série, rendue en petit trait à côté du libellé — jamais sur le texte. */
  color?: string
}

/**
 * Infobulle commune aux graphes.
 *
 * Elle enrichit la lecture, elle ne la conditionne jamais : toute valeur affichée
 * ici reste accessible autrement (label direct, axe, ou tableau). La valeur est
 * l'élément fort, le nom de série reste secondaire.
 */
export function ChartTooltip({ title, rows }: { title?: string; rows: TooltipRow[] }) {
  if (rows.length === 0) return null

  return (
    <div className="rounded-lg border border-border bg-card px-3 py-2 shadow-md">
      {title && <p className="text-[11px] text-muted-foreground mb-1">{title}</p>}
      <div className="space-y-0.5">
        {rows.map(row => (
          <div key={row.label} className="flex items-baseline gap-2">
            {row.color && (
              <span
                aria-hidden
                className="inline-block w-2.5 h-0.5 rounded-full shrink-0"
                style={{ backgroundColor: row.color }}
              />
            )}
            <span className="text-sm font-semibold text-foreground tabular-nums">{row.value}</span>
            <span className="text-[11px] text-muted-foreground">{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Styles partagés des axes Recharts : hairline pleine, jamais pointillée, en retrait. */
export const AXIS_PROPS = {
  stroke: CHROME.axis,
  tick: { fill: CHROME.muted, fontSize: 11 },
  tickLine: false,
  axisLine: { stroke: CHROME.axis },
} as const

export const GRID_PROPS = {
  stroke: CHROME.grid,
  strokeDasharray: '0',
  vertical: false,
} as const
