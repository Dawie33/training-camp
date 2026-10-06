import { IsIn, IsNumber, IsPositive, Max } from 'class-validator'
import { ONE_REP_MAX_LIFTS, ONE_REP_MAX_MAX_KG } from '../one-rep-max.constants'
import type { OneRepMaxLift } from '../one-rep-max.constants'

/** Paramètre `:lift` de PUT /one-rep-maxes/:lift */
export class OneRepMaxLiftParamDto {
  @IsIn(ONE_REP_MAX_LIFTS)
  lift!: OneRepMaxLift
}

export class UpsertOneRepMaxDto {
  // 2 décimales : la précision de la colonne numeric(7,2)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  @Max(ONE_REP_MAX_MAX_KG)
  value!: number

  @IsIn(['real', 'estimated'])
  source!: 'real' | 'estimated'
}
