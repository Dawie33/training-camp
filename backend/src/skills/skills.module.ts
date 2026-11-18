import { Module } from '@nestjs/common'
import { WorkoutsModule } from 'src/workouts/workouts.module'
import { GoogleCalendarModule } from 'src/google-calendar/google-calendar.module'
import { SkillsController } from './controllers/skills.controller'
import { AISkillGeneratorService } from './services/ai-skill-generator.service'
import { SkillsService } from './services/skills.service'

@Module({
  imports: [WorkoutsModule, GoogleCalendarModule],
  controllers: [SkillsController],
  providers: [SkillsService, AISkillGeneratorService],
  exports: [SkillsService],
})
export class SkillsModule {}
