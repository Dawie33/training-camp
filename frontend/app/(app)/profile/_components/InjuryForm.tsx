'use client'

import {
  INJURY_NOTES_MAX_LENGTH,
  INJURY_SEVERITIES,
  INJURY_SIDES,
  INJURY_STATUSES,
  INJURY_ZONES,
  PAINFUL_PATTERNS,
  PATTERN_EXAMPLES,
  PATTERN_LABELS,
  SEVERITY_LABELS,
  SIDE_LABELS,
  STATUS_DESCRIPTIONS,
  STATUS_LABELS,
  ZONE_LABELS,
} from '@/domain/entities/injury'
import type { Injury, InjurySeverity, InjuryStatus, InjuryZone, PainfulPattern } from '@/domain/entities/injury'
import { useState } from 'react'

const inputClass = 'w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50 transition-colors'

interface InjuryFormProps {
  initial?: Injury
  saving: boolean
  onSave: (injury: Injury) => void
  onCancel: () => void
}

interface ChipProps {
  selected: boolean
  onClick: () => void
  title?: string
  children: React.ReactNode
}

function Chip({ selected, onClick, title, children }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={selected}
      className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
        selected
          ? 'bg-orange-500 text-white border-orange-500 shadow-sm shadow-orange-500/30'
          : 'border-slate-700/50 text-slate-400 hover:bg-slate-800 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-slate-300 mb-1.5">{label}</p>
      {hint && <p className="text-xs text-slate-500 -mt-1 mb-1.5">{hint}</p>}
      {children}
    </div>
  )
}

/** Mois courant au format AAAA-MM, pour empêcher de saisir une date future. */
function currentMonth(): string {
  return new Date().toISOString().slice(0, 7)
}

export function InjuryForm({ initial, saving, onSave, onCancel }: InjuryFormProps) {
  const [zone, setZone] = useState<InjuryZone | null>(initial?.zone ?? null)
  const [side, setSide] = useState(initial?.side ?? 'none')
  const [status, setStatus] = useState<InjuryStatus | null>(initial?.status ?? null)
  const [severity, setSeverity] = useState<InjurySeverity | null>(initial?.severity ?? null)
  const [patterns, setPatterns] = useState<PainfulPattern[]>(initial?.painful_patterns ?? [])
  const [since, setSince] = useState(initial?.since ?? '')
  const [notes, setNotes] = useState(initial?.notes ?? '')

  const isComplete = zone !== null && status !== null && severity !== null

  const togglePattern = (pattern: PainfulPattern) => {
    setPatterns((prev) => (prev.includes(pattern) ? prev.filter((p) => p !== pattern) : [...prev, pattern]))
  }

  const handleSubmit = () => {
    if (!isComplete) return
    onSave({
      zone,
      side,
      status,
      severity,
      painful_patterns: patterns,
      since: since || undefined,
      notes: notes.trim() || undefined,
    })
  }

  return (
    <div className="rounded-xl p-4 bg-slate-900/50 border border-orange-500/40 space-y-4">
      <p className="text-sm font-bold">{initial ? 'Modifier la blessure' : 'Nouvelle blessure'}</p>

      <Field label="Zone">
        <div className="flex flex-wrap gap-1.5">
          {INJURY_ZONES.map((value) => (
            <Chip key={value} selected={zone === value} onClick={() => setZone(value)}>
              {ZONE_LABELS[value]}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Côté">
        <div className="flex flex-wrap gap-1.5">
          {INJURY_SIDES.map((value) => (
            <Chip key={value} selected={side === value} onClick={() => setSide(value)}>
              {SIDE_LABELS[value]}
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Statut">
        <div className="flex flex-wrap gap-1.5">
          {INJURY_STATUSES.map((value) => (
            <Chip key={value} selected={status === value} onClick={() => setStatus(value)}>
              {STATUS_LABELS[value]}
            </Chip>
          ))}
        </div>
        {status && <p className="text-xs text-slate-400 mt-1.5">{STATUS_DESCRIPTIONS[status]}</p>}
      </Field>

      <Field label="Gravité">
        <div className="flex flex-wrap gap-1.5">
          {INJURY_SEVERITIES.map((value) => (
            <Chip key={value} selected={severity === value} onClick={() => setSeverity(value)}>
              {SEVERITY_LABELS[value]}
            </Chip>
          ))}
        </div>
      </Field>

      {status === 'active' && severity === 'severe' && (
        <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2">
          Une douleur présente au quotidien doit être évaluée par un professionnel de santé. En attendant, l'IA mettra
          cette zone au repos complet.
        </p>
      )}

      <Field
        label="Mouvements douloureux (facultatif)"
        hint="Sans précision, l'IA déduit les mouvements à risque à partir de la zone."
      >
        <div className="flex flex-wrap gap-1.5">
          {PAINFUL_PATTERNS.map((value) => (
            <Chip
              key={value}
              selected={patterns.includes(value)}
              onClick={() => togglePattern(value)}
              title={PATTERN_EXAMPLES[value]}
            >
              {PATTERN_LABELS[value]}
            </Chip>
          ))}
        </div>
        {/* Les infobulles (title) ne s'affichent pas sur mobile : on rappelle les exemples ici */}
        {patterns.length > 0 && (
          <p className="text-xs text-slate-400 mt-1.5">
            Exemples concernés : {patterns.map((p) => PATTERN_EXAMPLES[p]).join(' · ')}
          </p>
        )}
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Depuis (facultatif)">
          <input
            type="month"
            value={since}
            max={currentMonth()}
            onChange={(e) => setSince(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Note (facultatif)">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={INJURY_NOTES_MAX_LENGTH}
          rows={2}
          placeholder="Ex. : douleur sur le jerk au-delà de 80 %"
          className={inputClass}
        />
        <p className="text-xs text-slate-500 text-right mt-1">
          {notes.length}/{INJURY_NOTES_MAX_LENGTH}
        </p>
      </Field>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 transition-colors disabled:opacity-50"
        >
          Annuler
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!isComplete || saving}
          className="flex-1 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer la blessure'}
        </button>
      </div>
      {!isComplete && <p className="text-xs text-slate-500 text-center">Zone, statut et gravité sont obligatoires.</p>}
    </div>
  )
}
