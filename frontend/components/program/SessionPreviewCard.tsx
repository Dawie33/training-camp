'use client'

import { ProgramSessionDetail } from '@/components/program/ProgramSessionDetail'
import type { ProgramSession } from '@/services/training-programs'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'

const FOCUS_LABEL: Record<string, string> = {
  strength: 'Force',
  conditioning: 'Cardio',
  skill: 'Technique',
  mixed: 'Mixte',
  recovery: 'Récup',
}

export function SessionPreviewCard({ session }: { session: ProgramSession }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border border-border bg-card rounded-md overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-secondary/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <span className="eyebrow">{FOCUS_LABEL[session.focus] ?? session.focus}</span>
          <span className="text-sm font-medium text-foreground">{session.title}</span>
          <span className="text-xs text-muted-foreground">{session.estimated_duration} min</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {open && (
        <div className="px-4 pb-3 pt-1 border-t border-border">
          <ProgramSessionDetail session={session} />
        </div>
      )}
    </div>
  )
}
