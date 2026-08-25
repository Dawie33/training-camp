import { BadRequestException, Injectable } from '@nestjs/common'
import { OpenAIClientService } from 'src/common/ai/openai-client.service'
import { ExercisesService } from 'src/exercises/exercises.service'
import { EQUIPMENT_PRESETS } from 'src/workouts/constants/equipment.constants'
import { UserContextService } from 'src/workouts/services/user-context.service'
import { ZodError } from 'zod'
import { GenerateProgramDto } from './dto/generate-program.dto'
import { buildCompetitionWeeklyPlan, WeeklyPlan } from './planning/competition-planner'
import {
  BonusSessionParams,
  buildBonusSessionSystemPrompt,
  buildBonusSessionUserPrompt,
  buildProgramGeneratorSystemPrompt,
  buildProgramGeneratorUserPrompt,
  buildWeeklySessionSystemPrompt,
  buildWeeklySessionUserPrompt,
  ProgramSessionReference,
} from './prompts/program-generator.prompt'
import {
  GeneratedProgramSchema,
  GeneratedProgramValidated,
  GeneratedWeeklySessionsSchema,
  ProgramSession,
  ProgramSessionSchema,
} from './schemas/program.schema'

@Injectable()
export class AIProgramGeneratorService {
  constructor(
    private readonly userContextService: UserContextService,
    private readonly openAIClient: OpenAIClientService,
    private readonly exercisesService: ExercisesService,
  ) { }

