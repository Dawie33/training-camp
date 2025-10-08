import { Injectable } from "@nestjs/common"
import { Knex } from "knex"
import { InjectModel } from "nest-knexjs"


@Injectable()
export class AdminService {
    constructor(
        @InjectModel() private readonly knex: Knex
    ) { }

    /**
    * Récupère le nombre d'exercices, d'entraînements, d'équipements et d'exercices d'entraînement, ainsi que le nombre d'utilisateurs.
    * @returns Un objet avec le nombre d'exercices, d'entraînements, d'équipements et d'exercices d'entraînement.
     */
    async getStats() {
        const [exercises, workouts, equipments, workoutExercises, users] = await Promise.all([
            this.knex('exercises').count('* as count').first(),
            this.knex('workouts').count('* as count').first(),
            this.knex('equipments').count('* as count').first(),
            this.knex('workout_exercises').count('* as count').first(),
            this.knex('users').count('* as count').first(),
        ])

        return {
            exercises: Number(exercises?.count || 0),
            workouts: Number(workouts?.count || 0),
            equipments: Number(equipments?.count || 0),
            workoutExercises: Number(workoutExercises?.count || 0),
            users: Number(users?.count || 0),
        }
    }
}