import { describe, expect, it } from '@jest/globals'
import { buildCompetitionWeeklyPlan } from '../planning/competition-planner'
import type { ProgramSession } from '../schemas/program.schema'
import { validateCompetitionProgram } from './competition-program.validator'

function session(title: string, duration = 45, sets = 3): ProgramSession {
    return {
        title,
        session_in_week: 1,
        focus: 'strength',
        estimated_duration: duration,
        strength_work: {
            movements: [{ name: title, sets, reps: 5 }],
        },
        conditioning: null,
        skill_work: null,
    }
}

describe('validateCompetitionProgram', () => {
    it('utilise le nombre de séances demandé', () => {
        const plans = buildCompetitionWeeklyPlan(4)
        const generatedWeeks = plans.map((plan) => ({
            week: plan.week,
            sessions: [
                { ...session(`Session ${plan.week} A`, plan.taper ? 30 : 45, plan.taper ? 2 : 3), session_in_week: 1 },
                { ...session(`Session ${plan.week} B`, plan.taper ? 30 : 45, plan.taper ? 2 : 3), session_in_week: 2 },
                { ...session(`Session ${plan.week} C`, plan.taper ? 30 : 45, plan.taper ? 2 : 3), session_in_week: 3 },
            ],
        }))

        expect(() => validateCompetitionProgram(plans, generatedWeeks, 3)).not.toThrow()
    })

    it('rejette un taper dont la charge ne baisse pas', () => {
        const plans = buildCompetitionWeeklyPlan(4)
        const generatedWeeks = plans.map((plan) => ({
            week: plan.week,
            sessions: [
                { ...session(`Session ${plan.week}`, plan.taper ? 60 : 45, plan.taper ? 6 : 3), session_in_week: 1 },
                { ...session(`Session ${plan.week} B`, plan.taper ? 60 : 45, plan.taper ? 6 : 3), session_in_week: 2 },
                { ...session(`Session ${plan.week} C`, plan.taper ? 60 : 45, plan.taper ? 6 : 3), session_in_week: 3 },
            ],
        }))

        expect(() => validateCompetitionProgram(plans, generatedWeeks, 3)).toThrow('volume de la semaine taper')
    })

    it('rejette une séance non recovery qui ne contient que des notes', () => {
        const plans = buildCompetitionWeeklyPlan(4)
        const generatedWeeks = plans.map((plan) => ({
            week: plan.week,
            sessions: [
                { ...session(`Session ${plan.week} A`), session_in_week: 1 },
                { ...session(`Session ${plan.week} B`), session_in_week: 2 },
                {
                    ...session(`Session ${plan.week} C`),
                    session_in_week: 3,
                    strength_work: null,
                    conditioning: null,
                    skill_work: null,
                    focus: 'mixed' as const,
                },
            ],
        }))

        expect(() => validateCompetitionProgram(plans, generatedWeeks, 3)).toThrow('pas assez de contenu')
    })
})