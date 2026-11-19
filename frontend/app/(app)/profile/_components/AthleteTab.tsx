'use client'

import type { Dispatch, SetStateAction } from 'react'
import { toast } from 'sonner'
import type { UpdateUserDTO, User } from '@/domain/entities/auth'
import { AVAILABLE_DAYS, GOALS } from '@/domain/entities/athlete-profile'
import { usersService } from '@/services/users'

const inputClass = 'w-full px-3 py-2.5 rounded-xl bg-slate-900/50 border border-slate-700/50 text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50'
const labelClass = 'block text-sm font-medium text-slate-300 mb-1.5'

function limitationText(value: User['physical_limitations']): string {
  if (!value) return ''
  if (Array.isArray(value)) return value.join('\n')
  return Object.entries(value).map(([key, entry]) =>
    `${key} : ${typeof entry === 'string' ? entry : JSON.stringify(entry)}`
  ).join('\n')
}

interface AthleteTabProps {
  user: User
  onSaved: (user: User) => void
  changes: UpdateUserDTO
  setChanges: Dispatch<SetStateAction<UpdateUserDTO>>
  limitationsDraft: string | null
  setLimitationsDraft: Dispatch<SetStateAction<string | null>>
  saving: boolean
  setSaving: Dispatch<SetStateAction<boolean>>
}

