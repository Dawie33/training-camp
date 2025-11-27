/**
 * Schémas de validation Zod pour les workouts générés par l'IA
 */

import { z } from 'zod'
import { EQUIPMENT } from './workout-generator.prompt'

/**
 * Schéma de validation pour l'équipement
 */
export const EquipmentSchema = z.enum(EQUIPMENT)

/**
 * Schéma de validation pour un exercice
 */
export const ExerciseSchema = z.object({
  name: z.string().min(1),
  reps: z.union([z.number().int().nonnegative(), z.string()]).nullable().optional(),
  sets: z.number().int().positive().nullable().optional(),
  duration: z.string().nullable().optional(),
  weight: z.string().nullable().optional(),
  intensity: z.string().nullable().optional(),
  details: z.string().nullable().optional(),
  equipment: z.array(EquipmentSchema).nullable().optional(),
  easier_option: z.string().nullable().optional(),
  harder_option: z.string().nullable().optional(),
  target_rpe: z.string().nullable().optional(),
})

/**
 * Schéma de validation pour une section de workout
 */
export const WorkoutSectionSchema = z.object({
  type: z.string(),
  title: z.string().min(1),
  duration_min: z.number().positive().nullable().optional(),
  format: z.string().nullable().optional(),
  rounds: z.number().int().positive().nullable().optional(),
  rest_between_rounds: z.number().nonnegative().nullable().optional(),
  exercises: z.array(ExerciseSchema).nullable().optional(),
})

/**
 * Schéma de validation pour les blocs d'un workout
 */
export const WorkoutBlocksSchema = z.object({
  sections: z.array(WorkoutSectionSchema).min(1),
  stimulus: z.string(),
  duration_min: z.number().positive().max(120, 'La durée doit être <= 60 minutes'),
  estimated_calories: z.string().nullable().optional(),
})

/**
 * Schéma de validation complet pour un workout généré
 */
export const GeneratedWorkoutSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  workout_type: z.string().min(1),
  estimated_duration: z.number().positive().max(60),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  intensity: z.enum(['low', 'moderate', 'high', 'very_high']),
  blocks: WorkoutBlocksSchema,
  equipment_required: z.array(EquipmentSchema).nullable().optional(),
  focus_areas: z.array(z.string()).nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  coach_notes: z.string().nullable().optional(),
}).refine(
  (workout) => {
    // Vérifier que estimated_duration correspond à blocks.duration_min
    const diff = Math.abs(workout.estimated_duration - workout.blocks.duration_min)
    return diff <= 5 // Tolérance de 5 minutes
  },
  {
    message: 'La durée estimée doit correspondre à la durée totale des blocs (± 5 minutes)',
    path: ['estimated_duration'],
  }
)

export type GeneratedWorkoutValidated = z.infer<typeof GeneratedWorkoutSchema>
