'use client'

import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
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

const inputClass = 'w-full px-3 py-2.5 rounded-xl bg-background border border-border text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 focus:border-primary/50 transition-colors'

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
    <Button variant="ghost"
      type="button"
      onClick={onClick}
      title={title}
      aria-pressed={selected}
      className={`px-2.5 py-1 text-xs rounded-full border transition-all ${
        selected
          ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90 hover:text-primary-foreground'
          : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground'
      }`}
    >
      {children}
    </Button>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-medium text-foreground mb-1.5">{label}</legend>
      {hint && <p className="text-xs text-muted-foreground -mt-1 mb-1.5">{hint}</p>}
      {children}
    </fieldset>
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
    <div className="rounded-xl p-4 bg-background border border-primary/40 space-y-4">
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
        {status && <p className="text-xs text-muted-foreground mt-1.5">{STATUS_DESCRIPTIONS[status]}</p>}
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
        <p className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-lg px-3 py-2">
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
          <p className="text-xs text-muted-foreground mt-1.5">
            Exemples concernés : {patterns.map((p) => PATTERN_EXAMPLES[p]).join(' · ')}
          </p>
        )}
      </Field>

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Depuis (facultatif)">
          <Input
            aria-label="Depuis (facultatif)"
            type="month"
            value={since}
            max={currentMonth()}
            onChange={(e) => setSince(e.target.value)}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Note (facultatif)">
        <Textarea
          aria-label="Note (facultatif)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          maxLength={INJURY_NOTES_MAX_LENGTH}
          rows={2}
          placeholder="Ex. : douleur sur le jerk au-delà de 80 %"
          className={inputClass}
        />
        <p className="text-xs text-muted-foreground text-right mt-1">
          {notes.length}/{INJURY_NOTES_MAX_LENGTH}
        </p>
      </Field>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button variant="ghost"
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-border text-foreground hover:bg-muted transition-colors disabled:opacity-50"
        >
          Annuler
        </Button>
        <Button variant="default"
          type="button"
          onClick={handleSubmit}
          disabled={!isComplete || saving}
          className="flex-1 px-4 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-sm font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          {saving ? 'Enregistrement...' : 'Enregistrer la blessure'}
        </Button>
      </div>
      {!isComplete && <p className="text-xs text-muted-foreground text-center">Zone, statut et gravité sont obligatoires.</p>}
    </div>
  )
}
