import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../../common/types/authenticated-user'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import {
  CreateSkillProgramDto,
  CreateSkillProgressLogDto,
  GenerateSkillProgramDto,
  UpdateSkillProgramDto,
  UpdateSkillStepDto,
} from '../dto/skill.dto'
import { AISkillGeneratorService } from '../services/ai-skill-generator.service'
import { SkillsService } from '../services/skills.service'

@Controller('skills')
export class SkillsController {
  constructor(
    private readonly service: SkillsService,
    private readonly aiGenerator: AISkillGeneratorService
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@CurrentUser() user: AuthenticatedUser, @Query('status') status?: string) {
    return this.service.findAll(user.id, status)
  }

  // Static routes MUST come before :id parameterized routes
  @Get('progress/step/:stepId')
  @UseGuards(JwtAuthGuard)
  async getStepLogs(@Param('stepId', ParseUUIDPipe) stepId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.getStepLogs(stepId, user.id)
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.findOne(id, user.id)
  }

  @Post('generate-ai')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async generateWithAI(@Body() dto: GenerateSkillProgramDto, @CurrentUser() user: AuthenticatedUser) {
    return this.aiGenerator.generateSkillProgram(user.id, dto)
  }

  @Post('progress')
  @UseGuards(JwtAuthGuard)
  async logProgress(@Body() dto: CreateSkillProgressLogDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.logProgress(user.id, dto)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateSkillProgramDto, @CurrentUser() user: AuthenticatedUser) {
    return this.service.create(user.id, dto)
  }

  @Patch(':id/steps/:stepId')
  @UseGuards(JwtAuthGuard)
  async updateStep(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('stepId', ParseUUIDPipe) stepId: string,
    @Body() dto: UpdateSkillStepDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.service.updateStep(id, stepId, user.id, dto)
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async updateProgram(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateSkillProgramDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return this.service.updateProgram(id, user.id, dto)
  }

  @Delete('progress/:logId')
  @UseGuards(JwtAuthGuard)
  async deleteLog(@Param('logId', ParseUUIDPipe) logId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.deleteLog(logId, user.id)
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteProgram(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.service.deleteProgram(id, user.id)
  }
}
