'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { format, startOfWeek } from 'date-fns'
import { fr } from 'date-fns/locale'
import { useState } from 'react'

interface ScheduleWeekModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  weekNum: number
  sessionsCount: number
  onSchedule: (startDate: string, boxDates: string[]) => Promise<void>
}

export function ScheduleWeekModal({ open, onOpenChange, weekNum, sessionsCount, onSchedule }: ScheduleWeekModalProps) {
  const [startDate, setStartDate] = useState(() => {
    const monday = startOfWeek(new Date(), { weekStartsOn: 1 })
    return format(monday, 'yyyy-MM-dd')
  })
  const [boxDates, setBoxDates] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  // Générer les 7 jours de la semaine à partir de startDate
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate)
    d.setDate(d.getDate() + i)
    return {
      date: format(d, 'yyyy-MM-dd'),
      label: format(d, 'EEEE dd/MM', { locale: fr }),
    }
  })

  const toggleBoxDate = (date: string) => {
    setBoxDates((prev) => prev.includes(date) ? prev.filter((d) => d !== date) : [...prev, date])
  }

  const availableCount = weekDays.filter((d) => !boxDates.includes(d.date)).length

  const handleSubmit = async () => {
    setSaving(true)
    try {
      await onSchedule(startDate, boxDates)
      onOpenChange(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px] bg-slate-900 border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Planifier la semaine {weekNum}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-slate-400">
          {sessionsCount} séance(s) à placer. Choisissez vos jours box pour les exclure.
        </p>

        {/* Sélection du lundi de la semaine */}
        <div>
          <label className="text-xs text-slate-400 mb-1.5 block">Début de la semaine</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => { setStartDate(e.target.value); setBoxDates([]) }}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500/50"
          />
        </div>

        {/* Toggle jours box */}
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Jours Box (à exclure)</label>
          <div className="grid grid-cols-1 gap-1.5">
            {weekDays.map(({ date, label }) => (
              <button
                key={date}
                onClick={() => toggleBoxDate(date)}
                className={`flex items-center justify-between px-3 py-2 rounded-lg border text-sm transition-all ${
                  boxDates.includes(date)
                    ? 'border-violet-500/50 bg-violet-500/10 text-violet-400'
                    : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/20'
                }`}
              >
                <span className="capitalize">{label}</span>
                {boxDates.includes(date) && <span className="text-xs">Box</span>}
              </button>
            ))}
          </div>
        </div>

        {availableCount < sessionsCount && (
          <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            Pas assez de jours disponibles ({availableCount} dispo, {sessionsCount} nécessaires)
          </p>
        )}

        <button
          onClick={handleSubmit}
          disabled={saving || availableCount < sessionsCount}
          className="w-full py-2.5 rounded-xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-medium text-sm hover:from-orange-600 hover:to-rose-600 transition-all disabled:opacity-50"
        >
          {saving ? 'Planification...' : `Planifier ${sessionsCount} séance(s)`}
        </button>
      </DialogContent>
    </Dialog>
  )
}
