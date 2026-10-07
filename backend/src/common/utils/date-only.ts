const pad = (value: number) => String(value).padStart(2, '0')

/**
 * Convertit une colonne PostgreSQL `date` en « AAAA-MM-JJ ».
 *
 * Sans configuration particulière, le driver `pg` renvoie une colonne `date` sous forme de `Date`
 * placée à minuit **heure locale du serveur**. `toISOString()` la convertit en UTC : à Paris,
 * minuit devient 22 h la veille et la date recule d'un jour (sur Render, en UTC, le bug était masqué).
 * On lit donc la date avec les accesseurs locaux, ce qui donne le bon jour quel que soit le fuseau.
 */
export function toDateOnly(value: string | Date): string {
  if (typeof value === 'string') return value.slice(0, 10)
  return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
}

/** Tous les utilisateurs sont en France : les dates « vécues » par l'athlète sont celles de Paris. */
const PARIS_DATE_FORMAT = new Intl.DateTimeFormat('fr-CA', {
  timeZone: 'Europe/Paris',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/**
 * Date « AAAA-MM-JJ », à Paris, d'un **instant** (colonne timestamptz, ex. started_at).
 * À distinguer de toDateOnly (colonne `date`) : en UTC, une séance faite à 0 h 30 à Paris
 * serait datée de la veille. Intl applique seul l'heure d'été et d'hiver.
 */
export function toParisDate(value: Date | string): string {
  return PARIS_DATE_FORMAT.format(new Date(value))
}

/** Lundi « AAAA-MM-JJ » de la semaine (à Paris) d'un instant : pour compter les semaines d'entraînement. */
export function toParisWeekStart(value: Date | string): string {
  const [year, month, day] = toParisDate(value).split('-').map(Number)
  // Date construite en UTC à partir du jour parisien : le calcul et toISOString() ne dépendent d'aucun fuseau
  const date = new Date(Date.UTC(year, month - 1, day))
  const dayOfWeek = date.getUTCDay()
  date.setUTCDate(date.getUTCDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
  return date.toISOString().slice(0, 10)
}
