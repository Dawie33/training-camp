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

    it('normalise un synonyme de score_type hors enum par mot-cle', () => {
        const totalReps = ConditioningSchema.parse({
            type: 'for_time',
            movements: [{ name: 'Wall Ball', reps: 20 }],
            score_type: 'total_reps',
        })
        const timeToFinish = ConditioningSchema.parse({
            type: 'for_time',
            movements: [{ name: 'Row', calories: 10 }],
            score_type: 'time_to_finish',
        })

        expect(totalReps.score_type).toBe('reps')
        expect(timeToFinish.score_type).toBe('time')
    })
})