import { Injectable } from '@nestjs/common'
import { OpenAIClientService } from 'src/common/ai/openai-client.service'
import { UserContextService } from 'src/workouts/services/user-context.service'
import { GenerateSkillProgramDto } from '../dto/skill.dto'
import { buildSkillProgressionSystemPrompt, buildSkillProgressionUserPrompt } from '../prompts/skill-progression.prompt'
import { GeneratedSkillProgramSchema, GeneratedSkillProgramValidated } from '../schemas/skill-program.schema'

@Injectable()
export class AISkillGeneratorService {
  constructor(
    private readonly openaiClientService: OpenAIClientService,
    private readonly userContextService: UserContextService
  ) {}

  async generateSkillProgram(userId: string, params: GenerateSkillProgramDto): Promise<GeneratedSkillProgramValidated> {
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
      strengthImbalances: ctx.diagnostic.ratio_imbalances,
    })

    return this.openaiClientService.createJsonCompletion({
      purpose: 'programme de compétence',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      maxOutputTokens: 4096,
      schema: GeneratedSkillProgramSchema,
    })
  }
}
