import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../common/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../common/types/authenticated-user'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import {
  CreateScheduledActivityDto,
  UnifiedActivityQueryDto,
  UpdateScheduledActivityDto,
} from './dto/scheduled-activity.dto'
import { ScheduledActivitiesService } from './scheduled-activities.service'

@Controller('scheduled-activities')
@UseGuards(JwtAuthGuard)
export class ScheduledActivitiesController {
  constructor(private readonly service: ScheduledActivitiesService) {}

  /**
   * Vue unifiée de toutes les activités planifiées (CrossFit + Vélo + Force)
   */
  @Get('unified')
  async findUnified(@CurrentUser() user: AuthenticatedUser, @Query() query: UnifiedActivityQueryDto) {
    return this.service.findUnified(user.id, query)
  }

  /**
   * Crée une nouvelle activité planifiée (Vélo / Force)
   */
  @Post()
  async create(@CurrentUser() user: AuthenticatedUser, @Body() data: CreateScheduledActivityDto) {
    return this.service.create(user.id, data)
  }

  /**
   * Met à jour une activité planifiée (Vélo / Force)
   */
  @Patch(':id')
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateScheduledActivityDto
  ) {
    return this.service.update(id, user.id, data)
  }

  /**
   * Supprime une activité planifiée (Vélo / Force)
   */
  @Delete(':id')
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.delete(id, user.id)
  }

  /**
   * Marque une activité comme complétée
   */
  @Patch(':id/complete')
  async markAsCompleted(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.markAsCompleted(id, user.id)
  }

  /**
   * Marque une activité comme sautée
   */
  @Patch(':id/skip')
  async markAsSkipped(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.service.markAsSkipped(id, user.id)
  }
}
