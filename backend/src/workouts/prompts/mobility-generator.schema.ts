/**
 * Schémas de validation Zod pour les workouts de mobilité générés par l'IA
 */

import { z } from 'zod'
import { MOBILITY_EQUIPMENT } from './mobility-generator.prompt'

/**
 * Schéma de validation pour l'équipement de mobilité
 */
export const MobilityEquipmentSchema = z.enum(MOBILITY_EQUIPMENT)

/**
 * Schéma de validation pour un exercice de mobilité
 * Étend le schéma d'exercice standard avec des champs spécifiques à la mobilité
 */
export const MobilityExerciseSchema = z.object({
  name: z.string().min(1),
  duration: z.string().nullable().optional(),
  reps: z.union([z.number().int().nonnegative(), z.string()]).nullable().optional(),
  sets: z.number().int().positive().nullable().optional(),
  tempo: z.string().nullable().optional(),
  breathing: z.string().min(1, 'Le pattern respiratoire est obligatoire pour les exercices de mobilité'),
  details: z.string().min(10, 'Les détails techniques sont obligatoires'),
  equipment: z.array(z.string()).nullable().optional(),
  target_areas: z.array(z.string()).min(1, 'Au moins une zone cible doit être spécifiée'),
  progression: z.string().min(1, 'Une progression doit être proposée'),
  regression: z.string().min(1, 'Une régression doit être proposée'),
  cues: z.array(z.string()).min(1, 'Au moins un cue de coaching doit être fourni'),
  contraindications: z.string().nullable().optional(),
})

/**
 * Schéma de validation pour une section de workout de mobilité
 */
export const MobilitySectionSchema = z.object({
  type: z.enum(['warmup', 'mobility', 'cooldown']),
  title: z.string().min(1),
  description: z.string().min(1, 'Une description de l\'objectif de la section est requise'),
  duration_min: z.number().positive(),
  exercises: z.array(MobilityExerciseSchema).min(1),
})

/**
 * Schéma de validation pour les blocs d'un workout de mobilité
 */
export const MobilityBlocksSchema = z.object({
  sections: z.array(MobilitySectionSchema).min(1),
  stimulus: z.string().min(50, 'Le stimulus doit expliquer en détail l\'objectif et les bénéfices'),
  duration_min: z.number().positive().max(60, 'La durée doit être <= 60 minutes'),
})

/**
 * Schéma de validation complet pour un workout de mobilité généré
 */
export const GeneratedMobilityWorkoutSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  workout_type: z.literal('mobility'),
  estimated_duration: z.number().positive().max(60),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  intensity: z.enum(['low', 'moderate']), // Pas de high/very_high pour mobilité
  blocks: MobilityBlocksSchema,
  equipment_required: z.array(z.string()).nullable().optional(),
  focus_areas: z.array(z.string()).min(1, 'Au moins une zone de focus doit être spécifiée'),
  tags: z.array(z.string()).nullable().optional(),
  coach_notes: z.string().min(50, 'Les notes du coach doivent être détaillées'),
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

export type GeneratedMobilityWorkoutValidated = z.infer<typeof GeneratedMobilityWorkoutSchema>
