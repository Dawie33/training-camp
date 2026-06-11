import { z } from 'zod'

export const BikeBlockSchema = z.object({
    phase: z.enum(['warmup', 'main', 'cooldown', 'recovery']),
    label: z.string(),
    duration_minutes: z.number().positive(),
    power_target: z.string(), // ex: '55-65% FTP', '88-93% FTP', 'Z4'
    target_zone: z.string(),  // ex: 'zone_2', 'sweet_spot', 'zone_5'
    intervals: z
        .array(
            z.object({
                effort_duration: z.string(),    // ex: '8min', '30s'
                recovery_duration: z.string(),  // ex: '5min', '30s'
                power_description: z.string(), // ex: '105-110% FTP'
                repetitions: z.number().int().positive(),
            }),
        )
        .optional(),
    notes: z.string().optional(),
})

export const GeneratedBikingPlanSchema = z.object({
    name: z.string().min(1),
    bike_type: z.enum(['endurance', 'sweet_spot', 'intervals', 'ftp_test', 'recovery', 'race']),
    estimated_duration_minutes: z.number().int().positive(),
    tss_estimate: z.number().optional(), // Training Stress Score estimé
    difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'elite']),
    description: z.string(),
    structure: z.array(BikeBlockSchema).min(1),
    coaching_tips: z.string(),
    recovery_notes: z.string(),
})

export type GeneratedBikingPlanValidated = z.infer<typeof GeneratedBikingPlanSchema>