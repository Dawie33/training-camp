import { Injectable } from "@nestjs/common"
import { Knex } from "knex"
import { InjectModel } from "nest-knexjs"
import { EquipmentQueryDto } from "./dto"

@Injectable()
export class EquipmentsService {
    constructor(@InjectModel() private readonly knex: Knex) { }

    /**
     * Récupération de la liste des equipements.
     * @param param0 { limit, offset, search, orderBy, orderDir }
     * @returns A promise that resolves to an object containing the rows and count.
     */
    async findAll({ limit = '50', offset = '0', search, orderBy = 'created_at', orderDir = 'desc' }: EquipmentQueryDto) {
        let query = this.knex('equipments').select('*')

        if (search) {
            query = query.where('label', 'ilike', `%${search}%`)
        }

        const rows = await query
            .limit(Number(limit))
            .offset(Number(offset))
            .orderBy(orderBy, orderDir)

        const countResult = await this.knex('equipments')
            .count('* as count')
            .where((builder) => {
                if (search) {
                    builder.where('label', 'ilike', `%${search}%`)
                }
            })
            .first()

        return {
            rows,
            count: Number(countResult?.count || 0),
        }
    }

}