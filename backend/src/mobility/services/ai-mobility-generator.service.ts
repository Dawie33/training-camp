import { BadRequestException, Injectable } from '@nestjs/common'
import OpenAI from 'openai'
import { UserContextService } from 'src/workouts/services/user-context.service'
import { ZodError } from 'zod'
import { GenerateMobilitySessionDto } from '../dto/mobility.dto'
import { buildMobilitySystemPrompt, buildMobilityUserPrompt } from '../prompts/mobility-generator.prompt'
import { GeneratedMobilityPlanSchema, GeneratedMobilityPlanValidated } from '../schemas/mobility.schema'

@Injectable()
export class AIMobilityGeneratorService {
    private openai: OpenAI

    constructor(private readonly userContextService: UserContextService) {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is not set')
        this.openai = new OpenAI({ apiKey })
    }

    async generateMobilitySession(userId: string, params: GenerateMobilitySessionDto): Promise<GeneratedMobilityPlanValidated> {
        const ctx = await this.userContextService.getUserAIContext(userId)

        const systemPrompt = buildMobilitySystemPrompt()
        const userPrompt = buildMobilityUserPrompt({
            ...params,
            userLevel: ctx.sport_level,
            injuries: ctx.injuries,
            physicalLimitations: ctx.physical_limitations,
            trainingPreferences: ctx.training_preferences,
        })

        try {
            const completion = await this.openai.chat.completions.create({
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
            if (!content) throw new BadRequestException('No response from AI')

            const parsed = JSON.parse(content)
            return GeneratedMobilityPlanSchema.parse(parsed)
        } catch (error) {
            if (error instanceof SyntaxError) throw new BadRequestException('AI generated invalid JSON')
            if (error instanceof ZodError) {
                const msg = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
                throw new BadRequestException(`Mobility plan validation failed: ${msg}`)
            }
            throw new BadRequestException(`Failed to generate mobility session: ${(error as Error).message}`)
        }
    }
}
