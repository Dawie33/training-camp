import { BadRequestException, Injectable } from '@nestjs/common'
import { OpenAIClientService } from 'src/common/ai/openai-client.service'
import { ExercisesService } from 'src/exercises/exercises.service'
import { EQUIPMENT_PRESETS } from 'src/workouts/constants/equipment.constants'
import { UserContextService } from 'src/workouts/services/user-context.service'
import { ZodError } from 'zod'
import { GenerateProgramDto } from './dto/generate-program.dto'
import {
  BonusSessionParams,
  buildBonusSessionSystemPrompt,
  buildBonusSessionUserPrompt,
  buildProgramGeneratorSystemPrompt,
  buildProgramGeneratorUserPrompt,
} from './prompts/program-generator.prompt'
import {
  GeneratedProgramSchema,
  GeneratedProgramValidated,
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
