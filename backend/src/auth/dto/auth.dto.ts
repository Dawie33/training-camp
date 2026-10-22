import { IsByteLength, IsEmail, IsString, MinLength } from 'class-validator'
import { NormalizeEmail } from 'src/common/decorators/normalize-email.decorator'

/**
 * DTOs pour l'authentification
 */
export class SignupDto {
  @NormalizeEmail()
  @IsEmail()
  email: string

  // bcrypt ignore ce qui dépasse 72 octets : la limite porte sur les octets UTF-8, pas les caractères (é = 2 octets)
  @IsString()
  @IsByteLength(6, 72)
  password: string

  @IsString()
  firstName: string

  @IsString()
  lastName: string
}

export class LoginDto {
  @NormalizeEmail()
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
    role: string
  }
}
