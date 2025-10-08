import { IsBoolean, IsOptional, IsString } from "class-validator"

export class SportsQueryDto {

    @IsOptional()
    @IsString()
    category?: string

    @IsOptional()
    @IsBoolean()
    isActive?: boolean

    @IsOptional()
    @IsString()
    search?: string

    @IsOptional()
    @IsString()
    limit?: string

    @IsOptional()
    @IsString()
    offset?: string

    @IsOptional()
    @IsString()
    orderBy?: string

    @IsOptional()
    @IsString()
    orderDir?: 'asc' | 'desc'

}