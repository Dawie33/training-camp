'use client'

import { Button } from '@/components/ui/button'
import type { ActiveEnrollment } from '@/services/training-programs'
import { CalendarPlus, ChevronLeft, ChevronRight, Loader2, Plus } from 'lucide-react'

interface WeekNavigatorProps {
  enrollment: ActiveEnrollment
  viewWeek: number
  onPrevWeek: () => void
  onNextWeek: () => void
  addingBonus: boolean
  onAddBonus: () => void
  showSchedule: boolean
  onToggleSchedule: () => void
}

export function WeekNavigator({
  enrollment,
  viewWeek,
  onPrevWeek,
  onNextWeek,
  addingBonus,
  onAddBonus,
  showSchedule,
  onToggleSchedule,
}: WeekNavigatorProps) {
  const canManage = enrollment.status === 'active' || enrollment.status === 'enrolled'

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
      <span className="eyebrow">
        Semaine {viewWeek}
        {viewWeek === enrollment.current_week && <span className="text-primary"> · en cours</span>}
      </span>

      <div className="flex items-center gap-2">
        {canManage && (
          <Button
            variant="outline"
            size="sm"
            onClick={onAddBonus}
            disabled={addingBonus}
            className="rounded-full border-border text-foreground hover:border-primary hover:text-white"
          >
            {addingBonus ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 mr-1.5" />}
            Séance bonus
          </Button>
        )}
        {canManage && (
          <Button
            variant={showSchedule ? 'default' : 'outline'}
            size="sm"
            onClick={onToggleSchedule}
            className={
              showSchedule
                ? 'rounded-full'
                : 'rounded-full border-border text-foreground hover:border-primary hover:text-white'
            }
          >
            <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />
            Planifier
          </Button>
        )}
        <div className="flex items-center gap-1 ml-1">
          <button
            onClick={onPrevWeek}
            disabled={viewWeek <= 1}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-border hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-border disabled:hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="eyebrow px-1 tabular-nums">
            {viewWeek}/{enrollment.duration_weeks}
          </span>
          <button
            onClick={onNextWeek}
            disabled={viewWeek >= enrollment.duration_weeks}
            className="w-8 h-8 flex items-center justify-center rounded-md border border-border hover:border-primary hover:text-primary disabled:opacity-30 disabled:hover:border-border disabled:hover:text-foreground transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
