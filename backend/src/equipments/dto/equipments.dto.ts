import { IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator'

export class UserEquipmentDto {
    @IsUUID()
    @IsNotEmpty()
    user_id!: string

    @IsUUID()
    @IsNotEmpty()
    equipment_id!: string

    @IsOptional()
    @IsObject()
    meta?: Record<string, string>
}

export class EquipmentQueryDto {
    @IsOptional()
    @IsString()
    limit?: string

    @IsOptional()
    @IsString()
    offset?: string

    @IsOptional()
    @IsString()
    search?: string

    @IsOptional()
    @IsString()
    orderBy?: string

    @IsOptional()
    @IsString()
    orderDir?: 'asc' | 'desc'
}