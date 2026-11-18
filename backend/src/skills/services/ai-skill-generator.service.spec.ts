import { OpenAIClientService } from 'src/common/ai/openai-client.service'
import { UserContextService } from 'src/workouts/services/user-context.service'
import { AISkillGeneratorService } from './ai-skill-generator.service'
import { GeneratedSkillProgramSchema } from '../schemas/skill-program.schema'

describe('AISkillGeneratorService', () => {
  it('uses the profile equipment and shared validated completion', async () => {
    const createJsonCompletion = jest.fn().mockResolvedValue({ skill_name: 'Pull-up' })
    const service = new AISkillGeneratorService(
      { createJsonCompletion } as unknown as OpenAIClientService,
      {
        getUserAIContext: jest.fn().mockResolvedValue({
          sport_level: 'intermediate',
          equipment_available: ['Barre de traction'],
          injuries: [],
          physical_limitations: {},
          diagnostic: { ratio_imbalances: [] },
        }),
      } as unknown as UserContextService
    )
    await service.generateSkillProgram('u', { skillName: 'Pull-up', skillCategory: 'gymnastics' })
    expect(createJsonCompletion).toHaveBeenCalledWith(
      expect.objectContaining({
        schema: GeneratedSkillProgramSchema,
        messages: expect.arrayContaining([
          expect.objectContaining({
            role: 'user',
            content: expect.stringContaining('Barre de traction'),
          }),
        ]),
      })
    )
  })
})
