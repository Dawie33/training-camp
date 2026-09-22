/**
 * Jetons graphiques des visualisations.
 *
 * Valeurs dérivées du thème Clay et **validées**, pas choisies à l'œil :
 * la rampe ordinale passe les contrôles de monotonie de luminosité, d'écart
 * entre paliers adjacents et de contraste du palier le plus clair (2.39:1 sur
 * la surface `#fdfdfc`, seuil 2:1).
 *
 * Contrastes mesurés sur la surface des cartes :
 *   mark terracotta 4.33:1 · encre muted 5.21:1 · critical 4.72:1 · good 3.30:1
 * `warning` (1.80:1) et `serious` (2.59:1) passent sous 3:1 : ils ne portent
 * jamais l'information seuls et s'accompagnent toujours d'une icône et d'un libellé.
 */

/** Teinte unique des séries. Un graphe = une série = cette couleur. */
export const SERIES = '#ca5234'

/** Rampe ordinale terracotta, du plus clair au plus foncé. Pour les catégories ordonnées uniquement. */
export const ORDINAL_RAMP = ['#f98669', '#e16c4f', '#ca5234', '#ae3c1e', '#932606'] as const

/** Couleurs d'état, à signification réservée — jamais utilisées pour une série. */
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
} as const

/** Chrome du graphe : jamais en pointillés, toujours en retrait de la donnée. */
export const CHROME = {
  surface: '#fdfdfc',
  grid: '#e0dad2',
  axis: '#c3c2b7',
  muted: '#766960',
  ink: '#2c2421',
  /** Série de contexte dans un graphe en emphase (la série principale reste en SERIES). */
  context: '#b8ada3',
} as const

/** Spécifications de tracé communes à tous les graphes. */
export const MARKS = {
  lineWidth: 2,
  barMaxSize: 24,
  barRadius: [4, 4, 0, 0] as [number, number, number, number],
  barRadiusHorizontal: [0, 4, 4, 0] as [number, number, number, number],
  dotRadius: 4,
  areaOpacity: 0.1,
  /** Anneau en couleur de surface, pour qu'un point reste lisible sur une ligne. */
  ringWidth: 2,
} as const

/** Échelle de la rampe ordinale sur n catégories ordonnées. */
export function ordinalColor(index: number, total: number): string {
  if (total <= 1) return ORDINAL_RAMP[2]
  const position = index / (total - 1)
  const step = Math.round(position * (ORDINAL_RAMP.length - 1))
  return ORDINAL_RAMP[step]
}

/** Format court d'une date pour un axe temporel. */
export function formatAxisDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

/** Format d'une semaine (lundi) pour un axe hebdomadaire. */
export function formatWeek(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}
