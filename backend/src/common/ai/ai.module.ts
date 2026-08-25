import { Global, Module } from '@nestjs/common'
import { OpenAIClientService } from './openai-client.service'

@Global()
@Module({
    providers: [OpenAIClientService],
    exports: [OpenAIClientService],
})
export class AiModule { }