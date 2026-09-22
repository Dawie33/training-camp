'use client'

import { Area, AreaChart, ResponsiveContainer, Tooltip, YAxis } from 'recharts'
import { CHROME, MARKS, SERIES } from './chart-tokens'
import { ChartTooltip } from './ChartTooltip'

export interface SparkPoint {
  label: string
  value: number
}

interface SparklineProps {
  points: SparkPoint[]
  /** Unité affichée dans l'infobulle et le label de fin. */
  unit?: string
  height?: number
  /** Format personnalisé de la valeur (score de benchmark, par exemple). */
  formatValue?: (value: number) => string
}

/**
 * Courbe compacte d'une série unique, pour les petits multiples.
 *
 * Une facette = une série = une teinte : les lifts ne se comparent pas entre eux
 * (un back squat et un strict press n'ont pas le même ordre de grandeur), chacun
 * garde donc son échelle propre.
 */
export function Sparkline({ points, unit = 'kg', height = 48, formatValue }: SparklineProps) {
  if (points.length === 0) return null

  const format = formatValue ?? ((v: number) => `${v} ${unit}`)

  // Un relevé unique ne dessine pas de courbe : on double le point pour tracer un trait plat
  const data = points.length === 1 ? [points[0], points[0]] : points

  const values = points.map(p => p.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const pad = Math.max((max - min) * 0.25, max * 0.02, 1)

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 2, left: 4 }}>
          <YAxis hide domain={[min - pad, max + pad]} />
          <Tooltip
            cursor={{ stroke: CHROME.axis, strokeWidth: 1 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const point = payload[0].payload as SparkPoint
              return <ChartTooltip title={point.label} rows={[{ label: '', value: format(point.value), color: SERIES }]} />
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={SERIES}
            strokeWidth={MARKS.lineWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={SERIES}
            fillOpacity={MARKS.areaOpacity}
            dot={false}
            activeDot={{
              r: MARKS.dotRadius,
              fill: SERIES,
              stroke: CHROME.surface,
              strokeWidth: MARKS.ringWidth,
            }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
