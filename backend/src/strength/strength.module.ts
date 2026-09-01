import { Module } from '@nestjs/common'
import { TrainingProgramsModule } from '../training-programs/training-programs.module'
import { WorkoutsModule } from '../workouts/workouts.module'
import { StrengthController } from './controllers/strength.controller'
import { StrengthProgramController } from './controllers/strength-program.controller'
import { AIStrengthGeneratorService } from './services/ai-strength-generator.service'
import { AIStrengthProgramGeneratorService } from './services/ai-strength-program-generator.service'
import { StrengthService } from './services/strength.service'

@Module({
  imports: [WorkoutsModule, TrainingProgramsModule],
  controllers: [StrengthController, StrengthProgramController],
  providers: [StrengthService, AIStrengthGeneratorService, AIStrengthProgramGeneratorService],
  exports: [StrengthService],
})
export class StrengthModule {}
