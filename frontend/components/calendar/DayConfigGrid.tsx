'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

type DayType = 'maison' | 'box' | 'repos'
type TechFocus = '' | 'skills' | 'altero' | 'force'

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

interface DayConfigGridProps {
  days: Date[]
  dayConfigs: DayConfig[]
  onDayTypeChange: (idx: number, type: DayType) => void
  onDayTechChange: (idx: number, tech: TechFocus) => void
}

export function DayConfigGrid({ days, dayConfigs, onDayTypeChange, onDayTechChange }: DayConfigGridProps) {
  return (
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
                  onClick={() => onDayTypeChange(idx, type)}
                  className={`w-full py-1.5 text-xs rounded-lg border transition-all ${config.type === type ? activeClass : inactiveClass}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {config.type === 'maison' && (
              <div className="flex flex-col gap-0.5">
                {TECH_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onDayTechChange(idx, opt.value)}
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
  )
}
