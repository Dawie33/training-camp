import { describe, expect, it } from '@jest/globals'
import { ConditioningSchema, ProgramSessionSchema, StrengthMovementSchema } from './program.schema'

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

    it('normalise un synonyme EMOM (completion_for_each_minute) vers rounds_and_reps', () => {
        const result = ConditioningSchema.parse({
            type: 'emom',
            movements: [{ name: 'Burpees', reps: 10 }],
            score_type: 'completion_for_each_minute',
        })

        expect(result.score_type).toBe('rounds_and_reps')
    })

    it('abandonne un score_type totalement inconnu plutot que de faire echouer la validation', () => {
        const result = ConditioningSchema.parse({
            type: 'for_time',
            movements: [{ name: 'Row', calories: 10 }],
            score_type: 'quelque_chose_de_jamais_vu',
        })

        expect(result.score_type).toBeNull()
    })

    it('arrondit un reps ou calories renvoye en float par l IA', () => {
        const result = ConditioningSchema.parse({
            type: 'for_time',
            movements: [{ name: 'Wall Ball Shot', reps: 21.5 }, { name: 'Row', calories: 12.0 }],
            score_type: 'time',
        })

        expect(result.movements[0].reps).toBe(22)
        expect(result.movements[1].calories).toBe(12)
    })

    it('abandonne un calories renvoye en booleen par l IA', () => {
        const result = ConditioningSchema.parse({
            type: 'emom',
            movements: [{ name: 'Row', calories: true }],
            score_type: 'calories',
        })

        expect(result.movements[0].calories).toBeNull()
    })

    it('remonte a 1 un reps, calories, rounds ou duration_minutes renvoye a 0 par l IA', () => {
        const result = ConditioningSchema.parse({
            type: 'amrap',
            duration_minutes: 0,
            rounds: 0,
            movements: [{ name: 'Wall Ball Shot', reps: 0, calories: 0 }],
            score_type: 'rounds_and_reps',
        })

        expect(result.duration_minutes).toBe(1)
        expect(result.rounds).toBe(1)
        expect(result.movements[0].reps).toBe(1)
        expect(result.movements[0].calories).toBe(1)
    })
})

describe('StrengthMovementSchema', () => {
    it('arrondit sets et reps renvoyes en float par l IA', () => {
        const result = StrengthMovementSchema.parse({
            name: 'Back Squat',
            sets: 5.0,
            reps: 4.6,
            intensity: '80% 1RM',
        })

        expect(result.sets).toBe(5)
        expect(result.reps).toBe(5)
    })

    it('remonte a 1 un sets ou reps renvoye a 0 par l IA', () => {
        const result = StrengthMovementSchema.parse({
            name: 'Back Squat',
            sets: 0,
            reps: 0,
            intensity: '80% 1RM',
        })

        expect(result.sets).toBe(1)
        expect(result.reps).toBe(1)
    })
})

describe('ProgramSessionSchema', () => {
    it('remonte a 1 un estimated_duration renvoye a 0 par l IA', () => {
        const result = ProgramSessionSchema.parse({
            session_in_week: 1,
            title: 'Seance',
            focus: 'recovery',
            estimated_duration: 0,
        })

        expect(result.estimated_duration).toBe(1)
    })
})