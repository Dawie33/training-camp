export type TrainingPhase = 'accumulation' | 'intensification' | 'specific' | 'simulation' | 'taper'
export type TrainingTarget = 'low' | 'medium' | 'high'

export interface WeeklyPlan {
    week: number
    phase: TrainingPhase
    phase_number: number
    objective: string
    volume_target: TrainingTarget
    intensity_target: TrainingTarget
    competition_specificity: TrainingTarget
    simulation: boolean
    taper: boolean
}

interface PhaseDefinition {
    phase: TrainingPhase
    objective: string
    volume_target: TrainingTarget
    intensity_target: TrainingTarget
    competition_specificity: TrainingTarget
    simulation?: boolean
    taper?: boolean
}

const COMPETITION_PHASES: Record<number, Array<{ weeks: number[]; definition: PhaseDefinition }>> = {
    4: [
        {
            weeks: [1, 2],
            definition: {
                phase: 'accumulation',
                objective: 'Construire le volume et consolider la technique.',
                volume_target: 'high',
                intensity_target: 'medium',
                competition_specificity: 'low',
            },
        },
        {
            weeks: [3],
            definition: {
                phase: 'intensification',
                objective: 'Augmenter l intensite avec un volume maitrise.',
                volume_target: 'medium',
                intensity_target: 'high',
                competition_specificity: 'medium',
            },
        },
        {
            weeks: [4],
            definition: {
                phase: 'taper',
                objective: 'Reduire la fatigue et conserver des rappels d intensite.',
                volume_target: 'low',
                intensity_target: 'medium',
                competition_specificity: 'medium',
                taper: true,
            },
        },
    ],
    6: [
        {
            weeks: [1, 2],
            definition: {
                phase: 'accumulation',
                objective: 'Construire le volume et consolider la technique.',
                volume_target: 'high',
                intensity_target: 'medium',
                competition_specificity: 'low',
            },
        },
        {
            weeks: [3, 4],
            definition: {
                phase: 'intensification',
                objective: 'Augmenter progressivement l intensite et la densite.',
                volume_target: 'medium',
                intensity_target: 'high',
                competition_specificity: 'medium',
            },
        },
        {
            weeks: [5],
            definition: {
                phase: 'simulation',
                objective: 'Reproduire les exigences de competition sous fatigue.',
                volume_target: 'medium',
                intensity_target: 'high',
                competition_specificity: 'high',
                simulation: true,
            },
        },
        {
            weeks: [6],
            definition: {
                phase: 'taper',
                objective: 'Reduire la fatigue et conserver des rappels d intensite.',
                volume_target: 'low',
                intensity_target: 'medium',
                competition_specificity: 'medium',
                taper: true,
            },
        },
    ],
    8: [
        {
            weeks: [1, 2],
            definition: {
                phase: 'accumulation',
                objective: 'Construire le volume et consolider la technique.',
                volume_target: 'high',
                intensity_target: 'medium',
                competition_specificity: 'low',
            },
        },
        {
            weeks: [3, 4],
            definition: {
                phase: 'intensification',
                objective: 'Augmenter progressivement l intensite et la densite.',
                volume_target: 'medium',
                intensity_target: 'high',
                competition_specificity: 'medium',
            },
        },
        {
            weeks: [5, 6],
            definition: {
                phase: 'specific',
                objective: 'Developper les formats et mouvements specifiques a la competition.',
                volume_target: 'medium',
                intensity_target: 'high',
                competition_specificity: 'high',
            },
        },
        {
            weeks: [7],
            definition: {
                phase: 'simulation',
                objective: 'Tester la strategie et l effort dans des conditions proches de la competition.',
                volume_target: 'medium',
                intensity_target: 'high',
                competition_specificity: 'high',
                simulation: true,
            },
        },
        {
            weeks: [8],
            definition: {
                phase: 'taper',
                objective: 'Reduire fortement le volume et conserver quelques rappels d intensite.',
                volume_target: 'low',
                intensity_target: 'medium',
                competition_specificity: 'medium',
                taper: true,
            },
        },
    ],
    12: [
        {
            weeks: [1, 2, 3],
            definition: {
                phase: 'accumulation',
                objective: 'Construire le volume et consolider la technique.',
                volume_target: 'high',
                intensity_target: 'medium',
                competition_specificity: 'low',
            },
        },
        {
            weeks: [4, 5, 6],
            definition: {
                phase: 'intensification',
                objective: 'Augmenter progressivement l intensite et la densite.',
                volume_target: 'medium',
                intensity_target: 'high',
                competition_specificity: 'medium',
            },
        },
        {
            weeks: [7, 8, 9],
            definition: {
                phase: 'specific',
                objective: 'Developper les formats et mouvements specifiques a la competition.',
                volume_target: 'medium',
                intensity_target: 'high',
                competition_specificity: 'high',
            },
        },
        {
            weeks: [10, 11],
            definition: {
                phase: 'simulation',
                objective: 'Tester la strategie et l effort dans des conditions proches de la competition.',
                volume_target: 'medium',
                intensity_target: 'high',
                competition_specificity: 'high',
                simulation: true,
            },
        },
        {
            weeks: [12],
            definition: {
                phase: 'taper',
                objective: 'Reduire fortement le volume et conserver quelques rappels d intensite.',
                volume_target: 'low',
                intensity_target: 'medium',
                competition_specificity: 'medium',
                taper: true,
            },
        },
    ],
}

export function buildCompetitionWeeklyPlan(durationWeeks: number): WeeklyPlan[] {
    const phases = COMPETITION_PHASES[durationWeeks]
    if (!phases) {
        throw new Error(`Unsupported competition program duration: ${durationWeeks}`)
    }

    return phases.flatMap(({ weeks, definition }, index) =>
        weeks.map((week) => ({
            week,
            phase: definition.phase,
            phase_number: index + 1,
            objective: definition.objective,
            volume_target: definition.volume_target,
            intensity_target: definition.intensity_target,
            competition_specificity: definition.competition_specificity,
            simulation: definition.simulation ?? false,
            taper: definition.taper ?? false,
        })),
    )
}