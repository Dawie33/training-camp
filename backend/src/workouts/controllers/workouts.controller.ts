import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import type { AuthenticatedUser } from '../../common/types/authenticated-user'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import {
  CreateWorkoutDto,
  GeneratePersonalizedWorkoutDto,
  GenerateWorkoutDto,
  LookupWorkoutDto,
  ParseWorkoutTextDto,
  SaveBenchmarkResultDto,
  WorkoutDto,
  WorkoutQueryDto,
} from '../dto/workout.dto'
import { AIWorkoutGeneratorService, GeneratedWorkout } from '../services/ai-workout-generator.service'
import { WorkoutsService } from '../services/workouts.service'

/**
 * Endpoints CRUD des workouts, benchmarks et génération assistée par IA.
 */
@Controller('workouts')
export class WorkoutsController {
  constructor(
    private readonly service: WorkoutsService,
    private readonly aiGenerator: AIWorkoutGeneratorService
  ) {}

  /**
   * Liste les workouts correspondant aux filtres de recherche.
   * @param query Filtres et pagination (statut, type, difficulté, etc.)
   * @param user Utilisateur courant authentifié
   * @returns La liste des workouts correspondant aux critères
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: WorkoutQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return await this.service.findAll(query, user)
  }

  /**
   * Liste les workouts marqués comme benchmarks (Fran, Grace, Murph, etc.) visibles par l'utilisateur.
   * @param user Utilisateur courant authentifié
   * @returns La liste des workouts benchmark
   */
  @Get('benchmark')
  @UseGuards(JwtAuthGuard)
  async getBenchmarkWorkouts(@CurrentUser() user: AuthenticatedUser) {
    return await this.service.getBenchmarkWorkouts(user)
  }

  /**
   * Récupère l'historique des résultats de benchmark de l'utilisateur.
   * @param user Utilisateur courant authentifié
   * @returns L'historique des résultats de benchmark
   */
  @Get('benchmark-history')
  @UseGuards(JwtAuthGuard)
  async getBenchmarkHistory(@CurrentUser() user: AuthenticatedUser) {
    return await this.service.getBenchmarkHistory(user.id)
  }

  /**
   * Vérifie si un benchmark mensuel doit être planifié pour l'utilisateur et le planifie le cas échéant.
   * En POST car la route écrit dans `user_workout_schedule` (un GET peut être rejoué ou déclenché par un lien externe).
   * @param user Utilisateur courant authentifié
   * @returns Le résultat de la vérification/planification
   */
  @Post('check-monthly-benchmark')
  @UseGuards(JwtAuthGuard)
  async checkMonthlyBenchmark(@CurrentUser() user: AuthenticatedUser) {
    return await this.service.checkAndScheduleMonthlyBenchmark(user.id)
  }

  /**
   * Suggère le prochain type de workout à réaliser en fonction de l'historique de l'utilisateur.
   * @param user Utilisateur courant authentifié
   * @returns Le type de workout suggéré
   */
  @Get('suggest-type')
  @UseGuards(JwtAuthGuard)
  async suggestNextWorkoutType(@CurrentUser() user: AuthenticatedUser) {
    return await this.aiGenerator.suggestNextWorkoutType(user.id)
  }

  /**
   * Liste les workouts personnalisés de l'utilisateur avec filtres et pagination.
   * @param user Utilisateur courant authentifié
   * @param query Filtres (pagination, recherche, difficulté, intensité, durée)
   * @returns La liste paginée des workouts personnalisés
   */
  @Get('personalized')
  @UseGuards(JwtAuthGuard)
  async getPersonalizedWorkouts(
    @CurrentUser() user: AuthenticatedUser,
    @Query()
    query: WorkoutQueryDto & {
      limit?: string
      offset?: string
      search?: string
      difficulty?: string
      intensity?: string
      minDuration?: string
      maxDuration?: string
    }
  ) {
    return await this.service.getPersonalizedWorkouts(
      user.id,
      query.limit,
      query.offset,
      query.search,
      query.difficulty,
      query.intensity,
      query.minDuration,
      query.maxDuration
    )
  }

  /**
   * Récupère un workout personnalisé spécifique de l'utilisateur.
   * @param id Identifiant du workout personnalisé
   * @param user Utilisateur courant authentifié
   * @returns Le workout personnalisé demandé
   */
  @Get('personalized/:id')
  @UseGuards(JwtAuthGuard)
  async getPersonalizedWorkout(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return await this.service.getPersonalizedWorkout(id, user.id)
  }

  /**
   * Récupère un workout du référentiel par son identifiant.
   * @param id Identifiant du workout
   * @param user Utilisateur courant authentifié
   * @returns Le workout demandé
   * @throws NotFoundException si le workout n'existe pas, n'est pas visible par l'utilisateur, ou si l'id n'est pas un UUID
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getWorkoutById(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND })) id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    const workout = await this.service.findOne(id, user)
    if (!workout) {
      throw new NotFoundException('Workout non trouvé')
    }
    return workout
  }

  /**
   * Crée un workout personnalisé pour l'utilisateur (sans passer par l'IA).
   * @param data Données du workout personnalisé
   * @param user Utilisateur courant authentifié
   * @returns Le workout personnalisé créé
   */
  @Post('personalized')
  @UseGuards(JwtAuthGuard)
  async createPersonalizedWorkouts(@Body() data: WorkoutDto, @CurrentUser() user: AuthenticatedUser) {
    const response = await this.service.createPersonalizedWorkout(data, user.id)
    return response
  }

