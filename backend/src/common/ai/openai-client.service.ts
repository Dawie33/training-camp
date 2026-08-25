import { Injectable } from '@nestjs/common'
import OpenAI from 'openai'

@Injectable()
export class OpenAIClientService {
    readonly client: OpenAI

    constructor() {
        const apiKey = process.env.OPENAI_API_KEY
        if (!apiKey) {
            throw new Error('OPENAI_API_KEY environment variable is not set')
        }

        this.client = new OpenAI({ apiKey })
    }
}