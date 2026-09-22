'use client'

import { WeeklyLoadPoint } from '@/services/analytics'
import { Area, AreaChart, CartesianGrid, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHROME, formatWeek, MARKS, SERIES } from './chart-tokens'
import { AXIS_PROPS, ChartTooltip, GRID_PROPS } from './ChartTooltip'

interface WeeklyLoadChartProps {
  weeks: WeeklyLoadPoint[]
  /** Charge chronique ramenée à la semaine — tracée en contexte, pas en série concurrente. */
  chronic: number | null
  height?: number
}

/**
 * Charge d'entraînement hebdomadaire (sRPE = RPE × minutes).
 *
 * Graphe en **emphase** : la charge réelle porte la teinte de série, la charge
 * chronique n'est qu'un repère et reste en gris. Les deux partagent la même unité
 * et donc le même axe — jamais deux échelles sur un même graphe.
 */
export function WeeklyLoadChart({ weeks, chronic, height = 160 }: WeeklyLoadChartProps) {
  if (weeks.length === 0) return null

  const data = weeks.map(week => ({
    week: formatWeek(week.week_start),
    srpe: week.srpe,
    sessions: week.session_count,
    chronic,
  }))

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -12 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="week" {...AXIS_PROPS} interval="preserveStartEnd" />
          <YAxis {...AXIS_PROPS} width={44} />
          <Tooltip
            cursor={{ stroke: CHROME.axis, strokeWidth: 1 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const point = payload[0].payload as (typeof data)[number]
              const rows = [
                { label: `UA · ${point.sessions} séance${point.sessions > 1 ? 's' : ''}`, value: String(point.srpe), color: SERIES },
              ]
              if (chronic !== null) {
                rows.push({ label: 'charge chronique', value: String(chronic), color: CHROME.context })
              }
              return <ChartTooltip title={String(label)} rows={rows} />
            }}
          />
          <Area
            type="monotone"
            dataKey="srpe"
            stroke={SERIES}
            strokeWidth={MARKS.lineWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill={SERIES}
            fillOpacity={MARKS.areaOpacity}
            dot={false}
            activeDot={{ r: MARKS.dotRadius, fill: SERIES, stroke: CHROME.surface, strokeWidth: MARKS.ringWidth }}
            isAnimationActive={false}
          />
          {chronic !== null && (
            <Line
              type="monotone"
              dataKey="chronic"
              stroke={CHROME.context}
              strokeWidth={MARKS.lineWidth}
              dot={false}
              activeDot={false}
              isAnimationActive={false}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