  /**
   * Crée un workout dans le référentiel commun. L'auteur est l'utilisateur connecté.
   * @param createWorkoutDto Données du workout à créer
   * @param user Utilisateur courant authentifié
   * @returns Le workout créé
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createWorkoutDto: CreateWorkoutDto, @CurrentUser() user: AuthenticatedUser) {
    return await this.service.create(createWorkoutDto, user.id)
  }

  /**
   * Parse un texte libre décrivant un WOD et le structure via l'IA.
   * @param dto Texte brut du workout à parser
   * @returns Le workout structuré généré
   */
  @Post('parse-text')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async parseText(@Body() dto: ParseWorkoutTextDto): Promise<GeneratedWorkout> {
    return this.aiGenerator.parseWorkoutText(dto.text)
  }

  /**
   * Recherche un WOD connu par son nom (ex: "Fran") et retourne sa structure exacte.
   * @param dto Nom du workout et données de référence optionnelles (WOD post-2025 non connus de l'IA)
   * @returns Le workout structuré correspondant
   * @throws BadRequestException si le workout est inconnu de l'IA (`UNKNOWN_WOD`)
   */
  @Post('lookup')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async lookupWorkout(@Body() dto: LookupWorkoutDto): Promise<GeneratedWorkout> {
    return this.aiGenerator.lookupWorkoutByName(dto.name, dto.referenceData)
  }

  /**
   * Génère un workout personnalisé via l'IA en tenant compte du contexte utilisateur (1RMs, équipements, historique).
   * @param dto Paramètres de génération (type, difficulté, durée, focus, équipement)
   * @param user Utilisateur courant authentifié
   * @returns Le workout personnalisé généré
   */
  @Post('generate-ai-personalized')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async generatePersonalizedWithAI(
    @Body() dto: GeneratePersonalizedWorkoutDto,
    @CurrentUser() user: AuthenticatedUser
  ): Promise<GeneratedWorkout> {
    return this.aiGenerator.generatePersonalizedWorkout(user.id, dto)
  }

  /**
   * Génère un workout générique via l'IA, sans contexte utilisateur.
   * @param dto Paramètres de génération (type, difficulté, durée, focus, équipement, contraintes)
   * @returns Le workout généré
   */
  @Post('generate-ai')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async generateWithAI(@Body() dto: GenerateWorkoutDto) {
    return this.aiGenerator.generateWorkout(dto)
  }

  /**
   * Enregistre le résultat d'un benchmark réalisé par l'utilisateur.
   * @param user Utilisateur courant authentifié
   * @param body Identifiant du workout benchmark et résultat obtenu
   * @returns Le résultat enregistré
   */
  @Post('benchmark-result')
  @UseGuards(JwtAuthGuard)
  async saveBenchmarkResult(@CurrentUser() user: AuthenticatedUser, @Body() body: SaveBenchmarkResultDto) {
    return await this.service.saveBenchmarkResult(user.id, body)
  }

  /**
   * Met à jour un workout : le sien, ou le référentiel partagé pour un admin.
   * @param id Identifiant du workout
   * @param updateWorkoutDto Champs à mettre à jour
   * @param user Utilisateur courant authentifié
   * @returns Le workout mis à jour
   * @throws NotFoundException si le workout n'existe pas, si l'utilisateur ne peut pas le modifier, ou si l'id n'est pas un UUID
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND })) id: string,
    @Body() updateWorkoutDto: CreateWorkoutDto,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return await this.service.update(id, updateWorkoutDto, user)
  }

  /**
   * Supprime un workout personnalisé appartenant à l'utilisateur.
   * @param id Identifiant du workout personnalisé
   * @param user Utilisateur courant authentifié
   * @returns Un message de confirmation
   */
  @Delete('personalized/:id')
  @UseGuards(JwtAuthGuard)
  async deletePersonalizedWorkout(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    await this.service.deletePersonalizedWorkout(id, user.id)
    return { success: true, message: 'Workout personnalisé supprimé' }
  }

  /**
   * Supprime un workout : le sien, ou le référentiel partagé pour un admin.
   * @param id Identifiant du workout
   * @param user Utilisateur courant authentifié
   * @returns Le résultat de la suppression
   * @throws NotFoundException si le workout n'existe pas, si l'utilisateur ne peut pas le supprimer, ou si l'id n'est pas un UUID
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(
    @Param('id', new ParseUUIDPipe({ errorHttpStatusCode: HttpStatus.NOT_FOUND })) id: string,
    @CurrentUser() user: AuthenticatedUser
  ) {
    return await this.service.remove(id, user)
  }
}
