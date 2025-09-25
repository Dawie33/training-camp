import { Injectable } from '@nestjs/common'
import { OpenAI } from 'openai'

@Injectable()
export class WorkoutAiService {
  private openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  async generateWorkout(prompt: string) {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
    });
    return response.choices[0].message.content;
  }
}