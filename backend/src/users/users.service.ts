import { Injectable, NotFoundException } from '@nestjs/common'
import { Knex } from 'knex'
import { InjectModel } from 'nest-knexjs'
import { parseStoredInjuries } from 'src/common/injuries/injury.schema'
import { UserContextService } from 'src/user-context/user-context.service'
import { toDateOnly } from 'src/common/utils/date-only'
import { UpdateUserDto, UserProfile } from './dto'

/**
 * Colonnes de `users` renvoyées au client. C'est une liste blanche : une colonne
 * n'est exposée que si elle est listée ici. Ne jamais y ajouter password,
 * google_refresh_token ou medical_notes.
 * Les donnees de profil (dont injuries, FC, date de naissance) ne sont exposees
 * que via /users/me, a leur proprietaire.
 */
export const PUBLIC_USER_COLUMNS = [
  'id',
  'email',
  'firstName',
  'lastName',
  'role',
  'sport_level',
  'height',
  'weight',
  'body_fat_percentage',
  'max_heart_rate',
  'dateOfBirth',
  'gender',
  'resting_heart_rate',
  'global_goals',
  'training_preferences',
  'physical_limitations',
  'schedule_preferences',
  'equipment_available',
  'injuries',
  'created_at',
  'updated_at',
]

type PublicUser = Omit<UserProfile, 'stats'>

@Injectable()
export class UsersService {
  constructor(
    @InjectModel() private readonly knex: Knex,
    private readonly userContextService: UserContextService
  ) {}

  /**
   * Récupère un utilisateur par son ID avec ses statistiques.
   * @param {string} id - Identifiant de l'utilisateur.
   * @returns {Promise<User>} - Promesse qui renvoie l'utilisateur correspondant à l'identifiant ou lève NotFoundException si l'utilisateur n'existe pas.
   * Seules les colonnes de PUBLIC_USER_COLUMNS sont renvoyées.
   * Les stats de l'utilisateur sont également récupérés et incluent le nombre de workout et de sessions qu'il a créées.
   */
  async getProfile(id: string) {
    const user: PublicUser | undefined = await this.knex('users').where({ id }).first(PUBLIC_USER_COLUMNS)

    if (!user) throw new NotFoundException('Utilisateur introuvable')

    // Les entrées à l'ancien format (onboarding) sont ignorées
    user.injuries = parseStoredInjuries(user.injuries)
    if (user.dateOfBirth) user.dateOfBirth = toDateOnly(user.dateOfBirth)

    // Récupérer les stats de l'utilisateur
    const [workoutsCount, sessionsCount, totalTime] = await Promise.all([
      this.knex('workouts').where({ created_by_user_id: id }).count('* as count').first(),
      this.knex('workout_sessions').where({ user_id: id }).whereNotNull('completed_at').count('* as count').first(),
      // Calculer le temps total des sessions complétées
      this.knex('workout_sessions')
        .select(
          this.knex.raw(`
                        COALESCE(
                            SUM(
                                CASE
                                    WHEN results->>'elapsed_time_seconds' IS NOT NULL
                                    THEN (results->>'elapsed_time_seconds')::integer
                                    WHEN completed_at IS NOT NULL
                                    THEN EXTRACT(EPOCH FROM (completed_at - started_at))::integer
                                    ELSE 0
                                END
                            ),
                            0
                        ) as total_seconds
                    `)
        )
        .where({ user_id: id })
        .whereNotNull('completed_at')
        .first(),
    ])

    return {
      ...user,
      stats: {
        workouts: Number(workoutsCount?.count || 0),
        sessions: Number(sessionsCount?.count || 0),
        total_time_minutes: Math.round(Number(totalTime?.total_seconds || 0) / 60),
      },
    }
  }

  /**
   * Mettre à jour un utilisateur.
   * @param {string} id - Identifiant de l'utilisateur.
   * @param {UpdateUserDto} data - Champs du profil modifiables par l'utilisateur.
   * @returns {Promise<User>} - Promesse qui renvoie l'utilisateur mis à jour ou lève NotFoundException si l'utilisateur n'existe pas.
   * Seules les colonnes de PUBLIC_USER_COLUMNS sont renvoyées.
   */
  async update(id: string, data: UpdateUserDto) {
    const updateData: Record<string, unknown> = {}

    if (data.firstName !== undefined) updateData.firstName = data.firstName
    if (data.lastName !== undefined) updateData.lastName = data.lastName
    if (data.sport_level !== undefined) updateData.sport_level = data.sport_level
    if (data.height !== undefined) updateData.height = data.height
    if (data.weight !== undefined) updateData.weight = data.weight
    if (data.body_fat_percentage !== undefined) updateData.body_fat_percentage = data.body_fat_percentage
    if (data.max_heart_rate !== undefined) updateData.max_heart_rate = data.max_heart_rate
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth
    if (data.gender !== undefined) updateData.gender = data.gender
    if (data.resting_heart_rate !== undefined) updateData.resting_heart_rate = data.resting_heart_rate
    for (const key of [
      'global_goals',
      'training_preferences',
      'physical_limitations',
      'schedule_preferences',
    ] as const) {
      if (data[key] !== undefined) updateData[key] = JSON.stringify(data[key])
    }
    if (data.equipment_available !== undefined)
      updateData.equipment_available = JSON.stringify(data.equipment_available)
    if (data.injuries !== undefined) updateData.injuries = JSON.stringify(data.injuries)

    const [row]: PublicUser[] = await this.knex('users').where({ id }).update(updateData).returning(PUBLIC_USER_COLUMNS)

    if (!row) throw new NotFoundException('Utilisateur introuvable')

    this.userContextService.invalidateCache(id)

    return {
      ...row,
      ...(row.dateOfBirth ? { dateOfBirth: toDateOnly(row.dateOfBirth) } : {}),
      injuries: parseStoredInjuries(row.injuries),
    }
  }
}
