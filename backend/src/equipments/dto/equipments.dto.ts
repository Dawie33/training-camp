import { Type } from 'class-transformer'
import { IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

/** Colonnes de tri autorisées : une colonne inconnue ferait échouer la requête SQL (500). */
export const EQUIPMENT_ORDER_BY = ['label', 'slug', 'created_at', 'updated_at'] as const
/** Le catalogue compte une cinquantaine d'entrées : 100 suffit pour tout récupérer en une fois. */
export const EQUIPMENTS_MAX_LIMIT = 100

export class EquipmentQueryDto {
  // Les paramètres d'URL arrivent en texte : @Type les convertit avant la validation
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(EQUIPMENTS_MAX_LIMIT)
  limit?: number

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string

  @IsOptional()
  @IsIn(EQUIPMENT_ORDER_BY)
  orderBy?: (typeof EQUIPMENT_ORDER_BY)[number]

  @IsOptional()
  @IsIn(['asc', 'desc'])
  orderDir?: 'asc' | 'desc'
}
