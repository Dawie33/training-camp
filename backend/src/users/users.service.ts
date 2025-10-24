import { Injectable } from "@nestjs/common"
import { Knex } from "knex"
import { InjectModel } from "nest-knexjs"
import { BenchmarkResultDto, SaveBenchmarkResultDto } from "./dto"

@Injectable()

export class UsersService {
    constructor(
        @InjectModel() private readonly knex: Knex
    ) { }

    /**
     * Récupère un utilisateur par son ID avec ses statistiques.
     * @param {string} id - Identifiant de l'utilisateur.
     * @returns {Promise<User | null>} - Promesse qui renvoie l'utilisateur correspondant à l'identifiant ou null si l'utilisateur n'existe pas.
     * Le résultat inclut le mot de passe de l'utilisateur qui est masqué.
     * Les stats de l'utilisateur sont également récupérés et incluent le nombre de workout et de sessions qu'il a créées.
     */
    async getProfile(id: string, activeSportId?: string) {
        const user = await this.knex('users')
            .where({ id })
            .first()

        if (!user) return null

        // Masquer le mot de passe
        const { password, ...sanitizedUser } = user

        // Récupérer le niveau pour le sport actif
        let sportLevel = 'beginner'
        if (activeSportId) {
            const sportProfile = await this.knex('user_sport_profiles')
                .where({ user_id: id, sport_id: activeSportId })
                .first()
            if (sportProfile) {
                sportLevel = sportProfile.sport_level
            }
        }

        // Récupérer les stats de l'utilisateur
        const [workoutsCount, sessionsCount, totalTime] = await Promise.all([
            this.knex('workouts')
                .where({ created_by_user_id: id })
                .count('* as count')
                .first(),
            this.knex('workout_sessions')
                .where({ user_id: id })
                .whereNotNull('completed_at')
                .count('* as count')
                .first(),
            // Calculer le temps total des sessions complétées
            this.knex('workout_sessions')
                .select(
                    this.knex.raw(`
                        COALESCE(
                            SUM(
                                CASE
                                    WHEN results->>'elapsed_time_seconds' IS NOT NULL
                                    THEN (results->>'elapsed_time_seconds')::integer
                                    WHEN completed_at IS NOT NULL
                                    THEN EXTRACT(EPOCH FROM (completed_at - started_at))::integer
                                    ELSE 0
                                END
                            ),
                            0
                        ) as total_seconds
                    `)
                )
                .where({ user_id: id })
                .whereNotNull('completed_at')
                .first(),
        ])

        return {
            ...sanitizedUser,
            sport_level: sportLevel,
            stats: {
                workouts: Number(workoutsCount?.count || 0),
                sessions: Number(sessionsCount?.count || 0),
                total_time_minutes: Math.round(Number(totalTime?.total_seconds || 0) / 60),
            },
        }
    }

    /**
     * Enregistre le résultat d'un benchmark et calcule/met à jour le niveau de l'utilisateur
     * @param user_id ID de l'utilisateur
     * @param data Données du benchmark (sportId, workoutId, workoutName, result)
     */
    async saveBenchmarkResult(user_id: string, data: SaveBenchmarkResultDto) {
        const { sportId, workoutId, workoutName, result } = data

        // Vérifier si un profil sportif existe pour l'utilisateur et le sport actif
        const userSportProfile = await this.knex('user_sport_profiles')
            .where({ user_id, sport_id: sportId })
            .first()

        const existingResults = userSportProfile?.benchmark_results || {}

        const updatedResults = {
            ...existingResults,
            [workoutName]: {
                workout_id: workoutId,
                result,
                date: new Date().toISOString()
            }
        }

        // Calculer le niveau basé sur les résultats
        const calculatedLevel = this.calculateLevelFromBenchmarks(
            workoutName,
            result,
            userSportProfile?.sport_level || 'beginner'
        )

        if (userSportProfile) {
            // Mettre à jour le profil existant
            await this.knex('user_sport_profiles')
                .where({ user_id, sport_id: sportId })
                .update({
                    benchmark_results: JSON.stringify(updatedResults),
                    sport_level: calculatedLevel,
                    last_activity_at: new Date(),
                    updated_at: new Date()
                })
        } else {
            // Créer un nouveau profil sport
            await this.knex('user_sport_profiles').insert({
                user_id,
                sport_id: sportId,
                sport_level: calculatedLevel,
                benchmark_results: JSON.stringify(updatedResults),
                is_primary_sport: false,
                is_active: true,
                last_activity_at: new Date(),
                created_at: new Date(),
                updated_at: new Date()
            })
        }

        return {
            success: true,
            level: calculatedLevel,
            benchmark_results: updatedResults
        }
    }

