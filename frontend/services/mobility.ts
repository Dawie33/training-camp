import type { ExternalToast } from 'sonner'
import { apiClient } from './index'

export type MobilityFocusArea = 'hips' | 'shoulders' | 'hips_shoulders' | 'wrists' | 'ankles' | 'thoracic_spine' | 'full_body'
export type MobilityGoal = 'crossfit_technique' | 'relaxation' | 'recovery'
export type MobilityPhase = 'activation' | 'mobilization' | 'stretch' | 'integration'
export type MobilityTargetSkill = 'snatch' | 'overhead_squat' | 'clean' | 'jerk' | 'thruster' | 'handstand_hspu'
export type MobilitySourceSport = 'crossfit'

export const MOBILITY_FOCUS_AREA_LABELS: Record<MobilityFocusArea, string> = {
    hips: 'Hanches',
    shoulders: 'Épaules',
    hips_shoulders: 'Hanches & Épaules',
    wrists: 'Poignets',
    ankles: 'Chevilles',
    thoracic_spine: 'Rachis thoracique',
    full_body: 'Corps entier',
}

export const MOBILITY_GOAL_LABELS: Record<MobilityGoal, string> = {
    crossfit_technique: 'Technique CrossFit',
    relaxation: 'Détente',
    recovery: 'Récupération',
}

export const MOBILITY_TARGET_SKILL_LABELS: Record<MobilityTargetSkill, string> = {
    snatch: 'Snatch',
    overhead_squat: 'Overhead squat',
    clean: 'Clean',
    jerk: 'Jerk / Split jerk',
    thruster: 'Thruster',
    handstand_hspu: 'Handstand / HSPU',
}

export const MOBILITY_PHASE_LABELS: Record<MobilityPhase, string> = {
    activation: 'Activation',
    mobilization: 'Mobilisation',
    stretch: 'Étirement',
    integration: 'Intégration',
}

export interface MobilityDrill {
    name: string
    target_area: string
    duration_seconds: number
    side: 'bilateral' | 'left_right'
    equipment?: string
    instructions: string
    cues?: string
}

export interface MobilityBlock {
    phase: MobilityPhase
    label: string
    duration_minutes: number
    drills: MobilityDrill[]
    notes?: string
}

export interface GeneratedMobilityPlan {
    name: string
    focus_areas: MobilityFocusArea[]
    goal: MobilityGoal
    estimated_duration_minutes: number
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite'
    description: string
    target_skill?: MobilityTargetSkill
    structure: MobilityBlock[]
    coaching_tips: string
    relaxation_notes: string
}

export interface GenerateMobilityDto {
    goal: MobilityGoal
    duration_minutes: number
    // Requis si goal=relaxation/recovery
    focus_area?: MobilityFocusArea
    // Requis si goal=crossfit_technique
    target_skill?: MobilityTargetSkill
    level?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
    additional_instructions?: string
    // Contexte auto-rempli depuis le CTA "étirements de récupération" post-log CrossFit (voir buildRecoveryMobilityUrl)
    source_sport?: MobilitySourceSport
    source_workout_type?: string
    source_focus_areas_text?: string[]
}

// Mapping déterministe groupe musculaire (module strength) → zone de mobilité, utilisé pour pré-remplir le CTA post-log Force.
const STRENGTH_MUSCLE_TO_MOBILITY_FOCUS: Record<string, MobilityFocusArea> = {
    chest: 'shoulders',
    back: 'thoracic_spine',
    shoulders: 'shoulders',
    arms: 'shoulders',
    forearms: 'wrists',
    legs: 'hips',
    glutes: 'hips',
    core: 'thoracic_spine',
}

export function deriveMobilityFocusAreaFromMuscles(muscles: string[]): MobilityFocusArea {
    const mapped = new Set(muscles.map(m => STRENGTH_MUSCLE_TO_MOBILITY_FOCUS[m]).filter(Boolean))
    if (mapped.size === 0) return 'full_body'
    if (mapped.size === 1) return [...mapped][0] as MobilityFocusArea
    if (mapped.size === 2 && mapped.has('hips') && mapped.has('shoulders')) return 'hips_shoulders'
    return 'full_body'
}

type RecoveryMobilityContext =
    | { sport: 'strength'; targetMuscles: string[] }
    | { sport: 'running' }
    | { sport: 'biking' }
    | { sport: 'crossfit'; workoutType?: string; focusAreasText?: string[] }

/** Construit l'URL /mobility?... pré-remplie (goal=recovery) à partir du contexte de la séance qui vient d'être loggée. */
export function buildRecoveryMobilityUrl(ctx: RecoveryMobilityContext): string {
    const params = new URLSearchParams({ goal: 'recovery' })
    switch (ctx.sport) {
        case 'strength':
            params.set('focus_area', deriveMobilityFocusAreaFromMuscles(ctx.targetMuscles))
            break
        case 'running':
            params.set('focus_area', 'hips')
            params.set(
                'additional_instructions',
                'Sortie course à pied : cible en particulier mollets, ischio-jambiers et fascia lata en complément des hanches.',
            )
            break
        case 'biking':
            params.set('focus_area', 'hips_shoulders')
            params.set(
                'additional_instructions',
                'Sortie vélo : cible en particulier quadriceps, lombaires, nuque et poignets en complément des hanches et épaules.',
            )
            break
        case 'crossfit':
            params.set('source_sport', 'crossfit')
            if (ctx.workoutType) params.set('source_workout_type', ctx.workoutType)
            if (ctx.focusAreasText?.length) params.set('source_focus_areas_text', ctx.focusAreasText.join(','))
            break
    }
    return `/mobility?${params.toString()}`
}

/**
 * Options de toast partagées pour le CTA "étirements de récupération" post-log : bouton plus grand/contrasté
 * et affiché plus longtemps que la durée par défaut de Sonner (4s), pour rester visible et cliquable.
 */
export function recoveryToastOptions(onClick: () => void): ExternalToast {
    return {
        duration: 8000,
        action: {
            label: 'Étirements de récupération',
            onClick,
        },
        actionButtonStyle: {
            padding: '0.5rem 0.875rem',
            fontSize: '0.8125rem',
            fontWeight: 600,
            borderRadius: '0.5rem',
            background: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
        },
    }
}

/** Formate une durée en secondes → h:mm ou mm min */
export function formatDuration(seconds: number | null | undefined): string {
    if (!seconds) return '--'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`
    return `${m}min`
}

export const mobilityService = {
    async generate(data: GenerateMobilityDto) {
        return apiClient.post<GeneratedMobilityPlan>('/mobility/generate', data)
    },
}
