'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { scheduleApi } from '@/services/schedule'
import { workoutsService } from '@/services/workouts'
import { addDays, addWeeks, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, Loader2, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { DayConfigGrid } from './DayConfigGrid'
import { PlanResultList } from './PlanResultList'
import { PlanSummary } from './PlanSummary'
import { WeekNavigation } from './WeekNavigation'

interface WeeklyPlannerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  weekStart: Date
  onPlanned: () => void
}

type DayType = 'maison' | 'box' | 'repos'
type TechFocus = '' | 'skills' | 'altero' | 'force'
type Phase = 'config' | 'loading' | 'result'

interface DayConfig {
  date: string
  type: DayType
  tech: TechFocus
}

interface PlanResult {
  workouts: { date: string; workout_name: string; schedule_id: string }[]
  boxDays: string[]
  skipped: string[]
}

export function WeeklyPlannerModal({ open, onOpenChange, weekStart, onPlanned }: WeeklyPlannerModalProps) {
  const [weekOffset, setWeekOffset] = useState(0)
  const currentWeekStart = addWeeks(weekStart, weekOffset)
  const days = Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i))

  const [dayConfigs, setDayConfigs] = useState<DayConfig[]>(() =>
    days.map(d => ({ date: format(d, 'yyyy-MM-dd'), type: 'repos' as DayType, tech: '' as TechFocus }))
  )
  const [phase, setPhase] = useState<Phase>('config')
  const [result, setResult] = useState<PlanResult | null>(null)
  const [suggestionWeeks, setSuggestionWeeks] = useState(0)

  useEffect(() => {
    if (!open) return
    const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd')
    setSuggestionWeeks(0)
    setDayConfigs(days.map(d => ({ date: format(d, 'yyyy-MM-dd'), type: 'repos' as DayType, tech: '' as TechFocus })))

    scheduleApi
      .getWeekSuggestion(weekStartStr)
      .then(suggestion => {
        if (suggestion && suggestion.weeks_analyzed > 0) {
          setSuggestionWeeks(suggestion.weeks_analyzed)
          setDayConfigs(
            days.map(d => {
              const date = format(d, 'yyyy-MM-dd')
              const suggested = suggestion.days.find(s => s.date === date)
              const raw = suggested?.type ?? 'repos'
              const type: DayType =
                raw === 'box' ? 'box' : raw === 'repos' ? 'repos' : raw === 'rest' ? 'repos' : 'maison'
              return { date, type, tech: '' }
            })
          )
        }
      })
      .catch(() => {})
  }, [open, weekOffset]) // eslint-disable-line react-hooks/exhaustive-deps

  const setDayType = (idx: number, type: DayType) =>
    setDayConfigs(prev => prev.map((c, i) => (i === idx ? { ...c, type } : c)))

  const setDayTech = (idx: number, tech: TechFocus) =>
    setDayConfigs(prev => prev.map((c, i) => (i === idx ? { ...c, tech } : c)))

  const maisonDays = dayConfigs.filter(d => d.type === 'maison')
  const boxDays = dayConfigs.filter(d => d.type === 'box')
  const activeDays = maisonDays.length + boxDays.length

  const handleGenerate = async () => {
    if (activeDays === 0) {
      toast.error('Sélectionne au moins un jour')
      return
    }

    setPhase('loading')
    try {
      const res = await workoutsService.generateWeeklyPlan(
        [...maisonDays, ...boxDays].map(d => ({
          date: d.date,
          type: d.type === 'maison' ? 'perso' : 'box',
          focus: d.type === 'maison' ? d.tech || undefined : undefined,
        }))
      )

      setResult({
        workouts: res.scheduled,
        boxDays: res.box_days,
        skipped: res.skipped,
      })
      setPhase('result')
      if (res.scheduled.length > 0 || res.box_days.length > 0) onPlanned()
    } catch {
      toast.error('Erreur lors de la génération. Veuillez réessayer.')
      setPhase('config')
    }
  }

  const handleClose = () => {
    setPhase('config')
    setResult(null)
    setSuggestionWeeks(0)
    setWeekOffset(0)
    setDayConfigs(days.map(d => ({ date: format(d, 'yyyy-MM-dd'), type: 'repos' as DayType, tech: '' as TechFocus })))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[860px] max-h-[90vh] overflow-hidden flex flex-col bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5 text-orange-400" />
            <WeekNavigation
              currentWeekStart={currentWeekStart}
              weekOffset={weekOffset}
              onWeekOffsetChange={setWeekOffset}
            />
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Maison = workout IA généré · Box = WOD du jour (pas de génération) · Repos = journée libre
          </DialogDescription>
        </DialogHeader>

        {phase === 'config' && (
          <div className="flex flex-col gap-4 flex-1 overflow-auto">
            {suggestionWeeks > 0 && (
              <div className="text-xs text-slate-400 px-1">
                💡 Pré-rempli d&apos;après tes {suggestionWeeks} dernière{suggestionWeeks > 1 ? 's' : ''} semaine
                {suggestionWeeks > 1 ? 's' : ''} — modifie si besoin.
              </div>
            )}

            <DayConfigGrid
              days={days}
              dayConfigs={dayConfigs}
              onDayTypeChange={setDayType}
              onDayTechChange={setDayTech}
            />

            <PlanSummary maisonDays={maisonDays} boxDays={boxDays} />

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleClose} className="text-slate-400 hover:text-white">
                Annuler
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={activeDays === 0}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Zap className="w-4 h-4 mr-2" />
                Générer le plan
              </Button>
            </div>
          </div>
        )}

        {phase === 'loading' && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 py-16">
            <Loader2 className="w-12 h-12 animate-spin text-orange-400" />
            <div className="text-center">
              <p className="text-white font-medium">Génération en cours...</p>
              <p className="text-slate-400 text-sm mt-1">
                {maisonDays.length > 1
                  ? `${maisonDays.length} workouts IA en parallèle — 30-60s`
                  : 'Quelques secondes...'}
              </p>
            </div>
          </div>
        )}

        {phase === 'result' && result && <PlanResultList result={result} onClose={handleClose} />}
      </DialogContent>
    </Dialog>
  )
}
