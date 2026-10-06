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
