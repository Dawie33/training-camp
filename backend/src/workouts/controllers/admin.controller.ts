import { Body, Controller, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { UpdateBaseWorkoutDto } from '../dto/update-base-workout.dto'
import { AdminWorkoutService } from '../services/admin-workout.service'
import { WorkoutService } from '../services/workouts.service'

@Controller('admin/workouts')
export class AdminWorkoutController {
  constructor(
    private readonly adminService: AdminWorkoutService,
    @InjectModel() private readonly knex: Knex, // <-- injection via décorateur
    private readonly service: WorkoutService
  ) { }

  @Get('day')
  async getWorkoutOfDay(
    @Query('wod_date') wod_date?: string,
    @Query('status') status?: string
  ) {
    return this.adminService.getWorkoutOfDay(wod_date, status)
  }

  @Post('generate-daily')
  async generateDaily(@Body() dto: { date: string; sportIds?: string[]; tags?: string[]; seed?: any }) {
    // Si aucun sport spécifié, générer pour tous les sports actifs
    let sports: any[]

    if (dto.sportIds && dto.sportIds.length > 0) {
      sports = await this.knex('sports').whereIn('id', dto.sportIds).where({ isActive: true })
    } else {
      sports = await this.knex('sports').where({ isActive: true })
    }

    if (!sports || sports.length === 0) {
      throw new NotFoundException('Aucun sport trouvé')
    }

    const results: Array<{ sport: string; success: boolean; workout?: any; error?: string }> = []

    // Générer un workout pour chaque sport
    for (const sport of sports) {
      try {
        const plan = await this.adminService.generateDaily(
          dto.date,
          { id: sport.id, slug: sport.slug },
          dto.seed,
          dto.tags ?? []
        )
        const row = await this.service.insertBaseDaily(plan)
        results.push({ sport: sport.name, success: true, workout: row })
      } catch (error) {
        results.push({ sport: sport.name, success: false, error: error.message })
      }
    }

    return {
      total: sports.length,
      generated: results.filter(r => r.success).length,
      results
    }
  }

  @Patch(':id')
  async updateBase(@Param('id') id: string, @Body() dto: UpdateBaseWorkoutDto) {
    const updated = await this.adminService.updateBaseWorkout(id, dto)
    return { workout: updated }
  }

  @Post(':id/publish')
  async publish(@Param('id') id: string) {
    const published = await this.adminService.publishBaseWorkout(id)
    return { workout: published }
  }

}

