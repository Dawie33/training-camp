import {
  CROSSFIT_LIFTS,
  type OneRepMax,
  type OneRepMaxHistoryEntry,
  type OneRepMaxInput,
  oneRepMaxesService,
} from '@/services'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { toLocalDateString } from '@/lib/date-only'

export function useOneRepMaxes() {
  const [oneRepMaxes, setOneRepMaxes] = useState<OneRepMax[]>([])
  const [history, setHistory] = useState<Record<string, OneRepMaxHistoryEntry[]>>({})
  const [liftValues, setLiftValues] = useState<Record<string, OneRepMaxInput>>({})
  const [savingLift, setSavingLift] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([oneRepMaxesService.getMyOneRepMaxes(), oneRepMaxesService.getHistory()])
      .then(([data, entries]) => {
        setOneRepMaxes(data)
        setHistory(entries)
        const initial: Record<string, OneRepMaxInput> = {}
        for (const lift of CROSSFIT_LIFTS) {
          const existing = data.find(r => r.lift === lift.value)
          initial[lift.value] = {
            value: existing ? String(existing.value) : '',
            source: existing?.source ?? 'real',
            measured_at: '',
          }
        }
        setLiftValues(initial)
      })
      .catch(() => toast.error('Impossible de charger les 1RM et leur historique'))
  }, [])

  const refreshAfterMutation = async (lift: string) => {
    try {
      const [data, entries] = await Promise.all([
        oneRepMaxesService.getMyOneRepMaxes(),
        oneRepMaxesService.getHistory(),
      ])
      setOneRepMaxes(data)
      setHistory(entries)
      const current = data.find(row => row.lift === lift)
      setLiftValues(prev => ({
        ...prev,
        [lift]: { value: current ? String(current.value) : '', source: current?.source ?? 'real', measured_at: '' },
      }))
    } catch {
      toast.error('Modification enregistrée, mais actualisation impossible. Rechargez la page.')
    }
  }

  const handleSaveLift = async (liftValue: string) => {
    const entry = liftValues[liftValue]
    if (!entry?.value) {
      toast.error('Veuillez entrer une valeur')
      return
    }
    const value = Number(entry.value)
    if (!(value > 0 && value <= 500)) {
      toast.error('Le 1RM doit être compris entre 0,5 et 500 kg')
      return
    }
    if (entry.measured_at > toLocalDateString()) {
      toast.error('La date du relevé ne peut pas être future')
      return
    }
    try {
      setSavingLift(liftValue)
      await oneRepMaxesService.upsertOneRepMax(liftValue, {
        value,
        source: entry.source,
        ...(entry.measured_at ? { measured_at: entry.measured_at } : {}),
      })
      toast.success('1RM sauvegardé')
      await refreshAfterMutation(liftValue)
    } catch {
      toast.error('Erreur lors de la sauvegarde du 1RM')
    } finally {
      setSavingLift(null)
    }
  }

  const handleDeleteHistory = async (lift: string, id: string) => {
    if (!window.confirm('Supprimer ce relevé ? Le 1RM courant sera recalculé.')) return
    try {
      setDeletingId(id)
      await oneRepMaxesService.deleteHistory(id)
      toast.success('Relevé supprimé')
      await refreshAfterMutation(lift)
    } catch {
      toast.error('Erreur lors de la suppression du relevé')
    } finally {
      setDeletingId(null)
    }
  }

  const setLiftEntry = (liftValue: string, patch: Partial<OneRepMaxInput>) => {
    setLiftValues(prev => ({
      ...prev,
      [liftValue]: { ...(prev[liftValue] ?? { value: '', source: 'real', measured_at: '' }), ...patch },
    }))
  }

  return { oneRepMaxes, history, liftValues, savingLift, deletingId, setLiftEntry, handleSaveLift, handleDeleteHistory }
}
