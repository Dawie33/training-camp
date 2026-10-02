import { formatInjuriesForPrompt } from './injury-prompt'
import type { Injury } from './injury.constants'

const activeShoulder: Injury = {
  zone: 'shoulder',
  side: 'right',
  status: 'active',
  severity: 'moderate',
  painful_patterns: ['overhead', 'kipping'],
  since: '2026-09',
  notes: 'Douleur sur le jerk',
}

const pastKnee: Injury = { zone: 'knee', side: 'left', status: 'past', severity: 'mild', painful_patterns: [] }

describe('formatInjuriesForPrompt', () => {
  it("renvoie une chaîne vide sans blessure, pour ne rien ajouter au prompt", () => {
    expect(formatInjuriesForPrompt([])).toBe('')
  })

  it('décrit la blessure en français avec zone, côté, statut, familles et note', () => {
    const block = formatInjuriesForPrompt([activeShoulder])

    expect(block).toContain('Épaule droite — ACTIVE, douleur sur certains mouvements — depuis 2026-09')
    expect(block).toContain('au-dessus de la tête (jerk, snatch')
    expect(block).toContain('kipping (')
    expect(block).toContain('« Douleur sur le jerk »')
  })

  it("n'inclut que les règles des statuts présents", () => {
    const block = formatInjuriesForPrompt([activeShoulder, pastKnee])

    expect(block).toContain('- ACTIVE : exclus tout mouvement')
    expect(block).toContain('- ANTÉCÉDENT : aucune exclusion')
    expect(block).not.toContain('- EN REPRISE :')
  })

  it("rappelle de ne jamais diagnostiquer ni travailler à travers la douleur", () => {
    const block = formatInjuriesForPrompt([pastKnee])

    expect(block).toContain('ne pose jamais de diagnostic')
    expect(block).toContain("Ne fais jamais travailler l'athlète à travers la douleur")
  })

  it("oriente vers un professionnel de santé quand une blessure est active", () => {
    expect(formatInjuriesForPrompt([activeShoulder])).toContain('consulter un professionnel de santé')
  })

  it("n'affiche pas de côté pour une zone sans côté", () => {
    const block = formatInjuriesForPrompt([{ ...pastKnee, zone: 'lower_back', side: 'none' }])
    expect(block).toContain('- Bas du dos — ANTÉCÉDENT')
  })
})
