import { Injectable } from "@nestjs/common"
import { Knex } from "knex"
import { InjectModel } from "nest-knexjs"
import { UserQueryDto } from "src/users/dto"


@Injectable()
export class AdminUsersService {
    constructor(@InjectModel() private readonly knex: Knex) { }



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
            .select('users.*')
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

        // Masquer les mots de passe
        const sanitizedRows = rows.map(user => {
            const { password, ...rest } = user
            return rest
        })

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
            rows: sanitizedRows,
            count: Number(countResult?.count || 0),
        }
    }

    /**
     * Récupère un utilisateur par son ID.
     * @param {string} id - Identifiant de l'utilisateur.
     * @returns {Promise<User | null>} - Promesse qui renvoie l'utilisateur correspondant à l'identifiant ou null si l'utilisateur n'existe pas.
     * Le résultat inclut le mot de passe de l'utilisateur qui est masqué.
     * Les stats de l'utilisateur sont également récupérés et incluent le nombre de workout et de sessions qu'il a créées.
     */
    async findOne(id: string) {
        const user = await this.knex('users')
            .where({ id })
            .first()

        if (!user) return null

        // Masquer le mot de passe
        const { password, ...sanitizedUser } = user

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
            ...sanitizedUser,
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
     * Le résultat inclut le mot de passe de l'utilisateur qui est masqué.
     */
    async update(id: string, data: any) {
        const updateData: Partial<{ email: string; firstName: string; lastName: string; role: string; is_active: boolean }> = {}

        if (data.email !== undefined) updateData.email = data.email
        if (data.firstName !== undefined) updateData.firstName = data.firstName
        if (data.lastName !== undefined) updateData.lastName = data.lastName
        if (data.role !== undefined) updateData.role = data.role
        if (data.is_active !== undefined) updateData.is_active = data.is_active

        const [row] = await this.knex('users')
            .where({ id })
            .update(updateData)
            .returning('*')

        if (!row) return null

        // Masquer le mot de passe
        const { password, ...sanitizedUser } = row

        return sanitizedUser
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


    /**
     * Récupère les workouts créés par un utilisateur.
     * @param {string} id - Identifiant de l'utilisateur.
     * @returns {Promise<Workout[]>} - Promesse qui renvoie la liste des workouts créés par l'utilisateur.
     * Les résultats incluent le nom du sport correspondant à chaque workout.
     * Les résultats sont paginés et limités à 20 éléments.
     * Les résultats sont triés par date de création décroissante.
     */
    async getUserWorkouts(id: string) {
        return this.knex('workouts')
            .select('workouts.*', 'sports.name as sport_name')
            .leftJoin('sports', 'workouts.sport_id', 'sports.id')
            .where('workouts.created_by_user_id', id)
            .orderBy('workouts.created_at', 'desc')
            .limit(20)
    }


    /**
     * Récupère les sessions d'un utilisateur.
     * @param {string} id - Identifiant de l'utilisateur.
     * @returns {Promise<WorkoutSession[]>} - Promesse qui renvoie la liste des sessions de l'utilisateur.
     * Les résultats incluent le nom du workout correspondant à chaque session.
     * Les résultats sont paginés et limités à 20 éléments.
     * Les résultats sont triés par date de création décroissante.
     * */
    async getUserSessions(id: string) {
        return this.knex('workout_sessions')
            .select('workout_sessions.*', 'workouts.name as workout_name')
            .leftJoin('workouts', 'workout_sessions.workout_id', 'workouts.id')
            .where('workout_sessions.user_id', id)
            .orderBy('workout_sessions.created_at', 'desc')
            .limit(20)
    }

}