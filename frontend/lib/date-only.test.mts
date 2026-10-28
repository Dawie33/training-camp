// Le frontend n'a pas de lanceur de tests : ce fichier utilise celui de Node (node:test).
// Lancer depuis frontend/ : TZ=Europe/Paris node --test lib/date-only.test.mts (puis avec TZ=UTC)
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { toLocalDateString } from './date-only.ts'

test('lit le jour local, sans passer par UTC', () => {
  assert.equal(toLocalDateString(new Date(2026, 9, 6)), '2026-10-06')
  assert.equal(toLocalDateString(new Date(2026, 9, 6, 0, 30)), '2026-10-06')
  assert.equal(toLocalDateString(new Date(2026, 9, 6, 23, 59)), '2026-10-06')
})

test('complète les mois et les jours à un chiffre', () => {
  assert.equal(toLocalDateString(new Date(2026, 0, 5)), '2026-01-05')
})

test("ne recule pas d'un jour là où toISOString() le faisait (fuseau en avance sur UTC)", () => {
  const localMidnight = new Date(2026, 9, 6)
  if (localMidnight.getTimezoneOffset() < 0) {
    assert.equal(localMidnight.toISOString().split('T')[0], '2026-10-05')
  }
  assert.equal(toLocalDateString(localMidnight), '2026-10-06')
})

test('accepte une chaîne ISO (instant) et prend aujourd’hui par défaut', () => {
  const instant = '2026-10-06T10:00:00Z'
  assert.equal(toLocalDateString(instant), toLocalDateString(new Date(instant)))
  assert.equal(toLocalDateString(), toLocalDateString(new Date()))
})
