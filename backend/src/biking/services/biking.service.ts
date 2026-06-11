import { Injectable, NotFoundException } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { BikingSessionQueryDto, CreateBikingSessionDto, GenerateBikingSessionDto, UpdateBikingSessionDto } from '../dto/biking.dto'
import { GeneratedBikingPlanValidated } from '../schemas/biking.schema'
import { AIBikingGeneratorService } from './ai-biking-generator.service'


@Injectable()
export class BikingService {
    constructor(
        @InjectModel() private readonly knex: Knex,
        private readonly aiGenerator: AIBikingGeneratorService,
    ) { }

    async findAll(userId: string, query: BikingSessionQueryDto) {
        const { limit = '20', offset = '0', start_date, end_date, bike_type } = query

        let q = this.knex('biking_sessions').where('user_id', userId)

        if (start_date) q = q.where('session_date', '>=', start_date)
        if (end_date) q = q.where('session_date', '<=', end_date)
        if (bike_type) q = q.where('bike_type', bike_type)

        const [rows, countResult] = await Promise.all([
            q.clone().orderBy('session_date', 'desc').limit(Number(limit)).offset(Number(offset)),
            q.clone().count('* as count').first(),
        ])

        return { rows, count: Number(countResult?.count ?? 0) }
    }

    async findOne(id: string, userId: string) {
        const session = await this.knex('biking_sessions').where({ id, user_id: userId }).first()
        if (!session) throw new NotFoundException('Séance vélo non trouvée')
        return session
    }

    async getStats(userId: string) {
        const [agg, breakdown] = await Promise.all([
            this.knex('biking_sessions')
                .where('user_id', userId)
                .select(
                    this.knex.raw('COUNT(*) as total_sessions'),
                    this.knex.raw('COALESCE(SUM(distance_km), 0) as total_km'),
                    this.knex.raw('COALESCE(SUM(duration_seconds), 0) as total_seconds'),
                    this.knex.raw('AVG(avg_power_watts) as avg_power'),
                    this.knex.raw('COALESCE(MAX(distance_km), 0) as longest_ride_km'),
                )
                .first(),
            this.knex('biking_sessions')
                .select('bike_type')
                .count('* as count')
                .where('user_id', userId)
                .groupBy('bike_type'),
        ])

        const typeBreakdown = breakdown.reduce<Record<string, number>>((acc, row) => {
            acc[row.bike_type] = Number(row.count)
            return acc
        }, {})

        return {
            total_sessions: Number(agg.total_sessions),
            total_km: Math.round(Number(agg.total_km) * 10) / 10,
            total_hours: Math.round((Number(agg.total_seconds) / 3600) * 10) / 10,
            avg_power_watts: agg.avg_power ? Math.round(Number(agg.avg_power)) : null,
            longest_ride_km: Math.round(Number(agg.longest_ride_km) * 10) / 10,
            type_breakdown: typeBreakdown,
        }
    }

    async create(userId: string, data: CreateBikingSessionDto) {
        const [session] = await this.knex('biking_sessions')
            .insert({ user_id: userId, source: 'manual', ...data })
            .returning('*')
        return session
    }

    async createFromAIPlan(userId: string, plan: GeneratedBikingPlanValidated, scheduledActivityId?: string) {
        const [session] = await this.knex('biking_sessions')
            .insert({
                user_id: userId,
                session_date: new Date().toISOString().slice(0, 10),
                bike_type: plan.bike_type,
                source: 'ai_generated',
                duration_seconds: plan.estimated_duration_minutes * 60,
                ai_plan: JSON.stringify(plan),
                scheduled_activity_id: scheduledActivityId || null,
            })
            .returning('*')
        return session
    }

    async generateAndSave(userId: string, params: GenerateBikingSessionDto) {
        const plan = await this.aiGenerator.generateBikingSession(userId, params)
        return this.createFromAIPlan(userId, plan)
    }

    async generatePreview(userId: string, params: GenerateBikingSessionDto): Promise<GeneratedBikingPlanValidated> {
        return this.aiGenerator.generateBikingSession(userId, params)
    }

    async update(id: string, userId: string, data: UpdateBikingSessionDto) {
        await this.findOne(id, userId)
        const [updated] = await this.knex('biking_sessions')
            .where({ id, user_id: userId })
            .update({ ...data, updated_at: new Date() })
            .returning('*')
        return updated
    }

    async delete(id: string, userId: string) {
        const deleted = await this.knex('biking_sessions').where({ id, user_id: userId }).delete()
        if (deleted === 0) throw new NotFoundException('Séance vélo non trouvée')
        return { success: true }
    }
}