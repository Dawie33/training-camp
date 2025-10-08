import { IsBoolean, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator'

export class CreateUserDto {
  @IsEmail()
  email!: string

  @IsString()
  @MinLength(6)
  password!: string

  @IsString()
  firstName!: string

  @IsString()
  lastName!: string

  @IsOptional()
  @IsString()
  dateOfBirth?: string

  @IsOptional()
  @IsIn(['male', 'female', 'other'])
  gender?: 'male' | 'female' | 'other'

  @IsOptional()
  @IsIn(['user', 'admin', 'coach'])
  role?: 'user' | 'admin' | 'coach'
}

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  email?: string

  @IsOptional()
  @IsString()
  firstName?: string

  @IsOptional()
  @IsString()
  lastName?: string

  @IsOptional()
  @IsIn(['user', 'admin', 'coach'])
  role?: 'user' | 'admin' | 'coach'

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}

export class UserQueryDto {
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
  @IsIn(['user', 'admin', 'coach'])
  role?: 'user' | 'admin' | 'coach'

  @IsOptional()
  @IsString()
  orderBy?: string

  @IsOptional()
  @IsIn(['asc', 'desc'])
  orderDir?: 'asc' | 'desc'
}
