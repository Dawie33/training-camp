// ============================================================================
// Equipments API — catalogue en lecture seule (géré par les seeds du backend)

import { Equipment } from "@/domain/entities/equipment"
import ResourceApi from "./resourceApi"

// ============================================================================
const equipmentsApi = new ResourceApi<Equipment>('/equipments')

export async function getEquipments(params?: {
    limit?: number
    offset?: number
    search?: string
    orderBy?: string
    orderDir?: string
}) {
    return equipmentsApi.getAll(params)
}

export async function getEquipment(id: string): Promise<Equipment> {
    return equipmentsApi.getOne(id)
}
