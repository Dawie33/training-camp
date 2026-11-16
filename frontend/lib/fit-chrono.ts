/**
 * Chrono du WOD déduit des fichiers .fit importés au log de séance.
 *
 * Avec un seul fichier, sa durée est le chrono : on le pré-remplit.
 * Avec plusieurs fichiers, on ne sait pas lequel porte le score : la somme est juste pour une
 * simulation Hyrox enregistrée segment par segment, mais fausse pour une séance à modules
 * (force, puis endurance, puis metcon) où seul le dernier fichier est chronométré.
 * On ne devine pas : l'athlète choisit, et la page refuse d'enregistrer sans chrono.
 */

interface FitChronoActivity {
  duration_seconds: number | null
}

export interface FitChronoChoice {
  key: 'total' | 'last'
  label: string
  seconds: number
}

const rawSeconds = (value: number | null | undefined): number =>
  typeof value === 'number' && Number.isFinite(value) && value > 0 ? value : 0

/** Arrondi à la seconde, une seule fois : arrondir chaque fichier avant de les additionner décalerait le total. */
const validSeconds = (value: number | null | undefined): number => Math.round(rawSeconds(value))

/** Chrono à pré-remplir dès l'import : la durée du fichier s'il est seul, sinon null. */
export function autoFillChronoSeconds(activities: FitChronoActivity[]): number | null {
  if (activities.length !== 1) return null
  return validSeconds(activities[0].duration_seconds) || null
}

/**
 * Chronos proposés quand plusieurs fichiers ont été importés.
 * @param activities Activités dans l'ordre où elles ont été faites (le backend les trie par heure de départ)
 */
export function fitChronoChoices(activities: FitChronoActivity[]): FitChronoChoice[] {
  if (activities.length < 2) return []

  const total = validSeconds(activities.reduce((sum, a) => sum + rawSeconds(a.duration_seconds), 0))
  const last = validSeconds(activities[activities.length - 1].duration_seconds)

  const choices: FitChronoChoice[] = []
  if (total > 0) choices.push({ key: 'total', label: 'Total des fichiers', seconds: total })
  if (last > 0) choices.push({ key: 'last', label: 'Dernier fichier', seconds: last })
  return choices
}

/** Découpe une durée pour le champ minutes / secondes du chrono. */
export function toTimeParts(totalSeconds: number): { minutes: string; seconds: string } {
  const rounded = Math.round(totalSeconds)
  return { minutes: String(Math.floor(rounded / 60)), seconds: String(rounded % 60).padStart(2, '0') }
}

/** Affichage « mm:ss » d'une durée en secondes. */
export function formatChrono(totalSeconds: number): string {
  const { minutes, seconds } = toTimeParts(totalSeconds)
  return `${minutes}:${seconds}`
}
