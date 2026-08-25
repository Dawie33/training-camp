'use client'

import { DayConfig } from './DayConfigGrid'

interface PlanSummaryProps {
  dayConfigs: DayConfig[]
}

export function PlanSummary({ dayConfigs }: PlanSummaryProps) {
  const boxCount = dayConfigs.filter(d => d.isBox).length
  const wodCount = dayConfigs.filter(d => d.types.includes('wod')).length
  const conditioningCount = dayConfigs.filter(d => d.types.includes('conditioning')).length
  const mobilityCount = dayConfigs.filter(d => d.types.includes('mobility')).length
  const forceCount = dayConfigs.filter(d => d.types.includes('force')).length
  const total = boxCount + wodCount + conditioningCount + mobilityCount + forceCount

  return (
    <div className="p-3 rounded-md bg-muted/60 border border-border text-sm text-muted-foreground">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {wodCount > 0 && <span className="text-primary font-medium">{wodCount} WOD</span>}
        {conditioningCount > 0 && <span className="text-orange-700 font-medium">{conditioningCount} Conditioning</span>}
        {boxCount > 0 && <span className="text-blue-700 font-medium">{boxCount} jour{boxCount > 1 ? 's' : ''} Box</span>}
        {mobilityCount > 0 && <span className="text-green-700 font-medium">{mobilityCount} Mobilité</span>}
        {forceCount > 0 && <span className="text-blue-700 font-medium">{forceCount} Force</span>}
        {total === 0 && <span>Sélectionne des jours pour commencer</span>}
      </div>
    </div>
  )
}