export function AthleteTab({
  user, onSaved, changes, setChanges, limitationsDraft, setLimitationsDraft, saving, setSaving,
}: AthleteTabProps) {
  const limitations = limitationsDraft ?? limitationText(user.physical_limitations)
  const values = { ...user, ...changes }
  const training = values.training_preferences ?? {}
  const goals = values.global_goals ?? {}
  const storedDays = values.schedule_preferences?.available_days
  const days = Array.isArray(storedDays) ? storedDays.filter(day => day in AVAILABLE_DAYS) : []
  const changed = Object.keys(changes).length > 0
  const historicalFields = {
    global_goals: user.global_goals,
    training_preferences: user.training_preferences,
    physical_limitations: user.physical_limitations,
    schedule_preferences: user.schedule_preferences,
  }
  const hasLegacyFields = Object.keys(user.global_goals ?? {}).some(key => !(key in GOALS)) ||
    Object.keys(user.training_preferences ?? {}).some(key => !['preferred_duration', 'sessions_per_week'].includes(key)) ||
    Object.keys(user.schedule_preferences ?? {}).some(key => key !== 'available_days') ||
    (storedDays != null && !Array.isArray(storedDays)) ||
    (user.physical_limitations != null && !Array.isArray(user.physical_limitations))

  function setField<K extends keyof UpdateUserDTO>(key: K, value: UpdateUserDTO[K]) {
    setChanges(previous => ({ ...previous, [key]: value }))
  }

  function changeTraining(key: 'preferred_duration' | 'sessions_per_week', value: string) {
    // Ne pas renvoyer les anciennes cles libres du JSON lors d'une correction explicite.
    setField('training_preferences', {
      preferred_duration: training.preferred_duration,
      sessions_per_week: training.sessions_per_week,
      [key]: value === '' ? undefined : Number(value),
    })
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const entries = changes.physical_limitations
    if (entries && (entries.length > 10 || entries.some(entry => entry.length > 300))) {
      toast.error('Limitations : 10 lignes maximum, 300 caractères par ligne')
      return
    }
    setSaving(true)
    try {
      const saved = await usersService.updateMe(changes)
      onSaved(saved)
      setChanges({})
      setLimitationsDraft(null)
      toast.success('Préférences sportives mises à jour')
    } catch {
      toast.error('Impossible de sauvegarder les préférences sportives')
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={save} className="bg-slate-800/50 rounded-2xl border border-slate-700/50 p-6 space-y-6">
      <h2 className="text-lg font-bold">Profil sportif et disponibilités</h2>
      <p className="text-sm text-slate-400">
        Ces informations facultatives aident le coach IA à adapter ses propositions. Les jours disponibles
        ne créent aucune séance automatiquement. Seuls les champs modifiés sont enregistrés.
      </p>
      {hasLegacyFields && <details className="text-sm text-amber-300">
        <summary>Anciennes données de profil conservées</summary>
        <p className="mt-2">
          Des champs historiques ne correspondent plus au formulaire. Ils sont conservés si tu ne modifies pas
          leur section. Modifier cette section la remplace par les valeurs du formulaire.
        </p>
        <pre className="mt-2 whitespace-pre-wrap break-words text-xs">{JSON.stringify(historicalFields, null, 2)}</pre>
      </details>}
      <fieldset disabled={saving} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="birth-date" className={labelClass}>Date de naissance</label>
            <input id="birth-date" type="date" min="1900-01-01" max={new Date().toLocaleDateString('fr-CA', { timeZone: 'Europe/Paris' })}
              value={values.dateOfBirth ?? ''} onChange={event => setField('dateOfBirth', event.target.value || null)}
              className={inputClass} aria-describedby="birth-date-help" />
            <p id="birth-date-help" className="text-xs text-slate-400 mt-1">Seul l&apos;âge est transmis au coach IA.</p>
          </div>
          <div>
            <label htmlFor="profile-gender" className={labelClass}>Genre</label>
            <select id="profile-gender" value={values.gender ?? ''} className={inputClass}
              onChange={event => {
                const value = event.target.value
                if (value === '' || value === 'male' || value === 'female' || value === 'other') {
                  setField('gender', value || null)
                }
              }}>
              <option value="">Non renseigné</option>
              <option value="male">Homme</option>
              <option value="female">Femme</option>
              <option value="other">Autre</option>
            </select>
          </div>
          <div>
            <label htmlFor="resting-heart-rate" className={labelClass}>FC de repos (bpm)</label>
            <input id="resting-heart-rate" type="number" min="30" max="120" step="1"
              value={values.resting_heart_rate ?? ''} className={inputClass}
              onChange={event => setField('resting_heart_rate', event.target.value === '' ? null : Number(event.target.value))}
              aria-describedby="resting-heart-rate-help" />
            <p id="resting-heart-rate-help" className="text-xs text-slate-400 mt-1">
              Valeur habituelle mesurée au repos. Une mesure isolée ne permet pas de juger la récupération.
            </p>
          </div>
        </div>

        <fieldset>
          <legend className={labelClass}>Objectifs</legend>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(GOALS).map(([key, label]) => {
              const goal = key as keyof typeof GOALS
              return <label key={goal} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={goals[goal] === true}
                  onChange={event => {
                    const knownGoals = Object.fromEntries(Object.keys(GOALS).map(name => [
                      name, goals[name as keyof typeof GOALS] === true,
                    ]))
                    setField('global_goals', { ...knownGoals, [goal]: event.target.checked })
                  }} className="accent-orange-500" />
                {label}
              </label>
            })}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="preferred-duration" className={labelClass}>Durée habituelle (minutes)</label>
            <input id="preferred-duration" type="number" min="20" max="90" step="1" className={inputClass}
              value={training.preferred_duration ?? ''} onChange={event => changeTraining('preferred_duration', event.target.value)} />
            <p className="text-xs text-slate-400 mt-1">Séance entière, échauffement et retour au calme inclus.</p>
          </div>
          <div>
            <label htmlFor="sessions-per-week" className={labelClass}>Séances souhaitées par semaine</label>
            <input id="sessions-per-week" type="number" min="1" max="7" step="1" className={inputClass}
              value={training.sessions_per_week ?? ''} onChange={event => changeTraining('sessions_per_week', event.target.value)} />
          </div>
        </div>

        <fieldset>
          <legend className={labelClass}>Jours disponibles (indicatifs)</legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {Object.entries(AVAILABLE_DAYS).map(([key, label]) => {
              const day = key as keyof typeof AVAILABLE_DAYS
              return <label key={day} className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={days.includes(day)} className="accent-orange-500"
                  onChange={event => setField('schedule_preferences', {
                    available_days: event.target.checked ? [...days, day] : days.filter(value => value !== day),
                  })} />
                {label}
              </label>
            })}
          </div>
          <p className="text-xs text-slate-400 mt-2">Aucun jour coché : aucune préférence, pas une semaine sans entraînement.</p>
        </fieldset>

        <div>
          <label htmlFor="physical-limitations" className={labelClass}>Limitations fonctionnelles (hors blessures)</label>
          <textarea id="physical-limitations" rows={4} value={limitations} className={inputClass}
            aria-describedby="physical-limitations-help" onChange={event => {
              setLimitationsDraft(event.target.value)
              setField('physical_limitations', event.target.value.split('\n').map(line => line.trim()).filter(Boolean))
            }} />
          <p id="physical-limitations-help" className="text-xs text-slate-400 mt-1">
            Une limitation par ligne (10 maximum, 300 caractères chacune), par exemple une amplitude limitée sans douleur.
            Déclare les douleurs, blessures et restrictions associées dans l&apos;onglet Blessures, sans les dupliquer ici.
          </p>
        </div>
      </fieldset>
      <button type="submit" disabled={saving || !changed}
        className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed">
        {saving ? 'Sauvegarde...' : 'Sauvegarder les préférences'}
      </button>
    </form>
  )
}
