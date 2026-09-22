'use client'

import { MovementExposure } from '@/services/analytics'
import { Bar, BarChart, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHROME, MARKS, SERIES } from './chart-tokens'
import { AXIS_PROPS, ChartTooltip } from './ChartTooltip'

/**
 * Nombre d'expositions par mouvement sur la période.
 *
 * Les mouvements sont des catégories **nominales** : toutes les barres portent
 * donc la même teinte. Les colorer par valeur reviendrait à ré-encoder en couleur
 * ce que la longueur de barre dit déjà, et gâcherait le seul canal libre.
 */
/**
 * Libellé d'axe sur une seule ligne.
 *
 * Le rendu par défaut de Recharts renvoie un nom trop long à la ligne, ce qui
 * décale le texte par rapport à sa barre. On coupe donc à la longueur qui tient.
 */
function SingleLineTick({ x, y, payload }: {
  x?: number
  y?: number
  payload?: { value?: string }
}) {
  return (
    <text
      x={x}
      y={y}
      dy={4}
      textAnchor="end"
      fill={CHROME.muted}
      fontSize={11}
    >
      {payload?.value ?? ''}
    </text>
  )
}

export function MovementExposureChart({ movements, limit = 8 }: {
  movements: MovementExposure[]
  limit?: number
}) {
  const data = movements.slice(0, limit).map(movement => ({
    ...movement,
    shortName: movement.name.length > 18 ? `${movement.name.slice(0, 17)}…` : movement.name,
  }))

  if (data.length === 0) return null

  // 28px par ligne + la marge : le conteneur suit le contenu, il ne le tronque pas
  const height = data.length * 28 + 8

  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 36, bottom: 0, left: 0 }}>
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="shortName"
            {...AXIS_PROPS}
            width={118}
            axisLine={false}
            tick={<SingleLineTick />}
          />
          <Tooltip
            cursor={{ fill: CHROME.grid, fillOpacity: 0.5 }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const point = payload[0].payload as (typeof data)[number]
              const rows = [
                { label: 'expositions', value: String(point.exposures), color: SERIES },
                { label: 'reps cumulées', value: String(point.total_reps) },
              ]
              if (point.avg_load_kg !== null) {
                rows.push({ label: 'charge moyenne', value: `${point.avg_load_kg} kg` })
              }
              if (point.pct_of_1rm !== null) {
                rows.push({ label: 'du 1RM', value: `${point.pct_of_1rm} %` })
              }
              if (point.scaled_pct > 0) {
                rows.push({ label: 'des passages scalés', value: `${point.scaled_pct} %` })
              }
              return <ChartTooltip title={point.name} rows={rows} />
            }}
          />
          <Bar
            dataKey="exposures"
            fill={SERIES}
            maxBarSize={MARKS.barMaxSize}
            radius={MARKS.barRadiusHorizontal}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="exposures"
              position="right"
              offset={8}
              style={{ fill: CHROME.muted, fontSize: 11 }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
