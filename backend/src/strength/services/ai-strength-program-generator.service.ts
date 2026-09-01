import { BadRequestException, Injectable } from '@nestjs/common'
import { OpenAIClientService } from 'src/common/ai/openai-client.service'
import { UserContextService } from 'src/workouts/services/user-context.service'
import { GeneratedProgramSchema, GeneratedProgramValidated } from 'src/workouts/schemas/program.schema'
import { ZodError } from 'zod'
import { GenerateStrengthProgramDto } from '../dto/generate-strength-program.dto'
import { buildStrengthProgramSystemPrompt, buildStrengthProgramUserPrompt } from '../prompts/strength-program-generator.prompt'

@Injectable()
export class AIStrengthProgramGeneratorService {
  constructor(
    private readonly userContextService: UserContextService,
    private readonly openAIClient: OpenAIClientService,
  ) { }

  async generateProgram(
    userId: string,
    params: GenerateStrengthProgramDto,
  ): Promise<GeneratedProgramValidated & { target_level: string }> {
    try {
      const context = await this.userContextService.getUserAIContext(userId)
      const targetLevel = params.target_level ?? context.sport_level ?? 'intermediate'

      const systemPrompt = buildStrengthProgramSystemPrompt(params.training_style, params.sessions_per_week)
      const userPrompt = buildStrengthProgramUserPrompt({ ...params, target_level: targetLevel }, context)

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

      return { ...validatedProgram, target_level: targetLevel }
    } catch (error) {
      console.error('Error generating strength program with AI:', error)

      if (error instanceof SyntaxError) {
        throw new BadRequestException("L'IA a généré un JSON invalide")
      }

      if (error instanceof ZodError) {
        const errorMessages = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
        console.error('Zod validation issues:', errorMessages)
        throw new BadRequestException(`Validation du programme échouée : ${errorMessages}`)
      }

      if (error instanceof BadRequestException) {
        throw error
      }

      const message = error instanceof Error ? error.message : 'Erreur inconnue'
      throw new BadRequestException(`Échec de la génération du programme : ${message}`)
    }
  }
}
