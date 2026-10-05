// ============================================================================
// TYPES POUR LES EQUIPEMENTS
// ============================================================================
export interface Equipment {
    id: string
    label: string
    slug: string
    description?: string
    image_url?: string
    created_at: string
    updated_at: string
    meta: Record<string, string>
}
