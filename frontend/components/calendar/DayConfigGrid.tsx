'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export type SportType = 'crossfit' | 'running' | 'biking'
export type TechFocus = '' | 'skills' | 'altero' | 'force'

export interface DayConfig {
  date: string
  isBox: boolean
  isRest: boolean
  sports: SportType[]
  crossfitFocus: TechFocus
}

const SPORTS: { type: SportType; label: string; activeClass: string; hoverClass: string }[] = [
  { type: 'crossfit', label: 'CrossFit', activeClass: 'border-primary bg-primary/10 text-primary', hoverClass: 'hover:border-primary hover:text-primary' },
  { type: 'running', label: 'Running', activeClass: 'border-green-600/30 bg-green-600/10 text-green-700', hoverClass: 'hover:border-green-600/40 hover:text-green-700' },
  { type: 'biking', label: 'Vélo', activeClass: 'border-blue-600/30 bg-blue-600/10 text-blue-700', hoverClass: 'hover:border-blue-600/40 hover:text-blue-700' },
]

const TECH_OPTIONS: { value: TechFocus; label: string }[] = [
  { value: '', label: 'Auto' },
  { value: 'skills', label: 'Skills' },
  { value: 'altero', label: 'Altéro' },
  { value: 'force', label: 'Force' },
]

interface DayConfigGridProps {
  days: Date[]
  dayConfigs: DayConfig[]
  onToggleBox: (idx: number) => void
  onToggleRest: (idx: number) => void
  onToggleSport: (idx: number, sport: SportType) => void
  onCrossfitFocusChange: (idx: number, focus: TechFocus) => void
}

export function DayConfigGrid({ days, dayConfigs, onToggleBox, onToggleRest, onToggleSport, onCrossfitFocusChange }: DayConfigGridProps) {
  return (
    <div className="space-y-1.5">
      {days.map((day, idx) => {
        const config = dayConfigs[idx]
        const isBlocked = config.isBox || config.isRest
        const hasSports = config.sports.length > 0
        const hasCrossFit = config.sports.includes('crossfit')

        return (
          <div
            key={idx}
            className={`rounded-md border transition-all ${config.isRest
                ? 'border-border bg-muted/60 opacity-60'
                : config.isBox
                  ? 'border-blue-600/30 bg-blue-600/10'
                  : hasSports
                    ? 'border-border bg-muted/60'
                    : 'border-border bg-card'
              }`}
          >
            <div className="flex items-center px-3 py-2.5">

              {/* Jour + date — même ligne, gauche */}
              <div className="w-32 flex-shrink-0 flex items-center gap-1.5">
                <p className="text-xs font-semibold text-foreground capitalize">
                  {format(day, 'EEE', { locale: fr })}
                </p>
                <p className="text-xs text-muted-foreground">{format(day, 'dd MMM', { locale: fr })}</p>
              </div>

              {/* Séparateur vertical */}
              <div className="w-px h-6 bg-border flex-shrink-0 mr-4" />

              {/* Sport pills */}
              {!isBlocked ? (
                <div className="flex flex-wrap gap-1.5 flex-1">
                  {SPORTS.map(({ type, label, activeClass, hoverClass }) => {
                    const selected = config.sports.includes(type)
                    return (
                      <button
                        key={type}
                        onClick={() => onToggleSport(idx, type)}
                        className={`px-2.5 py-1 text-xs rounded-md border transition-all ${selected ? activeClass : `border-border text-muted-foreground ${hoverClass}`
                          }`}
                      >
                        {label}
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="flex-1 text-xs text-muted-foreground italic">
                  {config.isBox ? 'WOD du jour à importer' : 'Journée de récupération'}
                </p>
              )}

              {/* Box / Repos — extrême droite */}
              <div className="flex gap-1.5 ml-4">
                <button
                  onClick={() => onToggleBox(idx)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-all ${config.isBox
                      ? 'border-blue-600/30 bg-blue-600/10 text-blue-700 font-medium'
                      : 'border-border text-muted-foreground hover:border-blue-600/40 hover:text-foreground'
                    }`}
                >
                  Box
                </button>
                <button
                  onClick={() => onToggleRest(idx)}
                  className={`px-2.5 py-1 text-xs rounded-md border transition-all ${config.isRest
                      ? 'border-border bg-muted text-foreground font-medium'
                      : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
                    }`}
                >
                  Repos
                </button>
              </div>
            </div>

            {/* Focus CrossFit — sous-ligne */}
            {!isBlocked && hasCrossFit && (
              <div className="flex items-center gap-2 px-3 pb-2 border-t border-border pt-1.5 ml-[calc(4rem+1rem+85px+1rem)]">
                <span className="text-[10px] text-muted-foreground">Focus :</span>
                {TECH_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => onCrossfitFocusChange(idx, opt.value)}
                    className={`px-2 py-0.5 text-[10px] rounded border transition-all ${config.crossfitFocus === opt.value
                        ? 'border-primary/60 bg-primary/10 text-primary'
                        : 'border-border text-muted-foreground hover:text-foreground hover:border-primary'
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