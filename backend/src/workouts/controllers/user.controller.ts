import { Controller, Get, Query } from '@nestjs/common'
import { QueryDto } from 'src/dto'
import { WorkoutService } from '../services/workouts.service'

@Controller('workouts')
export class UserWorkoutController {
  constructor( private readonly service: WorkoutService ) {}


  //  @Get('today')
  // async today(@Req() req: any, @Query() q: { fatigueRPE?: number; timeBudgetMin?: number }) {
  //   const userId = req.user?.id ?? 'demo-user';
  //   return this.svc.getPersonalizedToday(userId, q);
  // }
/**
 * Retrieves all workouts.
 * @returns All workouts
 */
  @Get()
  async findAll(@Query() query: QueryDto) {
    return await this.service.findAll(query);
  }


}


