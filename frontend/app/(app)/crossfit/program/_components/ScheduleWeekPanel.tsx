'use client'

import { Button } from '@/components/ui/button'
import type { ProgramSession } from '@/services/training-programs'
import { Calendar, CalendarPlus, Loader2 } from 'lucide-react'

interface ScheduleWeekPanelProps {
  viewWeek: number
  sessions: ProgramSession[]
  scheduleDate: string
  onScheduleDateChange: (date: string) => void
  sessionDates: string[]
  onSessionDateChange: (index: number, date: string) => void
  scheduling: boolean
  onSchedule: () => void
}

export function ScheduleWeekPanel({
  viewWeek,
  sessions,
  scheduleDate,
  onScheduleDateChange,
  sessionDates,
  onSessionDateChange,
  scheduling,
  onSchedule,
}: ScheduleWeekPanelProps) {
  return (
    <div className="mb-4 border border-primary/30 bg-secondary/40 rounded-lg p-4 space-y-4">
      <div className="flex items-start gap-2">
        <CalendarPlus className="w-4 h-4 text-primary mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground">
          Choisis le jour de chaque séance de la semaine {viewWeek}. Le bouton ci-dessous répartit
          automatiquement les séances sur la semaine, à toi d&apos;ajuster.
        </p>
      </div>

      {/* Base de semaine pour la répartition automatique */}
      <div className="flex items-center gap-2">
        <label className="eyebrow">Répartir à partir du</label>
        <input
          type="date"
          value={scheduleDate}
          onChange={(e) => onScheduleDateChange(e.target.value)}
          className="px-2 py-1 bg-card border border-border rounded-md text-foreground text-xs focus:outline-none focus:border-primary"
        />
      </div>

      {/* Une date par séance */}
      <div className="space-y-2">
        {sessions.map((session, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-6 h-6 rounded-full bg-secondary text-foreground text-xs font-bold flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <span className="flex-1 text-sm text-foreground truncate">
              {session.title}
              {session._bonus && <span className="ml-2 text-xs text-primary">· Bonus</span>}
            </span>
            <input
              type="date"
              value={sessionDates[i] ?? ''}
              onChange={(e) => onSessionDateChange(i, e.target.value)}
              className="px-3 py-1.5 bg-card border border-border rounded-md text-foreground text-sm focus:outline-none focus:border-primary"
            />
          </div>
        ))}
      </div>

      <Button onClick={onSchedule} disabled={scheduling} className="w-full sm:w-auto rounded-full font-display font-semibold">
        {scheduling ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />Planification...
          </>
        ) : (
          <>
            <Calendar className="w-4 h-4 mr-2" />Ajouter au calendrier
          </>
        )}
      </Button>
    </div>
  )
}
