'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { scheduleApi } from '@/services/schedule'
import { workoutsService } from '@/services/workouts'
import { addDays, addWeeks, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, CheckCircle, ChevronLeft, ChevronRight, Loader2, SkipForward, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

interface WeeklyPlannerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  weekStart: Date
  onPlanned: () => void
}

type DayType = 'maison' | 'box' | 'repos'
type TechFocus = '' | 'skills' | 'altero' | 'force'
type Phase = 'config' | 'loading' | 'result'

const DAY_TYPES: { type: DayType; label: string; activeClass: string; inactiveClass: string }[] = [
  {
    type: 'maison',
    label: '🏠 Maison',
    activeClass: 'border-orange-500 bg-orange-500/20 text-orange-300',
    inactiveClass: 'border-slate-700 text-slate-400 hover:border-orange-500/50 hover:text-orange-400',
  },
  {
    type: 'box',
    label: '🏋️ Box',
    activeClass: 'border-blue-500 bg-blue-500/20 text-blue-300',
    inactiveClass: 'border-slate-700 text-slate-400 hover:border-blue-500/50 hover:text-blue-400',
  },
  {
    type: 'repos',
    label: '😴 Repos',
    activeClass: 'border-slate-500 bg-slate-700/50 text-slate-300',
    inactiveClass: 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300',
  },
]

