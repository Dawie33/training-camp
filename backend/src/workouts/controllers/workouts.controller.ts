import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query, Request, UseGuards } from '@nestjs/common'
import { Throttle } from '@nestjs/throttler'
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard'
import { CreateWorkoutDto, GeneratePersonalizedWorkoutDto, GenerateWorkoutDto, LookupWorkoutDto, ParseWorkoutTextDto, SaveBenchmarkResultDto, WeeklyPlanDto, WorkoutDto, WorkoutQueryDto } from '../dto/workout.dto'
import { AIWorkoutGeneratorService, GeneratedWorkout, WeeklyPlanResult } from '../services/ai-workout-generator.service'
import { WorkoutsService } from '../services/workouts.service'

/**
 * Endpoints CRUD des workouts, benchmarks et génération assistée par IA.
 */
@Controller('workouts')
export class WorkoutsController {
  constructor(
    private readonly service: WorkoutsService,
    private readonly aiGenerator: AIWorkoutGeneratorService,
  ) { }

  /**
   * Liste les workouts correspondant aux filtres de recherche.
   * @param query Filtres et pagination (statut, type, difficulté, etc.)
   * @param req Requête authentifiée contenant l'utilisateur courant
   * @returns La liste des workouts correspondant aux critères
   */
  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: WorkoutQueryDto, @Request() req: { user: { id: string } }) {
    return await this.service.findAll(query, req.user.id)
  }

  /**
   * Récupère le workout planifié pour l'utilisateur à une date donnée (aujourd'hui par défaut).
   * @param req Requête authentifiée contenant l'utilisateur courant
   * @param date Date au format YYYY-MM-DD (optionnelle)
   * @returns Le workout du jour
   * @throws NotFoundException si aucun workout n'est planifié à cette date
   */
  @Get('daily')
  @UseGuards(JwtAuthGuard)
  async getDailyWorkout(
    @Request() req: { user: { id: string } },
    @Query('date') date?: string,
  ) {
    const workout = await this.service.getDailyWorkout(req.user.id, date)
    if (!workout) {
      throw new NotFoundException('Aucun workout trouvé pour cette date')
    }
    return workout
  }

  /**
   * Liste les workouts marqués comme benchmarks (Fran, Grace, Murph, etc.).
   * @returns La liste des workouts benchmark
   */
  @Get('benchmark')
  @UseGuards(JwtAuthGuard)
  async getBenchmarkWorkouts() {
    return await this.service.getBenchmarkWorkouts()
  }

  /**
   * Récupère l'historique des résultats de benchmark de l'utilisateur.
   * @param req Requête authentifiée contenant l'utilisateur courant
   * @returns L'historique des résultats de benchmark
   */
  @Get('benchmark-history')
  @UseGuards(JwtAuthGuard)
  async getBenchmarkHistory(@Request() req: { user: { id: string } }) {
    return await this.service.getBenchmarkHistory(req.user.id)
  }

  /**
   * Vérifie si un benchmark mensuel doit être planifié pour l'utilisateur et le planifie le cas échéant.
   * @param req Requête authentifiée contenant l'utilisateur courant
   * @returns Le résultat de la vérification/planification
   */
  @Get('check-monthly-benchmark')
  @UseGuards(JwtAuthGuard)
  async checkMonthlyBenchmark(@Request() req: { user: { id: string } }) {
    return await this.service.checkAndScheduleMonthlyBenchmark(req.user.id)
  }

  /**
   * Suggère le prochain type de workout à réaliser en fonction de l'historique de l'utilisateur.
   * @param req Requête authentifiée contenant l'utilisateur courant
   * @returns Le type de workout suggéré
   */
  @Get('suggest-type')
  @UseGuards(JwtAuthGuard)
  async suggestNextWorkoutType(@Request() req: { user: { id: string } }) {
    return await this.aiGenerator.suggestNextWorkoutType(req.user.id)
  }

  /**
   * Liste les workouts personnalisés de l'utilisateur avec filtres et pagination.
   * @param req Requête authentifiée contenant l'utilisateur courant
   * @param query Filtres (pagination, recherche, difficulté, intensité, durée)
   * @returns La liste paginée des workouts personnalisés
   */
  @Get('personalized')
  @UseGuards(JwtAuthGuard)
  async getPersonalizedWorkouts(
    @Request() req: { user: { id: string } },
    @Query() query: WorkoutQueryDto & {
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
      req.user.id,
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
   * @param req Requête authentifiée contenant l'utilisateur courant
   * @returns Le workout personnalisé demandé
   */
  @Get('personalized/:id')
  @UseGuards(JwtAuthGuard)
  async getPersonalizedWorkout(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    return await this.service.getPersonalizedWorkout(id, req.user.id)
  }

  /**
   * Récupère un workout du référentiel par son identifiant.
   * @param id Identifiant du workout
   * @returns Le workout demandé
   * @throws NotFoundException si le workout n'existe pas
   */
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getWorkoutById(@Param('id') id: string) {
    const workout = await this.service.findOne(id)
    if (!workout) {
      throw new NotFoundException('Workout non trouvé')
    }
    return workout
  }

  /**
   * Crée un workout personnalisé pour l'utilisateur (sans passer par l'IA).
   * @param data Données du workout personnalisé
   * @param req Requête authentifiée contenant l'utilisateur courant
   * @returns Le workout personnalisé créé
   */
  @Post('personalized')
  @UseGuards(JwtAuthGuard)
  async createPersonalizedWorkouts(
    @Body() data: WorkoutDto,
    @Request() req: { user: { id: string } },
  ) {
    const response = await this.service.createPersonalizedWorkout(data, req.user.id)
    return response
  }


  /**
   * Crée un workout dans le référentiel commun.
   * @param createWorkoutDto Données du workout à créer
   * @returns Le workout créé
   */
  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createWorkoutDto: CreateWorkoutDto) {
    return await this.service.create(createWorkoutDto)
  }

  /**
   * Parse un texte libre décrivant un WOD et le structure via l'IA.
   * @param dto Texte brut du workout à parser
   * @returns Le workout structuré généré
   */
  @Post('parse-text')
  @UseGuards(JwtAuthGuard)
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
  async lookupWorkout(@Body() dto: LookupWorkoutDto): Promise<GeneratedWorkout> {
    return this.aiGenerator.lookupWorkoutByName(dto.name, dto.referenceData)
  }

  /**
   * Génère un plan hebdomadaire de workouts via l'IA à partir des jours fournis.
   * @param dto Liste des jours à planifier (date, type, focus)
   * @param req Requête authentifiée contenant l'utilisateur courant
   * @returns Le plan hebdomadaire généré
   */
  @Post('weekly-plan')
  @UseGuards(JwtAuthGuard)
  async weeklyPlan(
    @Body() dto: WeeklyPlanDto,
    @Request() req: { user: { id: string } },
  ): Promise<WeeklyPlanResult> {
    return this.aiGenerator.generateWeeklyPlan(req.user.id, dto.days)
  }

  /**
   * Génère un workout personnalisé via l'IA en tenant compte du contexte utilisateur (1RMs, équipements, historique).
   * @param dto Paramètres de génération (type, difficulté, durée, focus, équipement)
   * @param req Requête authentifiée contenant l'utilisateur courant
   * @returns Le workout personnalisé généré
   */
  @Post('generate-ai-personalized')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  async generatePersonalizedWithAI(
    @Body() dto: GeneratePersonalizedWorkoutDto,
    @Request() req: { user: { id: string } },
  ): Promise<GeneratedWorkout> {
    return this.aiGenerator.generatePersonalizedWorkout(req.user.id, dto)
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
   * @param req Requête authentifiée contenant l'utilisateur courant
   * @param body Identifiant du workout benchmark et résultat obtenu
   * @returns Le résultat enregistré
   */
  @Post('benchmark-result')
  @UseGuards(JwtAuthGuard)
  async saveBenchmarkResult(
    @Request() req: { user: { id: string } },
    @Body() body: SaveBenchmarkResultDto
  ) {
    return await this.service.saveBenchmarkResult(req.user.id, body)
  }

  /**
   * Met à jour un workout du référentiel commun.
   * @param id Identifiant du workout
   * @param updateWorkoutDto Champs à mettre à jour
   * @returns Le workout mis à jour
   */
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateWorkoutDto: CreateWorkoutDto) {
    return await this.service.update(id, updateWorkoutDto)
  }

  /**
   * Supprime un workout personnalisé appartenant à l'utilisateur.
   * @param id Identifiant du workout personnalisé
   * @param req Requête authentifiée contenant l'utilisateur courant
   * @returns Un message de confirmation
   */
  @Delete('personalized/:id')
  @UseGuards(JwtAuthGuard)
  async deletePersonalizedWorkout(
    @Param('id') id: string,
    @Request() req: { user: { id: string } },
  ) {
    await this.service.deletePersonalizedWorkout(id, req.user.id)
    return { success: true, message: 'Workout personnalisé supprimé' }
  }

  /**
   * Supprime un workout du référentiel commun.
   * @param id Identifiant du workout
   * @returns Le résultat de la suppression
   */
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return await this.service.remove(id)
  }

}


