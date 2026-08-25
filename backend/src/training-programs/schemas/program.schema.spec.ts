import { describe, expect, it } from '@jest/globals'
import { ConditioningSchema } from './program.schema'

describe('ConditioningSchema', () => {
    it('normalise une ancienne valeur score_type multi-choix', () => {
        const result = ConditioningSchema.parse({
            type: 'amrap',
            movements: [{ name: 'Row', calories: 10 }],
            score_type: 'calories|reps|time',
        })

        expect(result.score_type).toBe('calories')
    })
})