    /**
     * Valide et retourne un niveau utilisateur valide
     * @param level Niveau à valider
     * @returns Niveau valide ou 'beginner' par défaut
     */
    private validateLevel(level: string): 'beginner' | 'intermediate' | 'advanced' | 'elite' {
        const validLevels = ['beginner', 'intermediate', 'advanced', 'elite'] as const
        type ValidLevel = typeof validLevels[number]

        if (validLevels.includes(level as ValidLevel)) {
            return level as ValidLevel
        }
        return 'beginner'
    }

    /**
     * Calcule le niveau de l'utilisateur basé sur les résultats du benchmark
     * Cette fonction utilise des standards de référence pour déterminer le niveau
     * @param workoutName Nom du workout benchmark
     * @param result Résultat du benchmark
     * @param currentLevel Niveau actuel de l'utilisateur
     * @returns Niveau calculé
     */
    private calculateLevelFromBenchmarks(
        workoutName: string,
        result: BenchmarkResultDto,
        currentLevel: string
    ): 'beginner' | 'intermediate' | 'advanced' | 'elite' {
        // Standards de référence pour les benchmarks
        const benchmarkStandards: Record<string, {
            elite: number,
            advanced: number,
            intermediate: number,
            beginner: number,
            metric: 'rounds' | 'time' | 'distance' | 'weight' | 'power'
        }> = {
            // ===== CROSSFIT =====
            'Cindy': { elite: 30, advanced: 20, intermediate: 15, beginner: 0, metric: 'rounds' },
            'Fran': { elite: 180, advanced: 360, intermediate: 600, beginner: 999999, metric: 'time' },
            'Helen': { elite: 480, advanced: 720, intermediate: 900, beginner: 999999, metric: 'time' },
            'Grace': { elite: 180, advanced: 420, intermediate: 720, beginner: 999999, metric: 'time' },

            // ===== RUNNING =====
            '5K Time Trial': { elite: 900, advanced: 1200, intermediate: 1800, beginner: 999999, metric: 'time' },
            'Cooper Test': { elite: 3000, advanced: 2400, intermediate: 1800, beginner: 0, metric: 'distance' },
            '1 Mile Time Trial': { elite: 300, advanced: 420, intermediate: 600, beginner: 999999, metric: 'time' },

            // ===== CYCLING =====
            'FTP Test (20 min)': { elite: 300, advanced: 250, intermediate: 200, beginner: 0, metric: 'power' },
            '5K Cycling Time Trial': { elite: 420, advanced: 540, intermediate: 720, beginner: 999999, metric: 'time' },

            // ===== MUSCULATION =====
            '1RM Bench Press': { elite: 140, advanced: 100, intermediate: 70, beginner: 0, metric: 'weight' },
            '1RM Back Squat': { elite: 180, advanced: 140, intermediate: 100, beginner: 0, metric: 'weight' },
            '1RM Deadlift': { elite: 220, advanced: 170, intermediate: 120, beginner: 0, metric: 'weight' }
        }

        const standard = benchmarkStandards[workoutName]
        if (!standard) {
            // Si pas de standard défini, garder le niveau actuel
            return this.validateLevel(currentLevel)
        }

        // Déterminer la valeur selon le type de métrique
        let value: number | undefined
        switch (standard.metric) {
            case 'rounds':
                value = result.rounds !== undefined ? result.rounds + (result.reps || 0) / 100 : undefined
                break
            case 'time':
                value = result.time_seconds
                break
            case 'distance':
                value = result.rounds // Pour Cooper Test, on stocke la distance en mètres dans rounds
                break
            case 'weight':
                value = result.weight
                break
            case 'power':
                value = result.weight // Pour FTP, on stocke la puissance en watts dans weight
                break
        }

        if (value === undefined) {
            // Si pas de valeur disponible, garder le niveau actuel
            return this.validateLevel(currentLevel)
        }

        // Calculer le niveau selon le type de métrique
        if (standard.metric === 'rounds' || standard.metric === 'distance' || standard.metric === 'weight' || standard.metric === 'power') {
            // Plus c'est élevé, mieux c'est
            if (value >= standard.elite) return 'elite'
            if (value >= standard.advanced) return 'advanced'
            if (value >= standard.intermediate) return 'intermediate'
            return 'beginner'
        } else {
            // Pour "time", moins c'est élevé, mieux c'est
            if (value <= standard.elite) return 'elite'
            if (value <= standard.advanced) return 'advanced'
            if (value <= standard.intermediate) return 'intermediate'
            return 'beginner'
        }
    }
}


