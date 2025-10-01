import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { AuthResponseDto, LoginDto, SignupDto } from './dto/auth.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectModel() private readonly knex: Knex,
    private jwtService: JwtService
  ) { }

  /**
   * Inscrire un nouvel utilisateur.
   * @param {SignupDto} signupDto - les données de l'utilisateur.
   * @returns {Promise<AuthResponseDto>} - le token JWT et les données de l'utilisateur.
   * @throws {ConflictException} - si l'utilisateur existe deja.
   */
  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName, dateOfBirth, gender } = signupDto

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.knex('users').where({ email }).first()
    if (existingUser) {
      throw new ConflictException('Email already exists')
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, 10)

    // Créer l'utilisateur
    const [user] = await this.knex('users')
      .insert({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        dateOfBirth,
        gender,
      })
      .returning(['id', 'email', 'firstName', 'lastName'])

    // Générer le token JWT
    const payload = { sub: user.id, email: user.email }
    const access_token = this.jwtService.sign(payload)

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    }
  }

  /**
   * Authentifier un utilisateur.
   * @param {LoginDto} loginDto - les données de connexion de l'utilisateur.
   * @returns {Promise<AuthResponseDto>} - le token JWT et les données de l'utilisateur.
   * @throws {UnauthorizedException} - si les données de connexion sont invalides.
   */
  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto

    // Trouver l'utilisateur
    const user = await this.knex('users')
      .where({ email })
      .first()

    if (!user) {
      throw new UnauthorizedException('Les données de connexion sont invalides')
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Les données de connexion sont invalides')
    }

    // Mettre à jour lastLoginAt
    await this.knex('users')
      .where({ id: user.id })
      .update({ lastLoginAt: this.knex.fn.now() })

    // Générer le token JWT
    const payload = { sub: user.id, email: user.email }
    const access_token = this.jwtService.sign(payload)

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      },
    }
  }

  /**
   * Validation de l'utilisateur en fonction de son identifiant.
   * Si l'utilisateur n'est pas trouvé ou n'est pas actif on leve une exception.
   * @param {string} userId - Identifiant de l'utilisateur.
   * @returns {Promise<User>} - utilisateur si existant.
   */
  async validateUser(userId: string) {
    const user = await this.knex('users')
      .where({ id: userId })
      .first(['id', 'email', 'firstName', 'lastName', 'isActive'])

    if (!user || !user.isActive) {
      return null
    }

    return user
  }
}
