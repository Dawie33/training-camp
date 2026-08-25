'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { activitiesApi } from '@/services/activities'
import { scheduleApi } from '@/services/schedule'
import { addDays, addWeeks, format } from 'date-fns'
import { Calendar, Loader2, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DayConfig, DayConfigGrid, DayType } from './DayConfigGrid'
import { PlanResultList } from './PlanResultList'
import { PlanSummary } from './PlanSummary'
import { WeekNavigation } from './WeekNavigation'

interface WeeklyPlannerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  weekStart: Date
  onPlanned: () => void
}

type Phase = 'config' | 'loading' | 'result'

interface PlanResult {
  boxDays: string[]
  skipped: string[]
  activities: { date: string; type: string }[]
}

function defaultDayConfig(date: string): DayConfig {
  return { date, isBox: false, isRest: false, types: [] }
}

export function WeeklyPlannerModal({ open, onOpenChange, weekStart, onPlanned }: WeeklyPlannerModalProps) {
  const [weekOffset, setWeekOffset] = useState(0)
  const currentWeekStart = addWeeks(weekStart, weekOffset)
  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  const [dayConfigs, setDayConfigs] = useState<DayConfig[]>(() =>
    days.map(d => defaultDayConfig(format(d, 'yyyy-MM-dd')))
  )
  const [phase, setPhase] = useState<Phase>('config')
  const [result, setResult] = useState<PlanResult | null>(null)
  const [suggestionWeeks, setSuggestionWeeks] = useState(0)

  useEffect(() => {
    if (!open) return
    const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd')
    setSuggestionWeeks(0)
    setDayConfigs(days.map(d => defaultDayConfig(format(d, 'yyyy-MM-dd'))))

    scheduleApi
      .getWeekSuggestion(weekStartStr)
      .then(suggestion => {
        if (suggestion && suggestion.weeks_analyzed > 0) {
          setSuggestionWeeks(suggestion.weeks_analyzed)
          setDayConfigs(
            days.map(d => {
              const date = format(d, 'yyyy-MM-dd')
              const suggested = suggestion.days.find(s => s.date === date)
              return {
                date,
                isBox: suggested?.isBox ?? false,
                isRest: suggested?.isRest ?? true,
                types: (suggested?.types ?? []) as DayType[],
              }
            })
          )
        }
      })
      .catch(() => { })
  }, [open, weekOffset]) // eslint-disable-line react-hooks/exhaustive-deps

  const updateDay = (idx: number, patch: Partial<DayConfig>) =>
    setDayConfigs(prev => prev.map((c, i) => i === idx ? { ...c, ...patch } : c))

  const handleToggleBox = (idx: number) =>
    updateDay(idx, { isBox: !dayConfigs[idx].isBox, isRest: false, types: [] })

  const handleToggleRest = (idx: number) =>
    updateDay(idx, { isRest: !dayConfigs[idx].isRest, isBox: false, types: [] })

  const handleToggleType = (idx: number, type: DayType) => {
    const current = dayConfigs[idx].types
    let types: DayType[]
    if (current.includes(type)) {
      types = current.filter(t => t !== type)
    } else if (type === 'wod' || type === 'conditioning') {
      // WOD et Conditioning occupent le même créneau CrossFit du jour — mutuellement exclusifs
      types = [...current.filter(t => t !== 'wod' && t !== 'conditioning'), type]
    } else {
      types = [...current, type]
    }
    updateDay(idx, { types })
  }

  const boxDays = dayConfigs.filter(d => d.isBox)
  const activeDays = dayConfigs.filter(d => !d.isBox && !d.isRest && d.types.length > 0)
  const totalActiveDays = boxDays.length + activeDays.length

  const handleGenerate = async () => {
    if (totalActiveDays === 0) {
      toast.error('Sélectionne au moins un jour d\'entraînement')
      return
    }

    setPhase('loading')
    try {
      // Jours Box — simple tag "Jour Box" côté planification CrossFit, pas de contenu généré
      const boxResults = await Promise.allSettled(
        boxDays.map(d => scheduleApi.createBoxSession(d.date))
      )
      const savedBoxDays = boxDays
        .filter((_, i) => boxResults[i].status === 'fulfilled')
        .map(d => d.date)
      const skippedBoxDays = boxDays
        .filter((_, i) => boxResults[i].status === 'rejected')
        .map(d => d.date)

      // WOD / Conditioning / Mobilité / Force : simple tag, contenu généré ensuite depuis la page dédiée
      const activities: { date: string; type: string }[] = []
      const activityTypeByDayType: Record<DayType, 'wod' | 'conditioning' | 'mobility' | 'strength'> = {
        wod: 'wod',
        conditioning: 'conditioning',
        mobility: 'mobility',
        force: 'strength',
      }
      const labels: Record<DayType, string> = { wod: 'WOD', conditioning: 'Conditioning', mobility: 'Mobilité', force: 'Force' }

      const tagRequests: Promise<unknown>[] = []
      for (const day of activeDays) {
        for (const type of day.types) {
          tagRequests.push(
            activitiesApi.create({ activity_type: activityTypeByDayType[type], scheduled_date: day.date })
          )
          activities.push({ date: day.date, type: labels[type] })
        }
      }

      if (tagRequests.length > 0) {
        await Promise.all(tagRequests)
      }

      setResult({
        boxDays: savedBoxDays,
        skipped: skippedBoxDays,
        activities,
      })
      setPhase('result')
      if (totalActiveDays > 0) onPlanned()
    } catch {
      toast.error('Erreur lors de la planification. Veuillez réessayer.')
      setPhase('config')
    }
  }

  const handleClose = () => {
    setPhase('config')
    setResult(null)
    setSuggestionWeeks(0)
    setWeekOffset(0)
    setDayConfigs(days.map(d => defaultDayConfig(format(d, 'yyyy-MM-dd'))))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[860px] max-h-[90vh] overflow-hidden flex flex-col bg-card border-border text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-foreground">
            <Calendar className="w-5 h-5 text-primary" />
            <WeekNavigation
              currentWeekStart={currentWeekStart}
              weekOffset={weekOffset}
              onWeekOffsetChange={setWeekOffset}
            />
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Box / Repos = jours bloqués · Sinon, sélectionne un ou plusieurs types par jour
          </DialogDescription>
        </DialogHeader>

        {phase === 'config' && (
          <div className="flex flex-col gap-4 flex-1 overflow-auto">
            {suggestionWeeks > 0 && (
              <div className="text-xs text-muted-foreground px-1">
                💡 Pré-rempli d&apos;après tes {suggestionWeeks} dernière{suggestionWeeks > 1 ? 's' : ''} semaine
                {suggestionWeeks > 1 ? 's' : ''} — modifie si besoin.
              </div>
            )}

            <DayConfigGrid
              days={days}
              dayConfigs={dayConfigs}
              onToggleBox={handleToggleBox}
              onToggleRest={handleToggleRest}
              onToggleType={handleToggleType}
            />

            <PlanSummary dayConfigs={dayConfigs} />

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleClose} className="text-muted-foreground hover:text-foreground">
                Annuler
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={totalActiveDays === 0}
              >
                <Zap className="w-4 h-4 mr-2" />
                Planifier la semaine
              </Button>
            </div>
          </div>
        )}

        {phase === 'loading' && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 py-16">
            <Loader2 className="w-12 h-12 animate-spin text-primary" />
            <div className="text-center">
              <p className="text-foreground font-medium">Planification en cours...</p>
              <p className="text-muted-foreground text-sm mt-1">Quelques secondes...</p>
            </div>
          </div>
        )}

        {phase === 'result' && result && <PlanResultList result={result} onClose={handleClose} />}
      </DialogContent>
    </Dialog>
  )
}