const TECH_OPTIONS: { value: TechFocus; label: string }[] = [
  { value: '', label: 'Auto' },
  { value: 'skills', label: 'Skills gymn.' },
  { value: 'altero', label: 'Altéro' },
  { value: 'force', label: 'Force' },
]

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
    days.map((d) => ({ date: format(d, 'yyyy-MM-dd'), type: 'repos' as DayType, tech: '' as TechFocus }))
  )
  const [phase, setPhase] = useState<Phase>('config')
  const [result, setResult] = useState<PlanResult | null>(null)
  const [suggestionWeeks, setSuggestionWeeks] = useState(0)

  useEffect(() => {
    if (!open) return
    const weekStartStr = format(currentWeekStart, 'yyyy-MM-dd')
    setSuggestionWeeks(0)
    setDayConfigs(days.map((d) => ({ date: format(d, 'yyyy-MM-dd'), type: 'repos' as DayType, tech: '' as TechFocus })))

    scheduleApi.getWeekSuggestion(weekStartStr)
      .then((suggestion) => {
        if (suggestion && suggestion.weeks_analyzed > 0) {
          setSuggestionWeeks(suggestion.weeks_analyzed)
          setDayConfigs(
            days.map((d) => {
              const date = format(d, 'yyyy-MM-dd')
              const suggested = suggestion.days.find((s) => s.date === date)
              const raw = suggested?.type ?? 'repos'
              // Map program/perso → maison, rest → repos
              const type: DayType = raw === 'box' ? 'box' : raw === 'repos' ? 'repos' : raw === 'rest' ? 'repos' : 'maison'
              return { date, type, tech: '' }
            })
          )
        }
      })
      .catch(() => {})
  }, [open, weekOffset]) // eslint-disable-line react-hooks/exhaustive-deps

  const setDayType = (idx: number, type: DayType) =>
    setDayConfigs((prev) => prev.map((c, i) => (i === idx ? { ...c, type } : c)))

  const setDayTech = (idx: number, tech: TechFocus) =>
    setDayConfigs((prev) => prev.map((c, i) => (i === idx ? { ...c, tech } : c)))

  const maisonDays = dayConfigs.filter((d) => d.type === 'maison')
  const boxDays = dayConfigs.filter((d) => d.type === 'box')
  const activeDays = maisonDays.length + boxDays.length

  const handleGenerate = async () => {
    if (activeDays === 0) {
      toast.error('Sélectionne au moins un jour')
      return
    }

    setPhase('loading')
    try {
      const res = await workoutsService.generateWeeklyPlan(
        [...maisonDays, ...boxDays].map((d) => ({
          date: d.date,
          type: d.type === 'maison' ? 'perso' : 'box',
          focus: d.type === 'maison' ? (d.tech || undefined) : undefined,
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
    setDayConfigs(days.map((d) => ({ date: format(d, 'yyyy-MM-dd'), type: 'repos' as DayType, tech: '' as TechFocus })))
    onOpenChange(false)
  }

  const weekLabel = `semaine du ${format(currentWeekStart, 'dd MMMM', { locale: fr })}`

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[860px] max-h-[90vh] overflow-hidden flex flex-col bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5 text-orange-400" />
            <span>Planifier la {weekLabel}</span>
            <div className="ml-auto flex items-center gap-1">
              <button
                onClick={() => setWeekOffset((o) => o - 1)}
                disabled={weekOffset <= 0}
                className="p-1 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setWeekOffset((o) => o + 1)}
                className="p-1 rounded hover:bg-white/10 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Maison = workout IA généré · Box = WOD du jour (pas de génération) · Repos = journée libre
          </DialogDescription>
        </DialogHeader>

        {/* Phase: config */}
        {phase === 'config' && (
          <div className="flex flex-col gap-4 flex-1 overflow-auto">

            {suggestionWeeks > 0 && (
              <div className="text-xs text-slate-400 px-1">
                💡 Pré-rempli d&apos;après tes {suggestionWeeks} dernière{suggestionWeeks > 1 ? 's' : ''} semaine{suggestionWeeks > 1 ? 's' : ''} — modifie si besoin.
              </div>
            )}

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, idx) => {
                const config = dayConfigs[idx]
                return (
                  <div key={idx} className="flex flex-col gap-1.5">
                    <div className="text-center">
                      <div className="text-xs text-slate-500 capitalize">{format(day, 'EEE', { locale: fr })}</div>
                      <div className="text-sm font-semibold text-slate-200">{format(day, 'dd')}</div>
                    </div>

                    <div className="flex flex-col gap-1">
                      {DAY_TYPES.map(({ type, label, activeClass, inactiveClass }) => (
                        <button
                          key={type}
                          onClick={() => setDayType(idx, type)}
                          className={`w-full py-1.5 text-xs rounded-lg border transition-all ${config.type === type ? activeClass : inactiveClass}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>

                    {/* Technique selector for maison days */}
                    {config.type === 'maison' && (
                      <div className="flex flex-col gap-0.5">
                        {TECH_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setDayTech(idx, opt.value)}
                            className={`w-full py-1 text-xs rounded border transition-all ${
                              config.tech === opt.value
                                ? 'border-orange-500/60 bg-orange-500/10 text-orange-300'
                                : 'border-slate-800 text-slate-500 hover:text-slate-300'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Résumé */}
            <div className="p-3 rounded-xl bg-slate-800/50 border border-white/10 text-sm text-slate-400">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {maisonDays.length > 0 && (
                  <span className="text-orange-400 font-medium">🏠 {maisonDays.length} workout{maisonDays.length > 1 ? 's' : ''} IA</span>
                )}
                {boxDays.length > 0 && (
                  <span className="text-blue-400 font-medium">🏋️ {boxDays.length} jour{boxDays.length > 1 ? 's' : ''} Box</span>
                )}
                {activeDays === 0 && <span>Sélectionne des jours pour commencer</span>}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={handleClose} className="text-slate-400 hover:text-white">Annuler</Button>
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

        {/* Phase: loading */}
        {phase === 'loading' && (
          <div className="flex flex-col items-center justify-center flex-1 gap-4 py-16">
            <Loader2 className="w-12 h-12 animate-spin text-orange-400" />
            <div className="text-center">
              <p className="text-white font-medium">Génération en cours...</p>
              <p className="text-slate-400 text-sm mt-1">
                {maisonDays.length > 1 ? `${maisonDays.length} workouts IA en parallèle — 30-60s` : 'Quelques secondes...'}
              </p>
            </div>
          </div>
        )}

        {/* Phase: result */}
        {phase === 'result' && result && (
          <div className="flex flex-col gap-4 flex-1 overflow-auto">
            <div className="space-y-3">

              {result.workouts.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-orange-400" />
                    Workouts IA ({result.workouts.length})
                  </h4>
                  {result.workouts.map((s) => (
                    <div key={s.schedule_id} className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
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
                  {result.boxDays.map((date) => (
                    <div key={date} className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
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
                  {result.skipped.map((date) => (
                    <div key={date} className="flex items-center gap-3 p-3 rounded-lg bg-slate-700/30 border border-slate-700">
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
              <Button onClick={handleClose} className="bg-orange-500 hover:bg-orange-600 text-white">Fermer</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
