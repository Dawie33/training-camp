'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CheckCircle, SkipForward } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PlanResultListProps {
  result: {
    workouts: { date: string; workout_name: string; schedule_id: string }[]
    boxDays: string[]
    skipped: string[]
  }
  onClose: () => void
}

export function PlanResultList({ result, onClose }: PlanResultListProps) {
  return (
    <div className="flex flex-col gap-4 flex-1 overflow-auto">
      <div className="space-y-3">
        {result.workouts.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-orange-400" />
              Workouts IA ({result.workouts.length})
            </h4>
            {result.workouts.map(s => (
              <div
                key={s.schedule_id}
                className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20"
              >
                <span className="text-sm text-slate-400 w-28 flex-shrink-0">
                  {format(new Date(s.date + 'T00:00:00'), 'EEE dd/MM', { locale: fr })}
                </span>
                <span className="text-sm font-medium text-white">{s.workout_name}</span>
                <span className="ml-auto text-xs text-orange-400">✓ Planifié</span>
              </div>
            ))}
          </div>
        )}

        {result.boxDays.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-400" />
              Jours Box ({result.boxDays.length})
            </h4>
            {result.boxDays.map(date => (
              <div
                key={date}
                className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
              >
                <span className="text-sm text-slate-400 w-28 flex-shrink-0">
                  {format(new Date(date + 'T00:00:00'), 'EEE dd/MM', { locale: fr })}
                </span>
                <span className="text-sm text-slate-300">Jour Box — WOD à importer le jour J</span>
                <span className="ml-auto text-xs text-blue-400">✓ Planifié</span>
              </div>
            ))}
          </div>
        )}

        {result.skipped.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
              <SkipForward className="w-4 h-4 text-slate-400" />
              Déjà planifiés — ignorés ({result.skipped.length})
            </h4>
            {result.skipped.map(date => (
              <div
                key={date}
                className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-700"
              >
                <span className="text-sm text-slate-400 w-28 flex-shrink-0">
                  {format(new Date(date + 'T00:00:00'), 'EEE dd/MM', { locale: fr })}
                </span>
                <span className="text-sm text-slate-500">Déjà planifié</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex justify-end pt-2 border-t border-white/10">
        <Button onClick={onClose} className="bg-orange-500 hover:bg-orange-600 text-white">
          Fermer
        </Button>
      </div>
    </div>
  )
}
