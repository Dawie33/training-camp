import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { Knex } from "knex"
import { InjectModel } from "nest-knexjs"
import { QueryDto } from "src/workouts/dto/workout.dto"
import { ExercisesDto } from "./dto/exercises.dto"


@Injectable()
export class ExercisesService {

    constructor(@InjectModel() private readonly knex: Knex) { }

    /**
     * Récupère la liste des exercices.
     */
    async findAll({ limit = '10', offset = '0', orderBy = 'created_at', orderDir = 'desc' }: QueryDto) {
        try {
            const rows = await this.knex("exercises")
                .select("*")
                .limit(Number(limit))
                .offset(Number(offset))
                .orderBy(orderBy, orderDir)

            const countResult = await this.knex("exercises").count({ count: "*" }).first()
            const count = Number(countResult?.count)
            return { rows, count }
        } catch (error) {
            throw new Error(`Error fetching exercises: ${error.message}`)
        }

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

    async createExercise(exercise: ExercisesDto) {
        const [created] = await this.knex("exercises")
            .insert(exercise)
            .returning("*")
        return created
    }


}