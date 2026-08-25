'use client'

import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CheckCircle, SkipForward } from 'lucide-react'

interface PlanResultListProps {
  result: {
    boxDays: string[]
    skipped: string[]
    activities: { date: string; type: string }[]
  }
  onClose: () => void
}

const ACTIVITY_STYLE: Record<string, { color: string; icon: string }> = {
  WOD: { color: 'bg-primary/10 border-primary/30', icon: '🏋️' },
  Conditioning: { color: 'bg-orange-600/10 border-orange-600/30', icon: '🔥' },
  Mobilité: { color: 'bg-green-600/10 border-green-600/30', icon: '🧘' },
  Force: { color: 'bg-blue-600/10 border-blue-600/30', icon: '🏋' },
  Running: { color: 'bg-green-600/10 border-green-600/30', icon: '👟' },
}

export function PlanResultList({ result, onClose }: PlanResultListProps) {
  const total = result.boxDays.length + result.activities.length

  return (
    <div className="flex flex-col gap-4 flex-1 overflow-auto">
      <div className="space-y-3">

        {result.boxDays.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-700" />
              Jours Box ({result.boxDays.length})
            </h4>
            {result.boxDays.map(date => (
              <div key={date} className="flex items-center gap-3 p-3 rounded-md bg-blue-600/10 border border-blue-600/30">
                <span className="text-sm text-muted-foreground w-28 flex-shrink-0">
                  {format(new Date(date + 'T00:00:00'), 'EEE dd/MM', { locale: fr })}
                </span>
                <span className="text-sm text-foreground">WOD à importer le jour J</span>
                <span className="ml-auto text-xs text-blue-700">✓ Planifié</span>
              </div>
            ))}
          </div>
        )}

        {result.activities.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-700" />
              Séances sport ({result.activities.length})
            </h4>
            {result.activities.map((a, i) => {
              const style = ACTIVITY_STYLE[a.type] ?? { color: 'bg-muted/60 border-border', icon: '📅' }
              return (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-md border ${style.color}`}>
                  <span className="text-sm text-muted-foreground w-28 flex-shrink-0">
                    {format(new Date(a.date + 'T00:00:00'), 'EEE dd/MM', { locale: fr })}
                  </span>
                  <span className="text-sm font-medium text-foreground">{style.icon} {a.type}</span>
                  <span className="ml-auto text-xs text-muted-foreground">✓ Planifié</span>
                </div>
              )
            })}
          </div>
        )}

        {result.skipped.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <SkipForward className="w-4 h-4 text-muted-foreground" />
              Déjà planifiés — ignorés ({result.skipped.length})
            </h4>
            {result.skipped.map(date => (
              <div key={date} className="flex items-center gap-3 p-3 rounded-md bg-muted/60 border border-border">
                <span className="text-sm text-muted-foreground w-28 flex-shrink-0">
                  {format(new Date(date + 'T00:00:00'), 'EEE dd/MM', { locale: fr })}
                </span>
                <span className="text-sm text-muted-foreground">Déjà planifié</span>
              </div>
            ))}
          </div>
        )}

        {total === 0 && result.skipped.length === 0 && (
          <p className="text-center text-muted-foreground py-4">Aucune séance planifiée</p>
        )}
      </div>

      <div className="flex justify-end pt-2 border-t border-border">
        <Button onClick={onClose} >Fermer</Button>
      </div>
    </div>
  )
}
