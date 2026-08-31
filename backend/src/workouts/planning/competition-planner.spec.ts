import { describe, expect, it } from '@jest/globals'
import { buildCompetitionWeeklyPlan } from './competition-planner'

describe('buildCompetitionWeeklyPlan', () => {
    it('construit les phases attendues pour une preparation de 8 semaines', () => {
        const plan = buildCompetitionWeeklyPlan(8)

        expect(plan).toHaveLength(8)
        expect(plan.map((week) => week.phase)).toEqual([
            'accumulation',
            'accumulation',
            'intensification',
            'intensification',
            'specific',
            'specific',
            'simulation',
            'taper',
        ])
        expect(plan.filter((week) => week.simulation)).toHaveLength(1)
        expect(plan.at(-1)).toMatchObject({ week: 8, taper: true, volume_target: 'low' })
    })

    it('refuse une duree non supportee', () => {
        expect(() => buildCompetitionWeeklyPlan(10)).toThrow('Unsupported competition program duration: 10')
    })
})