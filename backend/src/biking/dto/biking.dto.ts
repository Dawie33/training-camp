import { Type } from 'class-transformer'
import {
    IsDateString,
    IsEnum,
    IsIn,
    IsInt,
    IsNumber,
    IsOptional,
    IsString,
    IsUUID,
    Max,
    Min,
} from 'class-validator'

export type BikeType = 'endurance' | 'sweet_spot' | 'intervals' | 'ftp_test' | 'recovery' | 'race'
export type BikeSource = 'manual' | 'ai_generated'

export class CreateBikingSessionDto {
    @IsDateString()
    session_date!: string

    @IsEnum(['endurance', 'sweet_spot', 'intervals', 'ftp_test', 'recovery', 'race'])
    bike_type!: BikeType

    @IsOptional()
    @IsUUID()
    scheduled_activity_id?: string

    @IsOptional()
    @IsNumber()
    @Min(0)
    distance_km?: number

    @IsOptional()
    @IsInt()
    @Min(0)
    duration_seconds?: number

    @IsOptional()
    @IsInt()
    @Min(0)
    avg_power_watts?: number

    @IsOptional()
    @IsInt()
    @Min(0)
    ftp_watts?: number

    @IsOptional()
    @IsInt()
    avg_heart_rate?: number

    @IsOptional()
    @IsInt()
    max_heart_rate?: number

    @IsOptional()
    @IsInt()
    calories?: number

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    perceived_effort?: number

    @IsOptional()
    @IsString()
    notes?: string
}

export class UpdateBikingSessionDto {
    @IsOptional()
    @IsDateString()
    session_date?: string

    @IsOptional()
    @IsEnum(['endurance', 'sweet_spot', 'intervals', 'ftp_test', 'recovery', 'race'])
    bike_type?: BikeType

    @IsOptional()
    @IsNumber()
    @Min(0)
    distance_km?: number

    @IsOptional()
    @IsInt()
    @Min(0)
    duration_seconds?: number

    @IsOptional()
    @IsInt()
    @Min(0)
    avg_power_watts?: number

    @IsOptional()
    @IsInt()
    @Min(0)
    ftp_watts?: number

    @IsOptional()
    @IsInt()
    avg_heart_rate?: number

    @IsOptional()
    @IsInt()
    max_heart_rate?: number

    @IsOptional()
    @IsInt()
    calories?: number

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(10)
    perceived_effort?: number

    @IsOptional()
    @IsString()
    notes?: string
}

export class BikingSessionQueryDto {
    @IsOptional()
    @Type(() => String)
    limit?: string

    @IsOptional()
    @Type(() => String)
    offset?: string

    @IsOptional()
    @IsDateString()
    start_date?: string

    @IsOptional()
    @IsDateString()
    end_date?: string

    @IsOptional()
    @IsIn(['endurance', 'sweet_spot', 'intervals', 'ftp_test', 'recovery', 'race'])
    bike_type?: BikeType
}

export class GenerateBikingSessionDto {
    @IsEnum(['endurance', 'sweet_spot', 'intervals', 'ftp_test', 'recovery', 'race'])
    bike_type!: BikeType

    @IsInt()
    @Min(10)
    @Max(300)
    duration_minutes!: number

    @IsOptional()
    @IsInt()
    @Min(50)
    ftp_watts?: number

    @IsOptional()
    @IsIn(['beginner', 'intermediate', 'advanced', 'elite'])
    level?: string

    @IsOptional()
    @IsString()
    goal?: string

    @IsOptional()
    @IsString()
    additional_instructions?: string
}