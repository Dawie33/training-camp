import { apiClient } from './index'

export type MobilityFocusArea = 'hips' | 'shoulders' | 'hips_shoulders' | 'wrists' | 'ankles' | 'thoracic_spine' | 'full_body'
export type MobilityGoal = 'crossfit_technique' | 'relaxation' | 'recovery'
export type MobilityPhase = 'activation' | 'mobilization' | 'stretch' | 'integration'

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
    focus_area: MobilityFocusArea
    goal: MobilityGoal
    estimated_duration_minutes: number
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite'
    description: string
    target_skill?: string
    structure: MobilityBlock[]
    coaching_tips: string
    relaxation_notes: string
}

export interface GenerateMobilityDto {
    focus_area: MobilityFocusArea
    goal: MobilityGoal
    duration_minutes: number
    target_skill?: string
    level?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
    additional_instructions?: string
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
