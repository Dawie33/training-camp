'use client'

import { PATTERN_LABELS, SEVERITY_LABELS, STATUS_LABELS, formatInjuryZone } from '@/domain/entities/injury'
import type { Injury, InjuryStatus } from '@/domain/entities/injury'
import { useState } from 'react'
import type { InjuryEditing } from '../_hooks/useInjuries'
import { InjuryForm } from './InjuryForm'

const STATUS_BADGE_CLASSES: Record<InjuryStatus, string> = {
  active: 'bg-red-500/15 text-red-300 border-red-500/30',
  recovering: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  past: 'bg-slate-700/50 text-slate-300 border-slate-600/50',
}

/** « 2026-09 » → « sept. 2026 » */
function formatSince(since: string): string {
  const date = new Date(`${since}-01T00:00:00`)
  return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
}

interface InjuriesTabProps {
  injuries: Injury[]
  editing: InjuryEditing
  saving: boolean
  onAdd: () => void
  onEdit: (index: number) => void
  onCancel: () => void
  onSave: (injury: Injury) => void
  onDelete: (index: number) => void
}

interface InjuryCardProps {
  injury: Injury
  disabled: boolean
  onEdit: () => void
  onDelete: () => void
}

function InjuryCard({ injury, disabled, onEdit, onDelete }: InjuryCardProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false)

  return (
    <div className="rounded-xl p-4 bg-slate-900/50 border border-slate-700/50 space-y-1.5">
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold">{formatInjuryZone(injury)}</p>
        <span className={`shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full border ${STATUS_BADGE_CLASSES[injury.status]}`}>
          {STATUS_LABELS[injury.status]}
        </span>
      </div>
      <p className="text-sm text-slate-400">
        {SEVERITY_LABELS[injury.severity]}
        {injury.since && ` · depuis ${formatSince(injury.since)}`}
      </p>
      {injury.painful_patterns.length > 0 && (
        <p className="text-sm text-slate-300">{injury.painful_patterns.map((p) => PATTERN_LABELS[p]).join(' · ')}</p>
      )}
      {injury.notes && <p className="text-sm text-slate-400 italic">« {injury.notes} »</p>}

      <div className="flex justify-end gap-2 pt-1">
        {confirmingDelete ? (
          <>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              disabled={disabled}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-slate-300 hover:bg-slate-700/50 transition-colors"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={disabled}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
            >
              Confirmer la suppression
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              onClick={onEdit}
              disabled={disabled}
              className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-700/50 hover:text-white transition-colors disabled:opacity-50"
            >
              Modifier
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(true)}
              disabled={disabled}
              className="px-3 py-1.5 text-xs font-medium rounded-lg text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              Supprimer
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export function InjuriesTab({ injuries, editing, saving, onAdd, onEdit, onCancel, onSave, onDelete }: InjuriesTabProps) {
  // Un seul formulaire ouvert à la fois : les autres actions sont désactivées pendant la saisie
  const isEditing = editing !== null

  return (
    <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-5">
      <div>
        <h2 className="text-lg font-bold">Blessures et douleurs</h2>
        <p className="text-sm text-slate-400 mt-1">
          L'IA adapte vos séances selon le statut de chaque blessure : mouvements exclus, allégés, ou simple prévention.
        </p>
        <p className="text-xs text-slate-500 mt-2">
          Ces informations servent uniquement à adapter votre programmation. Elles ne remplacent pas l'avis d'un
          professionnel de santé.
        </p>
      </div>

      {injuries.length === 0 && editing !== 'new' && (
        <p className="text-sm text-slate-500 text-center py-4">Aucune blessure déclarée.</p>
      )}

      <div className="space-y-3">
        {injuries.map((injury, index) => {
          // Clé liée au contenu : après une suppression, la carte suivante est recréée au lieu
          // d'hériter de l'état « Confirmer la suppression » de la carte supprimée
          const key = `${index}-${JSON.stringify(injury)}`
          return editing === index ? (
            <InjuryForm key={key} initial={injury} saving={saving} onSave={onSave} onCancel={onCancel} />
          ) : (
            <InjuryCard
              key={key}
              injury={injury}
              disabled={isEditing || saving}
              onEdit={() => onEdit(index)}
              onDelete={() => onDelete(index)}
            />
          )
        })}
        {editing === 'new' && <InjuryForm saving={saving} onSave={onSave} onCancel={onCancel} />}
      </div>

      {!isEditing && (
        <button
          type="button"
          onClick={onAdd}
          disabled={saving}
          className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-semibold transition-all shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
        >
          + Ajouter une blessure
        </button>
      )}
    </div>
  )
}
