import { Injectable } from "@nestjs/common"
import { Knex } from "knex"
import { InjectModel } from "nest-knexjs"
import { QueryDto } from "../workouts/dto/workout.dto"

@Injectable()
export class SportsService {
    constructor(@InjectModel() private readonly knex: Knex) { }

    /**
     * Retrieves a paginated list of sports.
     * @param param0 { limit, offset, orderBy, orderDir }
     * @returns A promise that resolves to an object containing the rows and count.
     */
    async findAll({ limit = '20', offset = '0', orderBy = 'created_at', orderDir = 'desc' }: QueryDto) {
        try {
            const rows = await this.knex("sports")
                .select("*")
                .limit(Number(limit))
                .offset(Number(offset))
                .orderBy(orderBy, orderDir)

            const countResult = await this.knex("sports").count({ count: "*" }).first()
            const count = Number(countResult?.count)
            return { rows, count }
        } catch (error) {
            throw new Error(`Error fetching sports: ${error.message}`)
        }
    }

    async getById(id: string) {
        return this.knex("sports").where({ id }).first()
    }

}