'use client'

import { EnergyDomainStat } from '@/services/analytics'
import { Bar, BarChart, Cell, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { CHROME, MARKS, ordinalColor } from './chart-tokens'
import { AXIS_PROPS, ChartTooltip } from './ChartTooltip'

/**
 * Répartition des séances par domaine temporel.
 *
 * Les domaines sont **ordonnés** (puissance → glycolytique → mixte → aérobie →
 * aérobie long), donc ils portent la rampe ordinale : le lecteur voit la
 * progression dans la couleur elle-même. Le palier le plus clair passe sous
 * 3:1 de contraste, d'où les valeurs affichées en label direct — la couleur
 * ne porte jamais l'information seule.
 */
export function EnergyMixChart({
  domains,
  underworked,
  height = 190,
}: {
  domains: EnergyDomainStat[]
  underworked: string[]
  height?: number
}) {
  const data = domains.map((domain, index) => ({
    ...domain,
    name: domain.label,
    color: ordinalColor(index, domains.length),
  }))

  return (
    <div className="w-full">
      {/* La hauteur ne s'applique qu'au tracé : la note qui suit vit hors du cadre,
          sinon elle déborderait du conteneur à hauteur fixe. */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 40, bottom: 0, left: 0 }}>
            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis type="category" dataKey="name" {...AXIS_PROPS} width={92} axisLine={false} />
            <Tooltip
              cursor={{ fill: CHROME.grid, fillOpacity: 0.5 }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const point = payload[0].payload as (typeof data)[number]
                return (
                  <ChartTooltip
                    title={`${point.label} · ${point.range_label}`}
                    rows={[
                      { label: 'du volume', value: `${point.share_pct} %`, color: point.color },
                      { label: `séance${point.session_count > 1 ? 's' : ''}`, value: String(point.session_count) },
                    ]}
                  />
                )
              }}
            />
            <Bar
              dataKey="share_pct"
              maxBarSize={MARKS.barMaxSize}
              radius={MARKS.barRadiusHorizontal}
              isAnimationActive={false}
            >
              {data.map(entry => (
                <Cell key={entry.domain} fill={entry.color} />
              ))}
              <LabelList
                dataKey="share_pct"
                position="right"
                offset={8}
                formatter={value => `${value ?? 0} %`}
                style={{ fill: CHROME.muted, fontSize: 11 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {underworked.length > 0 && (
        <p className="text-[11px] text-muted-foreground mt-1.5">
          {underworked.length} domaine{underworked.length > 1 ? 's' : ''} sous 10 % — un athlète ne progresse que dans
          les fenêtres qu&apos;il expose.
        </p>
      )}
    </div>
  )
}
