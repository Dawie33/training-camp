import { BadRequestException, Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import OpenAI from 'openai'
import { UserContextService } from 'src/workouts/services/user-context.service'
import { ZodError } from 'zod'
import { GenerateBikingSessionDto } from '../dto/biking.dto'
import { buildBikingSystemPrompt, buildBikingUserPrompt } from '../prompts/biking-generator.prompt'
import { GeneratedBikingPlanSchema, GeneratedBikingPlanValidated } from '../schemas/biking.schema'


@Injectable()
export class AIBikingGeneratorService {
    private openai: OpenAI

    constructor(
        @InjectModel() private readonly knex: Knex,
        private readonly userContextService: UserContextService,
    ) {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) throw new Error('OPENAI_API_KEY environment variable is not set')
        this.openai = new OpenAI({ apiKey })
    }

    async generateBikingSession(userId: string, params: GenerateBikingSessionDto): Promise<GeneratedBikingPlanValidated> {
        const [ctx, recentBikingSessions] = await Promise.all([
            this.userContextService.getUserAIContext(userId),
            this.knex('biking_sessions')
                .select('bike_type', 'duration_seconds')
                .where('user_id', userId)
                .orderBy('session_date', 'desc')
                .limit(5),
        ])

        const systemPrompt = buildBikingSystemPrompt()
        const userPrompt = buildBikingUserPrompt({
            ...params,
            userLevel: ctx.sport_level,
            recentSessions: recentBikingSessions,
            injuries: ctx.injuries,
            physicalLimitations: ctx.physical_limitations,
            trainingPreferences: ctx.training_preferences,
        })

        try {
            const completion = await this.openai.chat.completions.create({
                model: 'gpt-4o',
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
            return GeneratedBikingPlanSchema.parse(parsed)
        } catch (error) {
            if (error instanceof SyntaxError) throw new BadRequestException('AI generated invalid JSON')
            if (error instanceof ZodError) {
                const msg = error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', ')
                throw new BadRequestException(`Biking plan validation failed: ${msg}`)
            }
            throw new BadRequestException(`Failed to generate biking session: ${(error as Error).message}`)
        }
    }
}