import { describe, expect, it, jest } from '@jest/globals'
import { OpenAIClientService } from 'src/common/ai/openai-client.service'
import { ExercisesService } from 'src/exercises/exercises.service'
import { UserContextService } from 'src/workouts/services/user-context.service'
import { AIProgramGeneratorService } from './ai-program-generator.service'

type CompletionResponse = {
    choices: Array<{ message: { content: string | null } }>
}

function weeklyResponse(week: number, taper: boolean) {
    const duration = taper ? 60 : 45
    const sets = taper ? 3 : 3

    return JSON.stringify({
        sessions: [1, 2, 3].map((sessionInWeek) => ({
            session_in_week: sessionInWeek,
            title: `Semaine ${week} séance ${sessionInWeek}`,
            focus: 'mixed',
            estimated_duration: duration,
            strength_work: {
                movements: [{ name: `Mouvement ${week}-${sessionInWeek}`, sets, reps: 5 }],
            },
            conditioning: null,
            skill_work: null,
            coach_notes: null,
        })),
    })
}

describe('AIProgramGeneratorService.generateProgram', () => {
    it('génère et regroupe les séances compétition semaine par semaine', async () => {
        const createCompletion = jest.fn<() => Promise<CompletionResponse>>()
            .mockResolvedValueOnce({ choices: [{ message: { content: weeklyResponse(1, false) } }] })
            .mockResolvedValueOnce({ choices: [{ message: { content: weeklyResponse(2, false) } }] })
            .mockResolvedValueOnce({ choices: [{ message: { content: weeklyResponse(3, false) } }] })
            .mockResolvedValueOnce({ choices: [{ message: { content: weeklyResponse(4, true) } }] })

        const userContext = {
            sport_level: 'intermediate',
            oneRepMaxes: [],
            benchmarkResults: {},
            global_goals: {},
            injuries: {},
            physical_limitations: {},
            equipment_available: ['barbell', 'plates', 'pull-up-bar'],
            training_preferences: {},
            recentSessions: [],
            recentAnalyses: [],
            activeSkills: [],
            progressionReports: [],
        }
        const userContextService = {
            getUserAIContext: jest.fn<() => Promise<typeof userContext>>().mockResolvedValue(userContext),
        } as unknown as UserContextService
        const openAIClient = {
            client: { chat: { completions: { create: createCompletion } } },
        } as unknown as OpenAIClientService
        const availableExercises = [
            { name: 'Back Squat', category: 'strength', difficulty: 'beginner' },
        ]
        const exercisesService = {
            findForProgram: jest.fn<() => Promise<typeof availableExercises>>().mockResolvedValue(availableExercises),
        } as unknown as ExercisesService
        const service = new AIProgramGeneratorService(userContextService, openAIClient, exercisesService)

        const program = await service.generateProgram('user-id', {
            program_type: 'competition_prep',
            duration_weeks: 4,
            sessions_per_week: 3,
            target_level: 'intermediate',
        })

        expect(createCompletion).toHaveBeenCalledTimes(4)
        expect(exercisesService.findForProgram).toHaveBeenCalledWith({
            difficulty: 'intermediate',
            equipment: ['barbell', 'plates', 'pull-up-bar'],
        })
        expect(program.phases.map((phase) => phase.weeks)).toEqual([[1, 2], [3], [4]])
        expect(program.phases.flatMap((phase) => phase.sessions)).toHaveLength(12)
        expect(program.phases.at(-1)?.sessions.every((session) => session.week === 4)).toBe(true)
    })
})