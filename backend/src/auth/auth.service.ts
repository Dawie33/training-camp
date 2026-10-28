import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcryptjs'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { isUniqueViolation } from 'src/common/utils/postgres-errors'
import { AuthResponseDto, LoginDto, SignupDto } from './dto/auth.dto'

// Les anciens hash restent valides : bcrypt stocke le coût dans le hash et compare() le relit
export const BCRYPT_COST = 12

@Injectable()
export class AuthService {
  constructor(
    @InjectModel() private readonly knex: Knex,
    private jwtService: JwtService
  ) {}

  /**
   * Inscrire un nouvel utilisateur.
   * @param {SignupDto} signupDto - les données de l'utilisateur.
   * @returns {Promise<AuthResponseDto>} - le token JWT et les données de l'utilisateur.
   * @throws {ConflictException} - si l'utilisateur existe deja.
   */
  async signup(signupDto: SignupDto): Promise<AuthResponseDto> {
    const { email, password, firstName, lastName } = signupDto

    // Vérifier si l'utilisateur existe déjà
    const existingUser = await this.knex('users').where({ email }).first()
    if (existingUser) {
      throw new ConflictException('Email already exists')
    }

    // Hasher le mot de passe
    const hashedPassword = await bcrypt.hash(password, BCRYPT_COST)

    // Créer l'utilisateur
    const [user] = await this.knex('users')
      .insert({
        email,
        password: hashedPassword,
        firstName,
        lastName,
      })
      .returning(['id', 'email', 'firstName', 'lastName', 'role', 'token_version'])
      .catch((error: unknown) => {
        // Deux inscriptions simultanées passent toutes deux la vérification ci-dessus :
        // la contrainte unique sur l'email tranche, on la traduit en 409 au lieu d'une 500
        if (isUniqueViolation(error)) {
          throw new ConflictException('Email already exists')
        }
        throw error
      })

    const access_token = this.signToken(user)

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
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
    const user = await this.knex('users').where({ email }).first()

    if (!user) {
      throw new UnauthorizedException('Les données de connexion sont invalides')
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password)
    if (!isPasswordValid) {
      throw new UnauthorizedException('Les données de connexion sont invalides')
    }

    // Compte désactivé : même message qu'un mauvais mot de passe, pour ne pas révéler l'état du compte.
    // Vérifié après bcrypt pour que le temps de réponse ne le révèle pas non plus.
    if (!user.isActive) {
      throw new UnauthorizedException('Les données de connexion sont invalides')
    }

    // Mettre à jour lastLoginAt
    await this.knex('users').where({ id: user.id }).update({ lastLoginAt: this.knex.fn.now() })

    const access_token = this.signToken(user)

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    }
  }

  /**
   * Révoquer tous les jetons de l'utilisateur.
   * La version stockée change : les jetons émis avant portent l'ancienne et sont refusés par validateUser.
   * @param {string} userId - Identifiant de l'utilisateur.
   */
  async revokeTokens(userId: string): Promise<void> {
    await this.knex('users').where({ id: userId }).increment('token_version', 1)
  }

  /**
   * Validation de l'utilisateur en fonction de son identifiant et de la version de son jeton.
   * Renvoie null si l'utilisateur n'existe pas, n'est pas actif, ou si le jeton a été révoqué.
   * @param {string} userId - Identifiant de l'utilisateur.
   * @param {unknown} tokenVersion - Version lue dans le jeton (`ver`). Un jeton sans version est refusé.
   * @returns {Promise<User | null>} - utilisateur si valide, sans sa version de jeton.
   */
  async validateUser(userId: string, tokenVersion: unknown) {
    const user = await this.knex('users')
      .where({ id: userId })
      .first(['id', 'email', 'firstName', 'lastName', 'role', 'isActive', 'token_version'])

    if (!user || !user.isActive || user.token_version !== tokenVersion) {
      return null
    }

    // La version ne sert qu'à la vérification : elle n'a pas à apparaître dans req.user
    const { id, email, firstName, lastName, role, isActive } = user
    return { id, email, firstName, lastName, role, isActive }
  }

  /** Le jeton porte la version courante : une révocation ultérieure le rendra invalide. */
  private signToken(user: { id: string; email: string; token_version: number }): string {
    return this.jwtService.sign({ sub: user.id, email: user.email, ver: user.token_version })
  }
}
