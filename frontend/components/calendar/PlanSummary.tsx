'use client'

interface DayConfig {
  date: string
  type: 'maison' | 'box' | 'repos'
  tech: string
}

interface PlanSummaryProps {
  maisonDays: DayConfig[]
  boxDays: DayConfig[]
}

export function PlanSummary({ maisonDays, boxDays }: PlanSummaryProps) {
  const activeDays = maisonDays.length + boxDays.length

  return (
    <div className="p-3 rounded-xl bg-slate-800/50 border border-white/10 text-sm text-slate-400">
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {maisonDays.length > 0 && (
          <span className="text-orange-400 font-medium">
            🏠 {maisonDays.length} workout{maisonDays.length > 1 ? 's' : ''} IA
          </span>
        )}
        {boxDays.length > 0 && (
          <span className="text-blue-400 font-medium">
            🏋️ {boxDays.length} jour{boxDays.length > 1 ? 's' : ''} Box
          </span>
        )}
        {activeDays === 0 && <span>Sélectionne des jours pour commencer</span>}
      </div>
    </div>
  )
}
