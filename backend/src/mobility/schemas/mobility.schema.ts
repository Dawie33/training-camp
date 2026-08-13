import { z } from 'zod'

export const MobilityDrillSchema = z.object({
    name: z.string().min(1), // ex: "Étirement du psoas en fente"
    target_area: z.string(), // ex: "fléchisseurs de hanche", "coiffe des rotateurs"
    duration_seconds: z.number().int().positive(),
    side: z.enum(['bilateral', 'left_right']),
    equipment: z.string().optional(), // ex: "bande élastique", "lacrosse ball", "aucun"
    instructions: z.string(),
    cues: z.string().optional(),
})

export const MobilityBlockSchema = z.object({
    phase: z.enum(['activation', 'mobilization', 'stretch', 'integration']),
    label: z.string(),
    duration_minutes: z.number().positive(),
    drills: z.array(MobilityDrillSchema).min(1),
    notes: z.string().optional(),
})

export const GeneratedMobilityPlanSchema = z.object({
    name: z.string().min(1),
    // Tableau car un mouvement technique sollicite souvent plusieurs zones à la fois (ex: handstand = poignets + épaules + t-spine).
    focus_areas: z.array(z.enum(['hips', 'shoulders', 'wrists', 'ankles', 'thoracic_spine', 'full_body'])).min(1),
    goal: z.enum(['crossfit_technique', 'relaxation', 'recovery']),
    estimated_duration_minutes: z.number().int().positive(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'elite']),
    description: z.string(),
    // L'IA renvoie parfois une chaîne vide plutôt que d'omettre le champ quand il ne s'applique pas (goal != crossfit_technique).
    target_skill: z.preprocess(
        v => (v === '' ? undefined : v),
        z.enum(['snatch', 'overhead_squat', 'clean', 'jerk', 'thruster', 'handstand_hspu']).optional(),
    ),
    structure: z.array(MobilityBlockSchema).min(1),
    coaching_tips: z.string(),
    relaxation_notes: z.string(),
})

export type GeneratedMobilityPlanValidated = z.infer<typeof GeneratedMobilityPlanSchema>
