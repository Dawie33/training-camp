'use client'

import { DayConfig } from './DayConfigGrid'

interface PlanSummaryProps {
  dayConfigs: DayConfig[]
}

export function PlanSummary({ dayConfigs }: PlanSummaryProps) {
  const boxCount = dayConfigs.filter(d => d.isBox).length
  const crossfitCount = dayConfigs.filter(d => d.sports.includes('crossfit')).length
  const runningCount = dayConfigs.filter(d => d.sports.includes('running')).length
  const bikingCount = dayConfigs.filter(d => d.sports.includes('biking')).length
  const total = boxCount + crossfitCount + runningCount + bikingCount

  return (
    <div className="p-3 rounded-md bg-muted/60 border border-border text-sm text-muted-foreground">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {crossfitCount > 0 && <span className="text-primary font-medium">{crossfitCount} CrossFit IA</span>}
        {boxCount > 0 && <span className="text-blue-700 font-medium">{boxCount} jour{boxCount > 1 ? 's' : ''} Box</span>}
        {runningCount > 0 && <span className="text-green-700 font-medium">{runningCount} Running</span>}
        {bikingCount > 0 && <span className="text-blue-700 font-medium">{bikingCount} Vélo</span>}
        {total === 0 && <span>Sélectionne des jours pour commencer</span>}
      </div>
    </div>
  )
}