import { IsNotEmpty, IsObject, IsOptional, IsString, IsUUID } from 'class-validator'

export class CreateEquipmentDto {
    @IsString()
    @IsNotEmpty()
    label!: string

    @IsString()
    @IsOptional()
    slug?: string

    @IsObject()
    @IsOptional()
    meta?: Record<string, any>

    @IsString()
    @IsOptional()
    image?: string
}

export class UpdateEquipmentDto {
    @IsString()
    @IsOptional()
    label?: string

    @IsString()
    @IsOptional()
    slug?: string

    @IsObject()
    @IsOptional()
    meta?: Record<string, any>

    @IsString()
    @IsOptional()
    image?: string
}


export class UserEquipmentDto {
    @IsUUID()
    @IsNotEmpty()
    user_id!: string

    @IsUUID()
    @IsNotEmpty()
    equipment_id!: string

    @IsOptional()
    @IsObject()
    meta?: Record<string, any>
}

export class EquipmentQueryDto {
    limit?: string
    offset?: string
    search?: string
    orderBy?: string
    orderDir?: string
}