  async generateProgram(userId: string, params: GenerateProgramDto): Promise<GeneratedProgramValidated> {
    try {
      const context = await this.userContextService.getUserAIContext(userId)
      const availableEquipment = context.equipment_available.length > 0
        ? context.equipment_available
        : [...EQUIPMENT_PRESETS.crossfit, 'plates']
      const availableExercises = await this.exercisesService.findForProgram({
        difficulty: params.target_level,
        equipment: availableEquipment,
      })

      if (params.program_type === 'competition_prep') {
        return this.generateCompetitionProgram(params, context, availableExercises)
      }

      const systemPrompt = buildProgramGeneratorSystemPrompt(params.program_type)
      const userPrompt = buildProgramGeneratorUserPrompt(params, context, availableExercises)

      const completion = await this.openAIClient.client.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 8192,
        response_format: { type: 'json_object' },
      })

      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new BadRequestException("Pas de réponse de l'IA")
      }

      const programData = JSON.parse(content)
      const validatedProgram = GeneratedProgramSchema.parse(programData)

      return validatedProgram
    } catch (error) {
      console.error('Error generating training program with AI:', error)

      if (error instanceof SyntaxError) {
        throw new BadRequestException("L'IA a généré un JSON invalide")
      }

      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        throw new BadRequestException(`Validation du programme échouée : ${errorMessages}`)
      }

      if (error instanceof BadRequestException) {
        throw error
      }

      throw new BadRequestException(`Échec de la génération du programme : ${(error as Error).message}`)
    }
  }

  private async generateCompetitionProgram(
    params: GenerateProgramDto,
    context: Awaited<ReturnType<UserContextService['getUserAIContext']>>,
    availableExercises: Array<{ name: string; category: string; difficulty: string }>,
  ): Promise<GeneratedProgramValidated> {
    const weeklyPlans = buildCompetitionWeeklyPlan(params.duration_weeks)
    const previousSessions: ProgramSessionReference[] = []
    const generatedByWeek = new Map<number, ProgramSession[]>()

    for (const weeklyPlan of weeklyPlans) {
      const sessions = await this.generateCompetitionWeek(params, context, weeklyPlan, availableExercises, previousSessions)
      generatedByWeek.set(weeklyPlan.week, sessions)
      previousSessions.push(...sessions.map((session) => ({
        week: weeklyPlan.week,
        session_in_week: session.session_in_week,
        title: session.title,
        focus: session.focus,
        movements: [
          ...(session.strength_work?.movements.map((movement) => movement.name) ?? []),
          ...(session.conditioning?.movements.map((movement) => movement.name) ?? []),
          ...(session.skill_work ? [session.skill_work.name] : []),
        ],
      })))
    }

    const phases = weeklyPlans.reduce<Array<GeneratedProgramValidated['phases'][number]>>((result, weeklyPlan) => {
      const existingPhase = result.find((phase) => phase.phase_number === weeklyPlan.phase_number)
      const sessions = generatedByWeek.get(weeklyPlan.week) ?? []
      if (existingPhase) {
        existingPhase.weeks.push(weeklyPlan.week)
        existingPhase.sessions.push(...sessions)
      } else {
        result.push({
          phase_number: weeklyPlan.phase_number,
          name: this.phaseName(weeklyPlan.phase),
          weeks: [weeklyPlan.week],
          description: weeklyPlan.objective,
          sessions,
        })
      }
      return result
    }, [])

    return GeneratedProgramSchema.parse({
      name: `Preparation competition CrossFit - ${params.duration_weeks} semaines`,
      description: 'Programme periodise avec accumulation, intensification, specificite competition, simulation et taper.',
      objectives: params.focus || 'Developper la performance et la strategie en competition CrossFit.',
      phases,
      progression_notes: 'La charge et la specificite augmentent progressivement, puis le volume diminue pendant le taper.',
      coach_notes: 'Adapte les charges selon la forme du jour et respecte les signaux de douleur ou de fatigue inhabituelle.',
    })
  }

  private async generateCompetitionWeek(
    params: GenerateProgramDto,
    context: Awaited<ReturnType<UserContextService['getUserAIContext']>>,
    weeklyPlan: WeeklyPlan,
    availableExercises: Array<{ name: string; category: string; difficulty: string }>,
    previousSessions: ProgramSessionReference[],
  ): Promise<ProgramSession[]> {
    const completion = await this.openAIClient.client.chat.completions.create({
      model: 'gpt-4.1',
      messages: [
        { role: 'system', content: buildWeeklySessionSystemPrompt() },
        { role: 'user', content: buildWeeklySessionUserPrompt(params, context, weeklyPlan, availableExercises, previousSessions) },
      ],
      temperature: 0.7,
      max_tokens: 4096,
      response_format: { type: 'json_object' },
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new BadRequestException("Pas de réponse de l'IA pour la semaine")

    const parsed = GeneratedWeeklySessionsSchema.parse(JSON.parse(content))
    if (parsed.sessions.length !== params.sessions_per_week) {
      throw new BadRequestException(
        `La semaine ${weeklyPlan.week} contient ${parsed.sessions.length} séances au lieu de ${params.sessions_per_week}`,
      )
    }
    return parsed.sessions.map((session, index) => ({ ...session, week: weeklyPlan.week, session_in_week: index + 1 }))
  }

  private phaseName(phase: WeeklyPlan['phase']): string {
    return {
      accumulation: 'Accumulation',
      intensification: 'Intensification',
      specific: 'Specificite competition',
      simulation: 'Simulation',
      taper: 'Taper',
    }[phase]
  }

  async generateBonusSession(userId: string, params: BonusSessionParams): Promise<ProgramSession> {
    try {
      const context = await this.userContextService.getUserAIContext(userId)

      const systemPrompt = buildBonusSessionSystemPrompt()
      const userPrompt = buildBonusSessionUserPrompt(params, context)

      const completion = await this.openAIClient.client.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 2048,
        response_format: { type: 'json_object' },
      })

      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new BadRequestException("Pas de réponse de l'IA")
      }

      const sessionData = JSON.parse(content)
      return ProgramSessionSchema.parse(sessionData)
    } catch (error) {
      console.error('Error generating bonus session with AI:', error)

      if (error instanceof SyntaxError) {
        throw new BadRequestException("L'IA a généré un JSON invalide")
      }
      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        throw new BadRequestException(`Validation de la séance échouée : ${errorMessages}`)
      }
      if (error instanceof BadRequestException) {
        throw error
      }
      throw new BadRequestException(`Échec de la génération de la séance : ${(error as Error).message}`)
    }
  }
}
