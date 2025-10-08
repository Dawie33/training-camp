import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { Knex } from "knex"
import { InjectModel } from "nest-knexjs"
import { CreateExerciseDto, ExerciseQueryDto, UpdateExerciseDto } from "./dto/exercises.dto"


@Injectable()
export class ExercisesService {

    constructor(@InjectModel() private readonly knex: Knex) { }

    /**
     * Récupère la liste des exercices avec filtres et recherche.
     */
    async findAll({
        limit = '50',
        offset = '0',
        search,
        category,
        difficulty,
        orderBy = 'created_at',
        orderDir = 'desc'
    }: ExerciseQueryDto) {
        let query = this.knex("exercises").select("*")

        // Recherche par nom
        if (search) {
            query = query.where('name', 'ilike', `%${search}%`)
        }

        // Filtre par catégorie
        if (category) {
            query = query.where('category', category)
        }

        // Filtre par difficulté
        if (difficulty) {
            query = query.where('difficulty', difficulty)
        }

        const rows = await query
            .limit(Number(limit))
            .offset(Number(offset))
            .orderBy(orderBy, orderDir)

        // Count avec les mêmes filtres
        let countQuery = this.knex("exercises").count({ count: "*" })

        if (search) {
            countQuery = countQuery.where('name', 'ilike', `%${search}%`)
        }
        if (category) {
            countQuery = countQuery.where('category', category)
        }
        if (difficulty) {
            countQuery = countQuery.where('difficulty', difficulty)
        }

        const countResult = await countQuery.first()
        const count = Number(countResult?.count)

        return { rows, count }
    }

    /**
     * Retrieve an exercise by its ID.
     * @param id The ID of the exercise.
     * @returns The exercise with the given ID.
     * @throws {Error} If the exercise does not exist.
     */
    async getById(id: string) {
        if (!id) {
            throw new BadRequestException('id de l\'exercice manquant')
        }
        const exercise = await this.knex("exercises").where({ id }).first()

        if (!exercise) {
            throw new NotFoundException(`Exercise with id ${id} not found`)
        }

        return exercise
    }

    async createExercise(exercise: CreateExerciseDto) {
        const [created] = await this.knex("exercises")
            .insert(exercise)
            .returning("*")
        return created
    }

    async updateExercise(id: string, data: UpdateExerciseDto) {
        const [updated] = await this.knex("exercises")
            .where({ id })
            .update(data)
            .returning("*")

        if (!updated) {
            throw new NotFoundException(`Exercise with id ${id} not found`)
        }

        return updated
    }


}