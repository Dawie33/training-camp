'use client'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WeeklyPlanResult, workoutsService } from '@/services/workouts'
import { addDays, format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { Calendar, CheckCircle, Loader2, SkipForward, Zap } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'

interface WeeklyPlannerModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  weekStart: Date
  onPlanned: () => void
}

type DayType = 'perso' | 'box' | 'rest'
type Phase = 'config' | 'loading' | 'result'

const FOCUS_OPTIONS = [
  { value: '', label: 'Mixte (par défaut)' },
  { value: 'Force', label: 'Force' },
  { value: 'Cardio', label: 'Cardio' },
  { value: 'Haltérophilie', label: 'Haltérophilie' },
  { value: 'Gymnastic', label: 'Gymnastic' },
  { value: 'Conditionnement', label: 'Conditionnement' },
]

const DAY_TYPE_CONFIG: Record<DayType, { label: string; emoji: string; class: string; activeClass: string }> = {
  perso: {
    label: 'Perso',
    emoji: '💪',
    class: 'border-slate-700 text-slate-400 hover:border-orange-500/50 hover:text-orange-400',
    activeClass: 'border-orange-500 bg-orange-500/20 text-orange-400',
  },
  box: {
    label: 'Box',
    emoji: '🏋️',
    class: 'border-slate-700 text-slate-400 hover:border-blue-500/50 hover:text-blue-400',
    activeClass: 'border-blue-500 bg-blue-500/20 text-blue-400',
  },
  rest: {
    label: 'Repos',
    emoji: '😴',
    class: 'border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-300',
    activeClass: 'border-slate-500 bg-slate-700/50 text-slate-300',
  },
}

interface DayConfig {
  date: string
  type: DayType
  focus: string
}

