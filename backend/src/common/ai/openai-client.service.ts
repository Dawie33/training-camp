import { Injectable } from '@nestjs/common'
import OpenAI from 'openai'

@Injectable()
export class OpenAIClientService {
    readonly client: OpenAI
    readonly model: string = process.env.OPENAI_MODEL ?? 'gpt-4.1'

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is not set')
        }

        this.client = new OpenAI({ apiKey })
    }

    // Les modèles récents (GPT-5+) n'acceptent que la température par défaut : on ne l'envoie qu'aux gpt-4.x
    temperatureParam(value: number): { temperature?: number } {
        return this.model.startsWith('gpt-4') ? { temperature: value } : {}
    }
}