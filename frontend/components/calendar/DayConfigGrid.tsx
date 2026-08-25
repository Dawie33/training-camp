'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

export type DayType = 'wod' | 'conditioning' | 'mobility' | 'force'

export interface DayConfig {
  date: string
  isBox: boolean
  isRest: boolean
  types: DayType[]
}

const DAY_TYPES: { type: DayType; label: string; activeClass: string; hoverClass: string }[] = [
  { type: 'wod', label: 'WOD', activeClass: 'border-primary bg-primary/10 text-primary', hoverClass: 'hover:border-primary hover:text-primary' },
  { type: 'conditioning', label: 'Conditioning', activeClass: 'border-orange-600/30 bg-orange-600/10 text-orange-700', hoverClass: 'hover:border-orange-600/40 hover:text-orange-700' },
  { type: 'mobility', label: 'Mobilité', activeClass: 'border-green-600/30 bg-green-600/10 text-green-700', hoverClass: 'hover:border-green-600/40 hover:text-green-700' },
  { type: 'force', label: 'Force', activeClass: 'border-blue-600/30 bg-blue-600/10 text-blue-700', hoverClass: 'hover:border-blue-600/40 hover:text-blue-700' },
]

interface DayConfigGridProps {
  days: Date[]
  dayConfigs: DayConfig[]
  onToggleBox: (idx: number) => void
  onToggleRest: (idx: number) => void
  onToggleType: (idx: number, type: DayType) => void
}

export function DayConfigGrid({ days, dayConfigs, onToggleBox, onToggleRest, onToggleType }: DayConfigGridProps) {
  return (
    <div className="space-y-1.5">
      {days.map((day, idx) => {
        const config = dayConfigs[idx]
        const isBlocked = config.isBox || config.isRest
        const hasTypes = config.types.length > 0

        return (
          <div
            key={idx}
            className={`rounded-md border transition-all ${config.isRest
              ? 'border-border bg-muted/60 opacity-60'
              : config.isBox
                ? 'border-blue-600/30 bg-blue-600/10'
                : hasTypes
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
                  {DAY_TYPES.map(({ type, label, activeClass, hoverClass }) => {
                    const selected = config.types.includes(type)
                    return (
                      <button
                        key={type}
                        onClick={() => onToggleType(idx, type)}
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
          </div>
        )
      })}
    </div>
  )
}