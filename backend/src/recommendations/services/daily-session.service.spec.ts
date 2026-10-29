import { NotFoundException } from '@nestjs/common'
import { Test } from '@nestjs/testing'
import { AIWorkoutGeneratorService } from 'src/workouts/services/ai-workout-generator.service'
import { WorkoutScheduleService } from 'src/workouts/services/workout-schedule.service'
import { WorkoutsService } from 'src/workouts/services/workouts.service'
import { DailySessionService } from './daily-session.service'
import { RecommendationsService } from './recommendations.service'

const recommendation = {
  recommended_sport: 'crossfit' as const,
  recommended_type: 'technique_metcon',
  urgency: 'medium' as const,
  reason: 'Déséquilibre front squat / clean & jerk.',
  coaching_insight: 'Travaille la position de front rack.',
  suggested_duration: 50,
  suggested_focus: 'front rack',
  suggested_instructions: null,
}

const todaySchedule = { id: 'schedule-1', workout_id: 'workout-1', workout_name: 'Front Rack Chipper' }

describe('DailySessionService', () => {
  let service: DailySessionService
  const recommendationsService = { getNextSessionRecommendation: jest.fn() }
  const generator = { generatePersonalizedWorkout: jest.fn() }
  const workoutsService = { create: jest.fn() }
  const scheduleService = {
    findByDate: jest.fn(),
    create: jest.fn(),
    setCoachRecommendation: jest.fn(),
    setCoachProposal: jest.fn(),
  }

  beforeEach(async () => {
    jest.resetAllMocks()
    const moduleRef = await Test.createTestingModule({
      providers: [
        DailySessionService,
        { provide: RecommendationsService, useValue: recommendationsService },
        { provide: AIWorkoutGeneratorService, useValue: generator },
        { provide: WorkoutsService, useValue: workoutsService },
        { provide: WorkoutScheduleService, useValue: scheduleService },
      ],
    }).compile()
    service = moduleRef.get(DailySessionService)
  })

  describe("jour d'aujourd'hui", () => {
    afterEach(() => jest.useRealTimers())

    it('cherche le créneau du jour parisien entre minuit et 2 h (encore la veille en UTC)', async () => {
      // 22 h 30 UTC le 5 octobre = 0 h 30 le 6 octobre à Paris
      jest.useFakeTimers({ now: new Date('2026-10-05T22:30:00Z'), doNotFake: ['nextTick', 'setImmediate'] })
      scheduleService.findByDate.mockResolvedValue({ ...todaySchedule, coach_proposal: { workout_id: null } })

      await service.checkAndGenerateDailySession('user-1')
      await service.generateProposal('user-1')

      expect(scheduleService.findByDate).toHaveBeenNthCalledWith(1, 'user-1', '2026-10-06')
      expect(scheduleService.findByDate).toHaveBeenNthCalledWith(2, 'user-1', '2026-10-06')
    })
  })

  it('renvoie la séance déjà planifiée sans rien générer', async () => {
    scheduleService.findByDate.mockResolvedValue(todaySchedule)

    const result = await service.checkAndGenerateDailySession('user-1')

    expect(result).toEqual({ generated: false, reason: 'already_scheduled', schedule: todaySchedule })
    expect(recommendationsService.getNextSessionRecommendation).not.toHaveBeenCalled()
  })

  it("ne génère aucune séance un jour de repos planifié par l'athlète", async () => {
    const restDay = { ...todaySchedule, workout_id: null, session_type: 'rest' }
    scheduleService.findByDate.mockResolvedValue(restDay)

    const result = await service.checkAndGenerateDailySession('user-1')

    expect(result).toEqual({ generated: false, reason: 'already_scheduled', schedule: restDay })
    expect(generator.generatePersonalizedWorkout).not.toHaveBeenCalled()
    expect(workoutsService.create).not.toHaveBeenCalled()
  })

  it('renvoie la recommandation un jour de repos, sans planifier de séance', async () => {
    scheduleService.findByDate.mockResolvedValue(null)
    recommendationsService.getNextSessionRecommendation.mockResolvedValue({
      recommendation: { ...recommendation, recommended_sport: 'rest' },
    })

    const result = await service.checkAndGenerateDailySession('user-1')

    expect(result.reason).toBe('rest_recommended')
    expect(result.schedule).toBeNull()
    expect(result.recommendation?.reason).toBe(recommendation.reason)
    expect(generator.generatePersonalizedWorkout).not.toHaveBeenCalled()
  })

  it('enregistre la recommandation du coach avec la séance générée', async () => {
    scheduleService.findByDate.mockResolvedValueOnce(null).mockResolvedValueOnce(todaySchedule)
    recommendationsService.getNextSessionRecommendation.mockResolvedValue({ recommendation })
    generator.generatePersonalizedWorkout.mockResolvedValue({ name: 'Front Rack Chipper', blocks: {} })
    workoutsService.create.mockResolvedValue({ id: 'workout-1' })
    scheduleService.create.mockResolvedValue({ id: 'schedule-1' })

    const result = await service.checkAndGenerateDailySession('user-1')

    // La séance générée appartient à l'athlète : l'auteur est passé au service, pas dans les données
    expect(workoutsService.create).toHaveBeenCalledWith(
      expect.not.objectContaining({ created_by_user_id: expect.anything() }),
      'user-1'
    )
    expect(scheduleService.setCoachRecommendation).toHaveBeenCalledWith('schedule-1', 'user-1', {
      recommended_type: 'technique_metcon',
      urgency: 'medium',
      reason: recommendation.reason,
      coaching_insight: recommendation.coaching_insight,
      suggested_duration: 50,
    })
    expect(result).toEqual({ generated: true, schedule: todaySchedule })
  })

  it('renvoie la séance planifiée par un appel concurrent plutôt qu’un échec', async () => {
    scheduleService.findByDate.mockResolvedValueOnce(null).mockResolvedValueOnce(todaySchedule)
    recommendationsService.getNextSessionRecommendation.mockResolvedValue({ recommendation })
    generator.generatePersonalizedWorkout.mockResolvedValue({ name: 'Front Rack Chipper', blocks: {} })
    workoutsService.create.mockResolvedValue({ id: 'workout-2' })
    scheduleService.create.mockRejectedValue(new Error('Un workout est déjà planifié pour cette date'))

    const result = await service.checkAndGenerateDailySession('user-1')

    expect(result).toEqual({ generated: false, reason: 'already_scheduled', schedule: todaySchedule })
  })

  it('signale un échec quand rien n’a pu être planifié', async () => {
    scheduleService.findByDate.mockResolvedValue(null)
    recommendationsService.getNextSessionRecommendation.mockRejectedValue(new Error('OpenAI indisponible'))

    const result = await service.checkAndGenerateDailySession('user-1')

    expect(result).toEqual({ generated: false, reason: 'failed', schedule: null })
  })

  describe('generateProposal', () => {
    const snapshot = {
      recommended_type: 'technique_metcon',
      urgency: 'medium',
      reason: recommendation.reason,
      coaching_insight: recommendation.coaching_insight,
      suggested_duration: 50,
    }

    it('refuse quand aucun créneau n’existe aujourd’hui', async () => {
      scheduleService.findByDate.mockResolvedValue(null)

      await expect(service.generateProposal('user-1')).rejects.toBeInstanceOf(NotFoundException)
      expect(recommendationsService.getNextSessionRecommendation).not.toHaveBeenCalled()
    })

    it('renvoie la proposition déjà enregistrée sans rappeler l’IA', async () => {
      const proposal = { ...snapshot, workout_id: 'workout-9', workout_name: 'Front Rack Chipper' }
      scheduleService.findByDate.mockResolvedValue({ ...todaySchedule, coach_proposal: proposal })

      const result = await service.generateProposal('user-1')

      expect(result).toEqual(proposal)
      expect(recommendationsService.getNextSessionRecommendation).not.toHaveBeenCalled()
      expect(generator.generatePersonalizedWorkout).not.toHaveBeenCalled()
    })

    it('génère le WOD et l’enregistre à côté de la séance, sans toucher au créneau', async () => {
      scheduleService.findByDate.mockResolvedValue(todaySchedule)
      recommendationsService.getNextSessionRecommendation.mockResolvedValue({ recommendation })
      generator.generatePersonalizedWorkout.mockResolvedValue({ name: 'Front Rack Chipper', blocks: {} })
      workoutsService.create.mockResolvedValue({ id: 'workout-9' })

      const result = await service.generateProposal('user-1')

      const expected = { ...snapshot, workout_id: 'workout-9', workout_name: 'Front Rack Chipper' }
      expect(result).toEqual(expected)
      expect(scheduleService.setCoachProposal).toHaveBeenCalledWith('schedule-1', 'user-1', expected)
      expect(scheduleService.create).not.toHaveBeenCalled()
      expect(scheduleService.setCoachRecommendation).not.toHaveBeenCalled()
    })

    it('enregistre un conseil de repos sans générer de WOD', async () => {
      scheduleService.findByDate.mockResolvedValue(todaySchedule)
      recommendationsService.getNextSessionRecommendation.mockResolvedValue({
        recommendation: { ...recommendation, recommended_sport: 'rest' },
      })

      const result = await service.generateProposal('user-1')

      expect(result).toEqual({ ...snapshot, workout_id: null, workout_name: null })
      expect(generator.generatePersonalizedWorkout).not.toHaveBeenCalled()
      expect(scheduleService.setCoachProposal).toHaveBeenCalled()
    })
  })
})