export function WeeklyPlannerModal({ open, onOpenChange, weekStart, onPlanned }: WeeklyPlannerModalProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  const [dayConfigs, setDayConfigs] = useState<DayConfig[]>(() =>
    days.map((d) => ({
      date: format(d, 'yyyy-MM-dd'),
      type: 'rest' as DayType,
      focus: '',
    }))
  )

  const [phase, setPhase] = useState<Phase>('config')
  const [result, setResult] = useState<WeeklyPlanResult | null>(null)

  const setDayType = (idx: number, type: DayType) => {
    setDayConfigs((prev) => prev.map((c, i) => (i === idx ? { ...c, type } : c)))
  }

  const setDayFocus = (idx: number, focus: string) => {
    setDayConfigs((prev) => prev.map((c, i) => (i === idx ? { ...c, focus } : c)))
  }

  const persoDaysCount = dayConfigs.filter((d) => d.type === 'perso').length
  const boxDaysCount = dayConfigs.filter((d) => d.type === 'box').length

  const handleGenerate = async () => {
    if (persoDaysCount === 0 && boxDaysCount === 0) {
      toast.error('Sélectionne au moins un jour Perso ou Box')
      return
    }
    try {
      setPhase('loading')
      const res = await workoutsService.generateWeeklyPlan(
        dayConfigs.map((d) => ({
          date: d.date,
          type: d.type,
          focus: d.focus || undefined,
        }))
      )
      setResult(res)
      setPhase('result')
      if (res.scheduled.length > 0) {
        onPlanned()
      }
    } catch {
      toast.error('Erreur lors de la génération du plan. Veuillez réessayer.')
      setPhase('config')
    }
  }

  const handleClose = () => {
    setPhase('config')
    setResult(null)
    setDayConfigs(days.map((d) => ({
      date: format(d, 'yyyy-MM-dd'),
      type: 'rest' as DayType,
      focus: '',
    })))
    onOpenChange(false)
  }

  const weekLabel = `semaine du ${format(weekStart, 'dd MMMM', { locale: fr })}`

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[820px] max-h-[90vh] overflow-hidden flex flex-col bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <Calendar className="w-5 h-5 text-orange-400" />
            Planifier la {weekLabel}
          </DialogTitle>
          <DialogDescription className="text-slate-400">
            Définis tes jours Perso, Box ou Repos — l&apos;IA génère les WODs Perso et planifie tout
          </DialogDescription>
        </DialogHeader>

        {/* Phase: config */}
        {phase === 'config' && (
          <div className="flex flex-col gap-5 flex-1 overflow-auto">
            {/* Day grid */}
            <div className="grid grid-cols-7 gap-2">
              {days.map((day, idx) => {
                const config = dayConfigs[idx]
                return (
                  <div key={idx} className="flex flex-col gap-1.5">
                    {/* Day header */}
                    <div className="text-center">
                      <div className="text-xs text-slate-500 capitalize">
                        {format(day, 'EEE', { locale: fr })}
                      </div>
                      <div className="text-sm font-semibold text-slate-200">
                        {format(day, 'dd')}
                      </div>
                    </div>

                    {/* Type buttons */}
                    <div className="flex flex-col gap-1">
                      {(Object.keys(DAY_TYPE_CONFIG) as DayType[]).map((t) => {
                        const cfg = DAY_TYPE_CONFIG[t]
                        const active = config.type === t
                        return (
                          <button
                            key={t}
                            onClick={() => setDayType(idx, t)}
                            className={`w-full py-1.5 text-xs rounded-lg border transition-all ${active ? cfg.activeClass : cfg.class}`}
                          >
                            {cfg.emoji} {cfg.label}
                          </button>
                        )
                      })}
                    </div>

                    {/* Focus selector for Perso days */}
                    {config.type === 'perso' && (
                      <Select value={config.focus} onValueChange={(v) => setDayFocus(idx, v)}>
                        <SelectTrigger className="h-7 text-xs bg-slate-800/50 border-slate-700 text-slate-300">
                          <SelectValue placeholder="Focus..." />
                        </SelectTrigger>
                        <SelectContent>
                          {FOCUS_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value || ' '} className="text-xs">
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Summary */}
            <div className="p-3 rounded-xl bg-slate-800/50 border border-white/10 text-sm text-slate-400 space-y-1">
              <div className="flex flex-wrap gap-x-4 gap-y-1">
                {persoDaysCount > 0 && (
                  <span className="text-orange-400 font-medium">
                    💪 {persoDaysCount} séance{persoDaysCount > 1 ? 's' : ''} perso générée{persoDaysCount > 1 ? 's' : ''} par l&apos;IA
                  </span>
                )}
                {boxDaysCount > 0 && (
                  <span className="text-blue-400 font-medium">
                    🏋️ {boxDaysCount} jour{boxDaysCount > 1 ? 's' : ''} Box — WOD à importer le jour J
                  </span>
                )}
                {persoDaysCount === 0 && boxDaysCount === 0 && (
                  <span>Sélectionne des jours Perso ou Box pour commencer</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="ghost"
                onClick={handleClose}
                className="text-slate-400 hover:text-white"
              >
                Annuler
              </Button>
              <Button
                onClick={handleGenerate}
                disabled={persoDaysCount === 0 && boxDaysCount === 0}
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
                {persoDaysCount > 1
                  ? `${persoDaysCount} workouts générés en parallèle — peut prendre 30-60s`
                  : 'Peut prendre quelques secondes'}
              </p>
            </div>
          </div>
        )}

        {/* Phase: result */}
        {phase === 'result' && result && (
          <div className="flex flex-col gap-4 flex-1 overflow-auto">
            <div className="space-y-2">
              {/* Scheduled workouts */}
              {result.scheduled.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Workouts planifiés ({result.scheduled.length})
                  </h4>
                  {result.scheduled.map((s) => (
                    <div
                      key={s.schedule_id}
                      className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                    >
                      <span className="text-sm text-slate-400 w-28 flex-shrink-0">
                        {format(new Date(s.date + 'T00:00:00'), 'EEE dd/MM', { locale: fr })}
                      </span>
                      <span className="text-sm font-medium text-white">{s.workout_name}</span>
                      <span className="ml-auto text-xs text-green-400">✓ Planifié</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Box days */}
              {result.box_days.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    🏋️ Jours Box ({result.box_days.length})
                  </h4>
                  {result.box_days.map((date) => (
                    <div
                      key={date}
                      className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
                    >
                      <span className="text-sm text-slate-400 w-28 flex-shrink-0">
                        {format(new Date(date + 'T00:00:00'), 'EEE dd/MM', { locale: fr })}
                      </span>
                      <span className="text-sm text-slate-300">Box WOD — à importer le jour J</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Skipped days */}
              {result.skipped.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-slate-300 flex items-center gap-2">
                    <SkipForward className="w-4 h-4 text-orange-400" />
                    Dates ignorées — déjà planifiées ({result.skipped.length})
                  </h4>
                  {result.skipped.map((date) => (
                    <div
                      key={date}
                      className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20"
                    >
                      <span className="text-sm text-slate-400 w-28 flex-shrink-0">
                        {format(new Date(date + 'T00:00:00'), 'EEE dd/MM', { locale: fr })}
                      </span>
                      <span className="text-sm text-slate-400">Déjà planifié, ignoré</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-white/10">
              <Button
                onClick={handleClose}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                Fermer
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
