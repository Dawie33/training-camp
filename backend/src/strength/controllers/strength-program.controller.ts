import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Request, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { CreateProgramDto } from 'src/training-programs/dto/create-program.dto'
import { ScheduleWeekDto, SwapSessionDto, UpdateEnrollmentDto } from 'src/training-programs/dto/update-enrollment.dto'
import { TrainingProgramsService } from 'src/training-programs/training-programs.service'
import { AIStrengthProgramGeneratorService } from '../services/ai-strength-program-generator.service'
import { GenerateStrengthProgramDto } from '../dto/generate-strength-program.dto'

@Controller('strength/program')
@UseGuards(JwtAuthGuard)
export class StrengthProgramController {
  constructor(
    private readonly trainingPrograms: TrainingProgramsService,
    private readonly aiGenerator: AIStrengthProgramGeneratorService,
  ) { }

  // --- Routes statiques (avant les routes paramétrées) ---

  /**
   * POST /api/strength/program/generate-ai
   * Génère un programme de force avec l'IA (aperçu sans sauvegarde)
   */
  @Post('generate-ai')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async generateWithAI(@Request() req: { user: { id: string } }, @Body() dto: GenerateStrengthProgramDto) {
    return this.aiGenerator.generateProgram(req.user.id, dto)
  }

  /**
   * POST /api/strength/program
   * Sauvegarde le programme généré et inscrit l'utilisateur
   */
  @Post()
  async create(@Request() req: { user: { id: string } }, @Body() dto: CreateProgramDto) {
    return this.trainingPrograms.createAndEnroll(req.user.id, dto)
  }

  /**
   * GET /api/strength/program/active
   * Récupère le programme actif de l'utilisateur
   */
  @Get('active')
  async getActive(@Request() req: { user: { id: string } }) {
    return this.trainingPrograms.getActiveEnrollment(req.user.id)
  }

  // --- Routes d'enrollment ---

  /**
   * PATCH /api/strength/program/enrollments/:id/start
   */
  @Patch('enrollments/:id/start')
  async start(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.trainingPrograms.updateEnrollment(id, req.user.id, { status: 'active' })
  }

  /**
   * PATCH /api/strength/program/enrollments/:id/pause
   */
  @Patch('enrollments/:id/pause')
  async pause(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.trainingPrograms.updateEnrollment(id, req.user.id, { status: 'paused' })
  }

  /**
   * PATCH /api/strength/program/enrollments/:id/abandon
   */
  @Patch('enrollments/:id/abandon')
  async abandon(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.trainingPrograms.updateEnrollment(id, req.user.id, { status: 'abandoned' })
  }

  /**
   * PATCH /api/strength/program/enrollments/:id
   * Mise à jour générale (semaine courante, statut)
   */
  @Patch('enrollments/:id')
  async updateEnrollment(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: UpdateEnrollmentDto,
  ) {
    return this.trainingPrograms.updateEnrollment(id, req.user.id, dto)
  }

  /**
   * GET /api/strength/program/enrollments/:id/week/:weekNum
   * Sessions d'une semaine donnée avec customisations appliquées
   */
  @Get('enrollments/:id/week/:weekNum')
  async getWeek(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Param('weekNum', ParseIntPipe) weekNum: number,
  ) {
    return this.trainingPrograms.getWeekSessions(id, req.user.id, weekNum)
  }

  /**
   * POST /api/strength/program/enrollments/:id/schedule-week
   * Planifie les sessions d'une semaine dans le calendrier
   */
  @Post('enrollments/:id/schedule-week')
  async scheduleWeek(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Body() dto: ScheduleWeekDto,
  ) {
    return this.trainingPrograms.scheduleWeek(id, req.user.id, dto)
  }

  /**
   * PATCH /api/strength/program/enrollments/:id/sessions/:sessionInWeek/swap
   * Swap d'une session (workout entier ou exercice individuel)
   * Query param: ?week=1
   */
  @Patch('enrollments/:id/sessions/:sessionInWeek/swap')
  async swapSession(
    @Request() req: { user: { id: string } },
    @Param('id') id: string,
    @Param('sessionInWeek', ParseIntPipe) sessionInWeek: number,
    @Body() dto: SwapSessionDto & { week: number },
  ) {
    const weekNum = dto.week
    if (!weekNum) {
      throw new Error('week requis dans le body')
    }
    return this.trainingPrograms.swapSession(id, req.user.id, weekNum, sessionInWeek, dto)
  }

  /**
   * GET /api/strength/program/enrollments/:id/check-week-progress
   * Vérifie si toutes les sessions de la semaine courante sont complètes
   */
  @Get('enrollments/:id/check-week-progress')
  async checkWeekProgress(@Request() req: { user: { id: string } }, @Param('id') id: string) {
    return this.trainingPrograms.checkAndAdvanceWeek(id, req.user.id)
  }
}
