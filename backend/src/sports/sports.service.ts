import { BadRequestException, Injectable } from "@nestjs/common"
import { Knex } from "knex"
import { InjectModel } from "nest-knexjs"
import { SportsQueryDto } from "./dto/sports.dto"

@Injectable()
export class SportsService {
    constructor(@InjectModel() private readonly knex: Knex) { }

    /**
     * Retrieves a paginated list of sports.
     * @param param0 { limit, offset, orderBy, orderDir }
     * @returns A promise that resolves to an object containing the rows and count.
     */
    async findAll({
        limit = '20',
        offset = '0',
        orderBy = 'created_at',
        orderDir = 'desc',
        category = '',
        isActive = false,
        search = ''
    }: SportsQueryDto) {
        let query = this.knex("sports").select("*")

        // Recherche par nom
        if (search) {
            query = query.where('name', 'ilike', `%${search}%`)
        }

        // Filtre par catégorie
        if (category) {
            query = query.where('category', category)
        }

        if (isActive) {
            query = query.where('isActive', isActive)
        }


        const rows = await query
            .limit(Number(limit))
            .offset(Number(offset))
            .orderBy(orderBy, orderDir)

        // Count avec les mêmes filtres
        let countQuery = this.knex("sports").count({ count: "*" })

        if (search) {
            countQuery = countQuery.where('name', 'ilike', `%${search}%`)
        }
        if (category) {
            countQuery = countQuery.where('category', category)
        }
        if (isActive) {
            countQuery = countQuery.where('isActive', isActive)
        }


        const countResult = await countQuery.first()
        const count = Number(countResult?.count)

        return { rows, count }
    }

    /**
     * Retrieve a sport by its ID.
     * @param id The ID of the sport.
     * @returns The sport with the given ID.
     * @throws {BadRequestException} If the ID is empty or null.
     * @throws {BadRequestException} If no sport with the given ID exists.
     */
    async getById(id: string) {

        if (!id) {
            throw new BadRequestException('id du sport manquant')
        }
        const sport = await this.knex("sports").where({ id }).first()

        if (!sport) {
            throw new BadRequestException('Sport introuvable')
        }

        return sport
    }

}