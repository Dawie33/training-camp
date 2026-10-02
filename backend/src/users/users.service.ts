import { Injectable } from "@nestjs/common"
import { Knex } from "knex"
import { InjectModel } from "nest-knexjs"
import { UserContextService } from "src/workouts/services/user-context.service"
import { UpdateUserDto, UserProfile, UserQueryDto } from "./dto"

/**
 * Colonnes de `users` renvoyées au client. C'est une liste blanche : une colonne
 * n'est exposée que si elle est listée ici. Ne jamais y ajouter password,
 * google_refresh_token ou medical_notes.
 */
export const PUBLIC_USER_COLUMNS = [
    'id',
    'email',
    'firstName',
    'lastName',
    'role',
    'sport_level',
    'height',
    'weight',
    'body_fat_percentage',
    'equipment_available',
    'created_at',
    'updated_at',
]

type PublicUser = Omit<UserProfile, 'stats'>

@Injectable()

export class UsersService {
    constructor(
        @InjectModel() private readonly knex: Knex,
        private readonly userContextService: UserContextService
    ) { }

    /**
     * Récupère un utilisateur par son ID avec ses statistiques.
     * @param {string} id - Identifiant de l'utilisateur.
     * @returns {Promise<User | null>} - Promesse qui renvoie l'utilisateur correspondant à l'identifiant ou null si l'utilisateur n'existe pas.
     * Seules les colonnes de PUBLIC_USER_COLUMNS sont renvoyées.
     * Les stats de l'utilisateur sont également récupérés et incluent le nombre de workout et de sessions qu'il a créées.
     */
    async getProfile(id: string) {
        const user: PublicUser | undefined = await this.knex('users')
            .where({ id })
            .first(PUBLIC_USER_COLUMNS)

        if (!user) return null

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
            ...user,
            stats: {
                workouts: Number(workoutsCount?.count || 0),
                sessions: Number(sessionsCount?.count || 0),
                total_time_minutes: Math.round(Number(totalTime?.total_seconds || 0) / 60),
            },
        }
    }


    /**
     * Récupère la liste des utilisateurs avec filtres et recherche.
     * @param {UserQueryDto} query - Paramètres de la requête.
     * @param {string} query.limit - Nombre d'utilisateurs à récupérer. Par défaut : 20.
     * @param {string} query.offset - Décalage de pagination. Par défaut : 0.
     * @param {string} query.search - Paramètre de recherche. S'il est défini, la valeur donnée dans l'étiquette de l'utilisateur sera recherchée.
     * @param {string} query.role - Rôle de l'utilisateur. Par défaut : tous les utilisateurs sont récupérés.
     * @param {string} query.orderBy - Colonne de tri. Par défaut : « created_at ».
     * @param {string} query.orderDir - Sens de l'ordre. Par défaut : « desc ».
     * @returns {Promise<{rows: User[], count: number}>} - Promesse qui renvoie un objet contenant les lignes et le nombre.
     */
    async findAll({ limit = '20', offset = '0', search = '', role, orderBy = 'created_at', orderDir = 'desc' }: UserQueryDto
    ) {
        let query = this.knex('users')
            .select(PUBLIC_USER_COLUMNS.map((column) => `users.${column}`))
            .select(this.knex.raw('COUNT(DISTINCT workouts.id) as workouts_count'))
            .leftJoin('workouts', 'users.id', 'workouts.created_by_user_id')
            .groupBy('users.id')

        if (search) {
            query = query.where(function () {
                this.where('users.email', 'ilike', `%${search}%`)
                    .orWhere('users.firstName', 'ilike', `%${search}%`)
                    .orWhere('users.lastName', 'ilike', `%${search}%`)
            })
        }

        if (role) {
            query = query.where('users.role', role)
        }

        const rows = await query
            .limit(Number(limit))
            .offset(Number(offset))
            .orderBy(orderBy, orderDir)

        const countQuery = this.knex('users').count('* as count')

        if (search) {
            countQuery.where(function () {
                this.where('email', 'ilike', `%${search}%`)
                    .orWhere('firstName', 'ilike', `%${search}%`)
                    .orWhere('lastName', 'ilike', `%${search}%`)
            })
        }
        if (role) {
            countQuery.where('role', role)
        }

        const countResult = await countQuery.first()

        return {
            rows,
            count: Number(countResult?.count || 0),
        }
    }

    /**
     * Récupère un utilisateur par son ID.
     * @param {string} id - Identifiant de l'utilisateur.
     * @returns {Promise<User | null>} - Promesse qui renvoie l'utilisateur correspondant à l'identifiant ou null si l'utilisateur n'existe pas.
     * Seules les colonnes de PUBLIC_USER_COLUMNS sont renvoyées.
     * Les stats de l'utilisateur sont également récupérés et incluent le nombre de workout et de sessions qu'il a créées.
     */
    async findOne(id: string) {
        const user: PublicUser | undefined = await this.knex('users')
            .where({ id })
            .first(PUBLIC_USER_COLUMNS)

        if (!user) return null

        // Récupérer les stats de l'utilisateur
        const [workoutsCount, sessionsCount] = await Promise.all([
            this.knex('workouts')
                .where({ created_by_user_id: id })
                .count('* as count')
                .first(),
            this.knex('workout_sessions')
                .where({ user_id: id })
                .count('* as count')
                .first(),
        ])

        return {
            ...user,
            stats: {
                workouts: Number(workoutsCount?.count || 0),
                sessions: Number(sessionsCount?.count || 0),
            },
        }
    }


    /**
     * Mettre à jour un utilisateur.
     * @param {string} id - Identifiant de l'utilisateur.
     * @param {Partial<{ email: string; firstName: string; lastName: string; role: string; is_active: boolean }>} data - Données à mettre à jour.
     * @returns {Promise<User | null>} - Promesse qui renvoie l'utilisateur mis à jour ou null si l'utilisateur n'existe pas.
     * Seules les colonnes de PUBLIC_USER_COLUMNS sont renvoyées.
     */
    async update(id: string, data: UpdateUserDto) {
        const updateData: Record<string, unknown> = {}

        if (data.email !== undefined) updateData.email = data.email
        if (data.firstName !== undefined) updateData.firstName = data.firstName
        if (data.lastName !== undefined) updateData.lastName = data.lastName
        if (data.role !== undefined) updateData.role = data.role
        if (data.isActive !== undefined) updateData.is_active = data.isActive
        if (data.sport_level !== undefined) updateData.sport_level = data.sport_level
        if (data.height !== undefined) updateData.height = data.height
        if (data.weight !== undefined) updateData.weight = data.weight
        if (data.body_fat_percentage !== undefined) updateData.body_fat_percentage = data.body_fat_percentage
        if (data.equipment_available !== undefined) updateData.equipment_available = JSON.stringify(data.equipment_available)

        const [row]: PublicUser[] = await this.knex('users')
            .where({ id })
            .update(updateData)
            .returning(PUBLIC_USER_COLUMNS)

        if (!row) return null

        this.userContextService.invalidateCache(id)

        return row
    }

    /**
     * Supprime un utilisateur.
     * @param {string} id - Identifiant de l'utilisateur à supprimer.
     * @returns {Promise<{success: boolean}>} - Promesse qui renvoie un objet contenant le statut de la suppression.
     */
    async delete(id: string) {
        await this.knex('users').where({ id }).delete()
        return { success: true }
    }


}


