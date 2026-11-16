// Le frontend n'a pas de lanceur de tests : ce fichier utilise celui de Node (node:test).
// Lancer depuis frontend/ : node --test lib/fit-chrono.test.mts
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { autoFillChronoSeconds, fitChronoChoices, formatChrono, toTimeParts } from './fit-chrono.ts'

test('pré-remplit le chrono avec la durée du fichier quand il est seul', () => {
  assert.equal(autoFillChronoSeconds([{ duration_seconds: 1311.76 }]), 1312)
})

test('ne pré-remplit rien avec plusieurs fichiers : le chrono du WOD est ambigu', () => {
  assert.equal(autoFillChronoSeconds([{ duration_seconds: 1476.61 }, { duration_seconds: 1311.76 }]), null)
})

test('ne pré-remplit rien sans durée exploitable', () => {
  assert.equal(autoFillChronoSeconds([{ duration_seconds: null }]), null)
  assert.equal(autoFillChronoSeconds([]), null)
})

test('propose le total et le dernier fichier pour une séance à modules (simulation ATHX)', () => {
  assert.deepEqual(fitChronoChoices([{ duration_seconds: 1476.61 }, { duration_seconds: 1311.76 }]), [
    { key: 'total', label: 'Total des fichiers', seconds: 2788 },
    { key: 'last', label: 'Dernier fichier', seconds: 1312 },
  ])
})

test('ne propose aucun choix avec un seul fichier', () => {
  assert.deepEqual(fitChronoChoices([{ duration_seconds: 600 }]), [])
})

test('ignore un fichier sans durée dans le total, et ne propose pas un dernier fichier vide', () => {
  assert.deepEqual(fitChronoChoices([{ duration_seconds: 300 }, { duration_seconds: null }]), [
    { key: 'total', label: 'Total des fichiers', seconds: 300 },
  ])
})

test('découpe et affiche une durée en minutes / secondes', () => {
  assert.deepEqual(toTimeParts(2788), { minutes: '46', seconds: '28' })
  assert.deepEqual(toTimeParts(65), { minutes: '1', seconds: '05' })
  assert.equal(formatChrono(1312), '21:52')
})
