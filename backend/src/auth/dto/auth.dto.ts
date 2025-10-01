import { IsEmail, IsString, MinLength, IsOptional, IsDateString, IsIn } from 'class-validator'

/**
 * DTOs pour l'authentification
 */
export class SignupDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  password: string

  @IsString()
  firstName: string

  @IsString()
  lastName: string

  @IsOptional()
  @IsDateString()
  dateOfBirth?: Date

  @IsOptional()
  @IsIn(['male', 'female', 'other'])
  gender?: 'male' | 'female' | 'other'
}

export class LoginDto {
  @IsEmail()
  email: string

  @IsString()
  @MinLength(6)
  password: string
}

export class AuthResponseDto {
  access_token: string
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}
