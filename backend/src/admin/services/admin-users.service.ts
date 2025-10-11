import { Injectable } from "@nestjs/common"
import { Knex } from "knex"
import { InjectModel } from "nest-knexjs"
import { UserQueryDto } from "src/users/dto"


@Injectable()
export class AdminUsersService {
    constructor(@InjectModel() private readonly knex: Knex) { }



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

    async delete(id: string) {
        await this.knex('users').where({ id }).delete()
        return { success: true }
    }


    async getUserWorkouts(id: string) {
        return this.knex('workouts')
            .select('workouts.*', 'sports.name as sport_name')
            .leftJoin('sports', 'workouts.sport_id', 'sports.id')
            .where('workouts.created_by_user_id', id)
            .orderBy('workouts.created_at', 'desc')
            .limit(20)
    }


    async getUserSessions(id: string) {
        return this.knex('workout_sessions')
            .select('workout_sessions.*', 'workouts.name as workout_name')
            .leftJoin('workouts', 'workout_sessions.workout_id', 'workouts.id')
            .where('workout_sessions.user_id', id)
            .orderBy('workout_sessions.created_at', 'desc')
            .limit(20)
    }

}