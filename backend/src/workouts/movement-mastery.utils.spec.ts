import { describe, expect, it } from '@jest/globals'
import { resolveUnlockedMovementNames } from './movement-mastery.utils'

describe('resolveUnlockedMovementNames', () => {
    it('ne debloque rien sans 1RM ni competence terminee', () => {
        const result = resolveUnlockedMovementNames({ oneRepMaxes: [], completedSkillNames: [] })

        expect(result).toEqual([])
    })

    it('debloque la famille de mouvements correspondant a un lift connu', () => {
        const result = resolveUnlockedMovementNames({
            oneRepMaxes: [{ lift: 'clean_and_jerk', value: 80 }],
            completedSkillNames: [],
        })

        expect(result).toEqual(expect.arrayContaining(['Clean', 'Power Clean', 'Squat Clean', 'Jerk', 'Push Jerk', 'Split Jerk']))
    })

    it('ignore un lift inconnu sans erreur', () => {
        const result = resolveUnlockedMovementNames({
            oneRepMaxes: [{ lift: 'lift_inconnu', value: 10 }],
            completedSkillNames: [],
        })

        expect(result).toEqual([])
    })

    it('inclut les noms des competences terminees tels quels', () => {
        const result = resolveUnlockedMovementNames({
            oneRepMaxes: [],
            completedSkillNames: ['Muscle-Up', 'Handstand Walk'],
        })

        expect(result).toEqual(['Muscle-Up', 'Handstand Walk'])
    })

    it('deduplique les mouvements debloques plusieurs fois', () => {
        const result = resolveUnlockedMovementNames({
            oneRepMaxes: [{ lift: 'clean', value: 70 }, { lift: 'clean_and_jerk', value: 80 }],
            completedSkillNames: [],
        })

        expect(result.filter((name) => name === 'Clean')).toHaveLength(1)
    })
})
