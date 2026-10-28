const pad = (value: number) => String(value).padStart(2, '0')

/**
 * Date « AAAA-MM-JJ » d'un instant, dans le fuseau du navigateur (celui de l'utilisateur).
 *
 * À utiliser à la place de `toISOString().split('T')[0]`, qui convertit en UTC : à Paris,
 * entre 0 h et 2 h du matin, ou pour un minuit local (`setHours(0, 0, 0, 0)`), on obtenait la veille.
 */
export function toLocalDateString(value: Date | string = new Date()): string {
  const date = new Date(value)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
