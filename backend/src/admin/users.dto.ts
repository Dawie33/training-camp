import { Type } from "class-transformer"
import { IsIn, IsOptional, IsString } from "class-validator"

export class UsersQueryDto {
    @IsOptional()
    @Type(() => String)
    @IsString()

    limit?: string

    @IsOptional()
    @Type(() => String)
    @IsString()
    offset?: string

    @IsOptional()
    @IsString()
    orderBy?: string

    @IsOptional()
    @IsIn(['asc', 'desc'])
    orderDir?: 'asc' | 'desc'

    @IsOptional()
    @Type(() => String)
    search?: string

    @IsOptional()
    @Type(() => String)
    role?: string

}