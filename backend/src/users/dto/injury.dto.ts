import { ArrayUnique, IsArray, IsIn, IsOptional, IsString, Matches, MaxLength } from 'class-validator'
import {
  INJURY_NOTES_MAX_LENGTH,
  INJURY_SEVERITIES,
  INJURY_SIDES,
  INJURY_SINCE_REGEX,
  INJURY_STATUSES,
  INJURY_ZONES,
  PAINFUL_PATTERNS,
} from 'src/common/injuries/injury.constants'
import type {
  Injury,
  InjurySeverity,
  InjurySide,
  InjuryStatus,
  InjuryZone,
  PainfulPattern,
} from 'src/common/injuries/injury.constants'

/** Une blessure envoyée par le front dans PATCH /users/me (voir common/injuries). */
export class InjuryDto implements Injury {
  @IsIn(INJURY_ZONES)
  zone!: InjuryZone

  @IsIn(INJURY_SIDES)
  side!: InjurySide

  @IsIn(INJURY_STATUSES)
  status!: InjuryStatus

  @IsIn(INJURY_SEVERITIES)
  severity!: InjurySeverity

  @IsArray()
  @ArrayUnique()
  @IsIn(PAINFUL_PATTERNS, { each: true })
  painful_patterns!: PainfulPattern[]

  @IsOptional()
  @Matches(INJURY_SINCE_REGEX, { message: 'since must be in format YYYY-MM' })
  since?: string

  @IsOptional()
  @IsString()
  @MaxLength(INJURY_NOTES_MAX_LENGTH)
  notes?: string
}
