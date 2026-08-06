import { Module } from '@nestjs/common'
import { WorkoutsModule } from 'src/workouts/workouts.module'
import { SkillsController } from './controllers/skills.controller'
import { AISkillGeneratorService } from './services/ai-skill-generator.service'
import { SkillsService } from './services/skills.service'

@Module({
  imports: [WorkoutsModule],
  controllers: [SkillsController],
  providers: [SkillsService, AISkillGeneratorService],
  exports: [SkillsService],
})
export class SkillsModule {}
