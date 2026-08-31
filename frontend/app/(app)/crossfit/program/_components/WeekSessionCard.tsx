'use client'

import { ProgramSessionDetail } from '@/components/program/ProgramSessionDetail'
import type { ProgramSession } from '@/services/training-programs'
import { ChevronDown, ChevronUp, Clock } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

const FOCUS_LABEL: Record<string, string> = {
  strength: 'Force',
  conditioning: 'Cardio',
  skill: 'Technique',
  mixed: 'Mixte',
  recovery: 'Récup',
}

export function WeekSessionCard({ session, num }: { session: ProgramSession; num: number }) {
  const [open, setOpen] = useState(false)
  const movements = [
    ...(session.strength_work?.movements.map((m) => m.name) ?? []),
    ...(session.conditioning?.movements.map((m) => m.name) ?? []),
    ...(session.skill_work ? [session.skill_work.name] : []),
  ]

  return (
    <div className="border border-border bg-card rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full text-left p-4 space-y-2 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="w-6 h-6 rounded-full bg-secondary text-foreground text-xs font-bold flex items-center justify-center shrink-0">
              {num}
            </span>
            <span className="eyebrow">{FOCUS_LABEL[session.focus] ?? session.focus}</span>
            {session._bonus && <span className="eyebrow text-primary">Bonus</span>}
            {session._progression?.deload && <span className="eyebrow text-primary">Deload</span>}
            {session._progression && !session._progression.deload && session._progression.intensity_delta > 0 && (
              <span className="eyebrow text-primary">+{session._progression.intensity_delta}%</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground shrink-0">
            <Clock className="w-3 h-3" />
            {session.estimated_duration} min
            {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
        <p className="font-display font-semibold text-foreground text-sm">{session.title}</p>
        {!open && movements.length > 0 && (
          <p className="text-xs text-muted-foreground truncate">
            {movements.slice(0, 4).join(' · ')}
            {movements.length > 4 ? ` +${movements.length - 4}` : ''}
          </p>
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-border">
          <ProgramSessionDetail session={session} />
          {session.schedule_id && session.status !== 'completed' && (
            <Link
              href={`/crossfit/program/log-session?scheduleId=${session.schedule_id}`}
              className="mt-3 inline-flex items-center justify-center w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-semibold hover:bg-primary/90 transition-all"
            >
              Logger la séance
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
