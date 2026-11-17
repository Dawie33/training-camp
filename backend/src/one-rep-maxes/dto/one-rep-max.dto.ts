import { IsIn, IsNumber, IsPositive, Max, ValidateBy, ValidateIf, isISO8601 } from 'class-validator'
import { ONE_REP_MAX_LIFTS, ONE_REP_MAX_MAX_KG, ONE_REP_MAX_SOURCES } from '../one-rep-max.constants'
import type { OneRepMaxLift, OneRepMaxSource } from '../one-rep-max.constants'
import { toParisDate } from '../../common/utils/date-only'

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

  @IsIn(ONE_REP_MAX_SOURCES)
  source!: OneRepMaxSource

  @ValidateIf((_object, value) => value !== undefined)
  @ValidateBy({
    name: 'measurementDate',
    validator: {
      validate: (value: unknown) =>
        typeof value === 'string' &&
        /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value) &&
        isISO8601(value, { strict: true }) &&
        (value.length === 10 ? value <= toParisDate(new Date()) : Date.parse(value) <= Date.now()),
      defaultMessage: () => 'measured_at doit être une date ISO valide non future (fuseau requis avec une heure)',
    },
  })
  measured_at?: string
}
