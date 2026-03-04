'use client'

import type { ProgramSession } from '@/domain/entities/training-program'
import { FOCUS_COLORS, FOCUS_LABELS } from '@/domain/entities/training-program'
import { ChevronDown, RefreshCw, Repeat2 } from 'lucide-react'
import { useState } from 'react'

interface SessionCardProps {
  session: ProgramSession
  weekNum: number
  onSwapSession: (sessionInWeek: number) => void
  onSwapExercise: (sessionInWeek: number, movementName: string) => void
}

const CONDITIONING_TYPE_LABELS: Record<string, string> = {
  amrap: 'AMRAP',
  for_time: 'For Time',
  emom: 'EMOM',
  tabata: 'Tabata',
  rounds_for_time: 'Rounds for Time',
  death_by: 'Death By',
  chipper: 'Chipper',
}

export function SessionCard({ session, weekNum, onSwapSession, onSwapExercise }: SessionCardProps) {
  const [notesOpen, setNotesOpen] = useState(false)
  const focusColor = FOCUS_COLORS[session.focus] ?? FOCUS_COLORS.mixed

  return (
    <div className="bg-white/5 rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="p-4 flex items-start justify-between gap-3">
        <div className="space-y-1 flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-500">Séance {session.session_in_week}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${focusColor}`}>
              {FOCUS_LABELS[session.focus] ?? session.focus}
            </span>
            {session._swapped && (
              <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full border border-yellow-400/20">
                Modifié
              </span>
            )}
          </div>
          <h3 className="font-semibold text-white">{session.title}</h3>
          <p className="text-xs text-slate-400">{session.estimated_duration} min</p>
        </div>
        <button
          onClick={() => onSwapSession(session.session_in_week)}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-orange-400 transition-colors px-2 py-1 rounded-lg hover:bg-orange-400/10 flex-shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Remplacer
        </button>
      </div>

      {/* Strength Work */}
      {session.strength_work && session.strength_work.movements.length > 0 && (
        <div className="px-4 pb-3">
          <div className="text-xs font-medium text-orange-400 mb-2 uppercase tracking-wider">Force</div>
          <div className="space-y-2">
            {session.strength_work.movements.map((movement, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-2 group"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full bg-orange-400/60 flex-shrink-0" />
                  <span className="text-sm text-white truncate">{movement.name}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-400 flex-shrink-0">
                  <span>{movement.sets}×{movement.reps}</span>
                  {movement.intensity && <span className="text-orange-400/70">{movement.intensity}</span>}
                  {movement.rest && <span>{movement.rest}</span>}
                  <button
                    onClick={() => onSwapExercise(session.session_in_week, movement.name)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-500 hover:text-blue-400"
                    title="Remplacer cet exercice"
                  >
                    <Repeat2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conditioning */}
      {session.conditioning && (
        <div className="px-4 pb-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="text-xs font-medium text-blue-400 uppercase tracking-wider">
              {CONDITIONING_TYPE_LABELS[session.conditioning.type] ?? session.conditioning.type}
            </div>
            {session.conditioning.duration_minutes && (
              <span className="text-xs text-slate-500">{session.conditioning.duration_minutes} min</span>
            )}
          </div>
          <div className="space-y-1.5">
            {session.conditioning.movements.map((m, idx) => (
              <div key={idx} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400/60 flex-shrink-0" />
                <span className="text-white">
                  {m.reps && <span className="text-blue-300 font-medium mr-1">{m.reps}</span>}
                  {m.name}
                  {m.weight && <span className="text-slate-400 ml-1">@ {m.weight}</span>}
                  {m.distance && <span className="text-slate-400 ml-1">({m.distance})</span>}
                </span>
              </div>
            ))}
          </div>
          {session.conditioning.scaling_notes && (
            <p className="text-xs text-slate-500 mt-2 italic">{session.conditioning.scaling_notes}</p>
          )}
        </div>
      )}

      {/* Skill Work */}
      {session.skill_work && (
        <div className="px-4 pb-3">
          <div className="text-xs font-medium text-violet-400 mb-2 uppercase tracking-wider">Technique</div>
          <div className="text-sm text-white font-medium">{session.skill_work.name}</div>
          <p className="text-xs text-slate-400 mt-1">{session.skill_work.description}</p>
          {session.skill_work.sets && (
            <p className="text-xs text-slate-500 mt-1">{session.skill_work.sets} sets</p>
          )}
        </div>
      )}

      {/* Coach Notes */}
      {session.coach_notes && (
        <div className="border-t border-white/5">
          <button
            onClick={() => setNotesOpen(!notesOpen)}
            className="w-full px-4 py-2 flex items-center justify-between text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Notes du coach
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${notesOpen ? 'rotate-180' : ''}`} />
          </button>
          {notesOpen && (
            <div className="px-4 pb-3 text-xs text-slate-400 italic">{session.coach_notes}</div>
          )}
        </div>
      )}

      {/* Week indicator */}
      <div className="px-4 py-2 bg-white/[0.02] border-t border-white/5 text-xs text-slate-600">
        Semaine {weekNum}
      </div>
    </div>
  )
}
