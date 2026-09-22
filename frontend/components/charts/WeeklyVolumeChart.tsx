'use client'

import { WeeklyVolumePoint } from '@/services/analytics'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHROME, formatWeek, MARKS, SERIES } from './chart-tokens'
import { AXIS_PROPS, ChartTooltip, GRID_PROPS } from './ChartTooltip'

/**
 * Nombre de séances par semaine.
 *
 * Volontairement séparé de la charge : deux mesures d'échelles différentes ne
 * partagent jamais un graphe, sous peine d'inventer une corrélation.
 */
export function WeeklyVolumeChart({ weeks, height = 160 }: { weeks: WeeklyVolumePoint[]; height?: number }) {
  if (weeks.length === 0) return null

  const data = weeks.map(week => ({ week: formatWeek(week.week_start), sessions: week.session_count }))

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid {...GRID_PROPS} />
          <XAxis dataKey="week" {...AXIS_PROPS} interval="preserveStartEnd" />
          <YAxis {...AXIS_PROPS} width={36} allowDecimals={false} />
          <Tooltip
            cursor={{ fill: CHROME.grid, fillOpacity: 0.5 }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null
              const count = payload[0].value as number
              return (
                <ChartTooltip
                  title={`Semaine du ${label}`}
                  rows={[{ label: `séance${count > 1 ? 's' : ''}`, value: String(count), color: SERIES }]}
                />
              )
            }}
          />
          <Bar
            dataKey="sessions"
            fill={SERIES}
            maxBarSize={MARKS.barMaxSize}
            radius={MARKS.barRadius}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
