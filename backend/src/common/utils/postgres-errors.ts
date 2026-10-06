/** Code PostgreSQL d'une violation de contrainte d'unicité (index ou contrainte UNIQUE). */
const UNIQUE_VIOLATION = '23505'

/**
 * Vrai si l'erreur vient d'une contrainte d'unicité, éventuellement d'un index précis.
 * À traduire en 409 (ConflictException) : sans ça, l'erreur remonte en 500.
 */
export function isUniqueViolation(error: unknown, constraint?: string): boolean {
  const pgError = error as { code?: unknown; constraint?: unknown } | null
  return pgError?.code === UNIQUE_VIOLATION && (constraint === undefined || pgError.constraint === constraint)
}
