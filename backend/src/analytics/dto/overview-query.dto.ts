import { Type } from 'class-transformer'
import { IsInt, IsOptional, Max, Min } from 'class-validator'

/** Profondeur d'analyse appliquée quand la page ne précise pas de période. */
export const DEFAULT_OVERVIEW_MONTHS = 3

export class OverviewQueryDto {
  /**
   * Profondeur d'analyse en mois, entière : `setMonth` tronquerait une valeur décimale,
   * et la période annoncée ne correspondrait plus à celle réellement analysée.
   */
  // Les paramètres d'URL arrivent en texte : @Type les convertit avant la validation
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  months: number = DEFAULT_OVERVIEW_MONTHS
}
