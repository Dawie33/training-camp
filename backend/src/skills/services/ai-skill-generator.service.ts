import { BadRequestException, Injectable } from '@nestjs/common'
import { OpenAIClientService } from 'src/common/ai/openai-client.service'
import { UserContextService } from 'src/workouts/services/user-context.service'
import { ZodError } from 'zod'
import { GenerateSkillProgramDto } from '../dto/skill.dto'
import {
  buildSkillProgressionSystemPrompt,
  buildSkillProgressionUserPrompt,
} from '../prompts/skill-progression.prompt'
import { GeneratedSkillProgramSchema, GeneratedSkillProgramValidated } from '../schemas/skill-program.schema'

@Injectable()
export class AISkillGeneratorService {
  constructor(
    private readonly openaiClientService: OpenAIClientService,
    private readonly userContextService: UserContextService,
  ) {}

  async generateSkillProgram(userId: string, params: GenerateSkillProgramDto): Promise<GeneratedSkillProgramValidated> {
    try {
      const ctx = await this.userContextService.getUserAIContext(userId)

      const systemPrompt = buildSkillProgressionSystemPrompt()
      const userPrompt = buildSkillProgressionUserPrompt({
        skillName: params.skillName,
        skillCategory: params.skillCategory,
        currentCapabilities: params.currentCapabilities,
        constraints: params.constraints,
        userLevel: params.userLevel ?? ctx.sport_level,
        availableEquipment: params.availableEquipment?.length ? params.availableEquipment : ctx.equipment_available,
        injuries: ctx.injuries,
        physicalLimitations: ctx.physical_limitations,
      })

      const completion = await this.openaiClientService.client.chat.completions.create({
        model: 'gpt-4.1',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
        response_format: { type: 'json_object' },
      })

      const content = completion.choices[0]?.message?.content
      if (!content) {
        throw new BadRequestException('No response from AI')
      }

      const programData = JSON.parse(content)
      const validatedProgram = GeneratedSkillProgramSchema.parse(programData)

      return validatedProgram
    } catch (error) {
      console.error('Error generating skill program with AI:', error)

      if (error instanceof SyntaxError) {
        throw new BadRequestException('AI generated invalid JSON')
      }

      if (error instanceof ZodError) {
        const errorMessages = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        throw new BadRequestException(`Skill program validation failed: ${errorMessages}`)
      }

      throw new BadRequestException(`Failed to generate skill program: ${error.message}`)
    }
  }
}
