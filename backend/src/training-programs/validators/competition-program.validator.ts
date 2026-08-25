import type { WeeklyPlan } from '../planning/competition-planner'
import type { ProgramSession } from '../schemas/program.schema'

/**
 * Résultat généré pour une semaine, avant validation du programme complet.
 */
export interface CompetitionWeekResult {
    week: number
    sessions: ProgramSession[]
}

/**
 * Vérifie la cohérence métier d'un programme CrossFit de compétition.
 *
 * Le contrôle couvre la présence des semaines, le nombre de séances demandé,
 * les doublons, la simulation et la réduction de charge du taper.
 *
 * @param weeklyPlans Plan déterministe servant de référence.
 * @param generatedWeeks Séances produites par l'IA, regroupées par semaine.
 * @param sessionsPerWeek Nombre de séances attendu chaque semaine.
 * @throws {Error} Si au moins une règle métier n'est pas respectée.
 */
export function validateCompetitionProgram(
    weeklyPlans: WeeklyPlan[],
    generatedWeeks: CompetitionWeekResult[],
    sessionsPerWeek: number,
): void {
    const errors: string[] = []
    const expectedWeeks = weeklyPlans.map((plan) => plan.week)
    const actualWeeks = generatedWeeks.map((week) => week.week)

    if (generatedWeeks.length !== expectedWeeks.length || actualWeeks.some((week) => !expectedWeeks.includes(week))) {
        errors.push(`Le programme doit contenir les semaines ${expectedWeeks.join(', ')}`)
    }

    const allSessions = generatedWeeks.flatMap(({ week, sessions }) => {
        if (sessions.length !== sessionsPerWeek) {
            errors.push(`La semaine ${week} contient ${sessions.length} séances au lieu de ${sessionsPerWeek}`)
        }

        const positions = sessions.map((session) => session.session_in_week)
        if (new Set(positions).size !== sessions.length) {
            errors.push(`La semaine ${week} contient des positions de séances dupliquées`)
        }

        const fingerprints = sessions.map(sessionFingerprint)
        if (new Set(fingerprints).size !== fingerprints.length) {
            errors.push(`La semaine ${week} contient des séances identiques`)
        }

        sessions.forEach((session) => {
            const blockCount = [session.strength_work, session.conditioning, session.skill_work].filter(Boolean).length
            const minimumBlocks = session.focus === 'mixed' ? 2 : session.focus === 'recovery' ? 0 : 1
            if (blockCount < minimumBlocks) {
                errors.push(`La séance "${session.title}" de la semaine ${week} ne contient pas assez de contenu d entraînement`)
            }
        })

        return sessions.map((session) => ({ week, session }))
    })

    const globalFingerprints = allSessions.map(({ session }) => sessionFingerprint(session))
    if (new Set(globalFingerprints).size !== globalFingerprints.length) {
        errors.push('Le programme contient des séances identiques sur plusieurs semaines')
    }

    const simulationWeeks = weeklyPlans.filter((plan) => plan.simulation).map((plan) => plan.week)
    if (simulationWeeks.some((week) => !generatedWeeks.some((result) => result.week === week))) {
        errors.push('La semaine de simulation est absente')
    }

    const taperPlan = weeklyPlans.find((plan) => plan.taper)
    if (taperPlan) {
        const taperResult = generatedWeeks.find((result) => result.week === taperPlan.week)
        const previousResult = generatedWeeks.find((result) => result.week === taperPlan.week - 1)
        if (!taperResult) {
            errors.push(`La semaine taper ${taperPlan.week} est absente`)
        } else if (taperResult.sessions.some((session) => session.estimated_duration > 60)) {
            errors.push(`La semaine taper ${taperPlan.week} contient une séance de plus de 60 minutes`)
        } else if (previousResult && totalWorkload(taperResult.sessions) > totalWorkload(previousResult.sessions)) {
            errors.push(`Le volume de la semaine taper ${taperPlan.week} doit être inférieur à celui de la semaine précédente`)
        }
    }

    if (errors.length > 0) {
        throw new Error(`Programme compétition invalide : ${errors.join(' | ')}`)
    }
}

/**
 * Produit une signature stable d'une séance pour détecter les répétitions.
 */
function sessionFingerprint(session: ProgramSession): string {
    const movements = [
        ...(session.strength_work?.movements.map((movement) => movement.name) ?? []),
        ...(session.conditioning?.movements.map((movement) => movement.name) ?? []),
        ...(session.skill_work ? [session.skill_work.name] : []),
    ]
    return `${session.title.trim().toLowerCase()}|${session.focus}|${movements.sort().join(',').toLowerCase()}`
}

/**
 * Calcule une charge simplifiée à partir des séries, minutes et rounds prescrits.
 */
function totalWorkload(sessions: ProgramSession[]): number {
    return sessions.reduce((total, session) => {
        const strengthSets = session.strength_work?.movements.reduce((sets, movement) => sets + movement.sets, 0) ?? 0
        const conditioningMinutes = session.conditioning?.duration_minutes ?? 0
        const conditioningRounds = session.conditioning?.rounds ?? 0
        return total + strengthSets + conditioningMinutes + conditioningRounds
    }, 0)
}