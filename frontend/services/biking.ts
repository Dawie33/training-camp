import { apiClient } from './index'

export type BikeType = 'endurance' | 'sweet_spot' | 'intervals' | 'ftp_test' | 'recovery' | 'race'
export type BikeSource = 'manual' | 'ai_generated'

export const BIKE_TYPE_LABELS: Record<BikeType, string> = {
    endurance: 'Endurance (Z2)',
    sweet_spot: 'Sweet Spot',
    intervals: 'Intervalles',
    ftp_test: 'Test FTP',
    recovery: 'Récupération',
    race: 'Simulation compétition',
}

export const BIKE_TYPE_COLORS: Record<BikeType, string> = {
    endurance: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    sweet_spot: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    intervals: 'bg-red-500/20 text-red-400 border-red-500/30',
    ftp_test: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    recovery: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    race: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

export interface BikeBlock {
    phase: 'warmup' | 'main' | 'cooldown' | 'recovery'
    label: string
    duration_minutes: number
    power_target: string
    target_zone: string
    intervals?: {
        effort_duration: string
        recovery_duration: string
        power_description: string
        repetitions: number
    }[]
    notes?: string
}

export interface GeneratedBikingPlan {
    name: string
    bike_type: BikeType
    estimated_duration_minutes: number
    tss_estimate?: number
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'elite'
    description: string
    structure: BikeBlock[]
    coaching_tips: string
    recovery_notes: string
}

export interface BikingSession {
    id: string
    user_id: string
    session_date: string
    bike_type: BikeType
    source: BikeSource
    scheduled_activity_id?: string
    distance_km?: number
    duration_seconds?: number
    avg_power_watts?: number
    ftp_watts?: number
    avg_heart_rate?: number
    max_heart_rate?: number
    calories?: number
    perceived_effort?: number
    ai_plan?: GeneratedBikingPlan
    notes?: string
    created_at: string
    updated_at: string
}

export interface BikingStats {
    total_sessions: number
    total_km: number
    total_hours: number
    avg_power_watts: number | null
    longest_ride_km: number
    type_breakdown: Record<string, number>
}

export interface CreateBikingSessionDto {
    session_date: string
    bike_type: BikeType
    scheduled_activity_id?: string
    distance_km?: number
    duration_seconds?: number
    avg_power_watts?: number
    ftp_watts?: number
    avg_heart_rate?: number
    max_heart_rate?: number
    calories?: number
    perceived_effort?: number
    notes?: string
}

export interface GenerateBikingDto {
    bike_type: BikeType
    duration_minutes: number
    ftp_watts?: number
    level?: 'beginner' | 'intermediate' | 'advanced' | 'elite'
    goal?: string
    additional_instructions?: string
}

/** Formate une durée en secondes → h:mm ou mm:ss */
export function formatDuration(seconds: number | null | undefined): string {
    if (!seconds) return '--'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    if (h > 0) return `${h}h${m.toString().padStart(2, '0')}`
    return `${m}min`
}

export const bikingService = {
    async getSessions(params?: Record<string, string | number | undefined>) {
        return apiClient.get<{ rows: BikingSession[]; count: number }>('/biking/sessions', { params })
    },

    async getStats() {
        return apiClient.get<BikingStats>('/biking/sessions/stats')
    },

    async getById(id: string) {
        return apiClient.get<BikingSession>(`/biking/sessions/${id}`)
    },

    async create(data: CreateBikingSessionDto) {
        return apiClient.post<BikingSession>('/biking/sessions', data)
    },

    async update(id: string, data: Partial<CreateBikingSessionDto>) {
        return apiClient.patch<BikingSession>(`/biking/sessions/${id}`, data)
    },

    async delete(id: string) {
        return apiClient.delete<{ success: boolean }>(`/biking/sessions/${id}`)
    },

    async generatePreview(data: GenerateBikingDto) {
        return apiClient.post<GeneratedBikingPlan>('/biking/generate/preview', data)
    },

    async generateAndSave(data: GenerateBikingDto) {
        return apiClient.post<BikingSession>('/biking/generate/save', data)
    },
}