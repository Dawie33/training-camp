import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../../common/types/authenticated-user'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { CompleteScheduleDto, CreateScheduleDto, ScheduleQueryDto, UpdateScheduleDto } from '../dto/schedule.dto'
import { WorkoutScheduleService } from '../services/workout-schedule.service'

/**
 * Endpoints CRUD de la planification des workouts sur le calendrier utilisateur.
 */
@Controller('workout-schedule')
@UseGuards(JwtAuthGuard)
export class WorkoutScheduleController {
  constructor(private readonly scheduleService: WorkoutScheduleService) {}

  /**
   * Récupère toutes les planifications de l'utilisateur
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ScheduleQueryDto) {
    return this.scheduleService.findAllByUser(user.id, query)
  }

  /**
   * Suggère une configuration de semaine basée sur l'historique
   */
  @Get('week-suggestion')
  @UseGuards(JwtAuthGuard)
  async getWeekSuggestion(@CurrentUser() user: AuthenticatedUser, @Query('weekStart') weekStart: string) {
    return this.scheduleService.suggestWeek(user.id, weekStart)
  }

  /**
   * Récupère une planification spécifique
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.findOne(id, user.id)
  }

  /**
   * Récupère la planification pour une date spécifique
   */
  @Get('by-date/:date')
  @UseGuards(JwtAuthGuard)
  async findByDate(@CurrentUser() user: AuthenticatedUser, @Param('date') date: string) {
    return this.scheduleService.findByDate(user.id, date)
  }

  /**
   * Crée une nouvelle planification
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@CurrentUser() user: AuthenticatedUser, @Body() data: CreateScheduleDto) {
    return this.scheduleService.create(user.id, data)
  }

  /**
   * Met à jour une planification
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() data: UpdateScheduleDto
  ) {
    return this.scheduleService.update(id, user.id, data)
  }

  /**
   * Supprime une planification
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async delete(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.delete(id, user.id)
  }

  /**
   * Marque une planification comme complétée
   */
  @Patch(':id/complete')
  @UseGuards(JwtAuthGuard)
  async markAsCompleted(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: CompleteScheduleDto
  ) {
    return this.scheduleService.markAsCompleted(id, user.id, body.session_id)
  }

  /**
   * Marque une planification comme sautée
   */
  @Patch(':id/skip')
  @UseGuards(JwtAuthGuard)
  async markAsSkipped(@CurrentUser() user: AuthenticatedUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.scheduleService.markAsSkipped(id, user.id)
  }
}
