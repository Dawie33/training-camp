import { BadRequestException, Injectable } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { EquipmentQueryDto } from './dto'
import { Equipment } from './types/equipments.types'

@Injectable()
export class EquipmentsService {
  constructor(@InjectModel() private readonly knex: Knex) {}

  /**
   * Récupérer tous les équipements.
   * @param {QueryDto} query - Paramètres de la requête.
   * @param {string} query.limit - Nombre d'équipements à récupérer. Par défaut : 50.
   * @param {string} query.offset - Décalage de pagination. Par défaut : 0.
   * @param {string} query.search - Paramètre de recherche. S'il est défini, la valeur donnée dans l'étiquette de l'équipement sera recherchée.
   * @param {string} query.orderBy - Colonne de tri. Par défaut : « created_at ».
   * @param {string} query.orderDir - Sens de l'ordre. Par défaut : « desc ».
   * @returns {Promise<{rows: Equipment[], count: number}>} - Promesse qui renvoie un objet contenant les lignes et le nombre.
   **/
  async findAll({
    limit = '50',
    offset = '0',
    search,
    orderBy = 'created_at',
    orderDir = 'desc',
  }: EquipmentQueryDto): Promise<{ rows: Equipment[]; count: number }> {
    let query = this.knex<Equipment>('equipments').select('*')

    if (search) {
      query = query.where('label', 'ilike', `%${search}%`)
    }

    const rows = await query.limit(Number(limit)).offset(Number(offset)).orderBy(orderBy, orderDir)

    const countResult = await this.knex('equipments')
      .count('* as count')
      .where(builder => {
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

  /**
   * Récupère un equipment par son ID.
   * @param {string} id - ID de l'équipement.
   * @returns {Promise<Equipment>} - Promesse qui renvoie l'équipement trouvé.
   */
  async findOne(id: string): Promise<Equipment> {
    if (!id) {
      throw new BadRequestException("id de l'équipement manquant")
    }
    const equipment = await this.knex<Equipment>('equipments').where({ id }).first()

    if (!equipment) {
      throw new BadRequestException('Equipments introuvable')
    }

    return equipment
  }
}
