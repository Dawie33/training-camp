import { Transform } from 'class-transformer'

/**
 * Normalise un email (espaces retirés, minuscules) avant sa validation.
 * Sans ça, « Dawie@mail.com » et « dawie@mail.com » seraient deux comptes distincts.
 * Appliqué par le ValidationPipe global (transform: true).
 */
export function NormalizeEmail(): PropertyDecorator {
  return Transform(({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
}
