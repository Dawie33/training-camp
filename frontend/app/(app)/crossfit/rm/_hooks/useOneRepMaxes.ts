import { CROSSFIT_LIFTS, type OneRepMax, oneRepMaxesService } from '@/services'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function useOneRepMaxes() {
  const [oneRepMaxes, setOneRepMaxes] = useState<OneRepMax[]>([])
  const [liftValues, setLiftValues] = useState<Record<string, { value: string; source: 'real' | 'estimated' }>>({})
  const [savingLift, setSavingLift] = useState<string | null>(null)

  useEffect(() => {
    oneRepMaxesService.getMyOneRepMaxes().then((data) => {
      setOneRepMaxes(data)
      const initial: Record<string, { value: string; source: 'real' | 'estimated' }> = {}
      for (const lift of CROSSFIT_LIFTS) {
        const existing = data.find((r) => r.lift === lift.value)
        initial[lift.value] = { value: existing ? String(existing.value) : '', source: existing?.source ?? 'real' }
      }
      setLiftValues(initial)
    }).catch(() => {
      const initial: Record<string, { value: string; source: 'real' | 'estimated' }> = {}
      for (const lift of CROSSFIT_LIFTS) {
        initial[lift.value] = { value: '', source: 'real' }
      }
      setLiftValues(initial)
    })
  }, [])

  const handleSaveLift = async (liftValue: string) => {
    const entry = liftValues[liftValue]
    if (!entry?.value) { toast.error('Veuillez entrer une valeur'); return }
    try {
      setSavingLift(liftValue)
      const result = await oneRepMaxesService.upsertOneRepMax(liftValue, {
        value: Number(entry.value),
        source: entry.source,
      })
      setOneRepMaxes((prev) => [...prev.filter((r) => r.lift !== liftValue), result])
      toast.success('1RM sauvegardé')
    } catch {
      toast.error('Erreur lors de la sauvegarde du 1RM')
    } finally {
      setSavingLift(null)
    }
  }

  const setLiftEntry = (liftValue: string, patch: Partial<{ value: string; source: 'real' | 'estimated' }>) => {
    setLiftValues((prev) => ({ ...prev, [liftValue]: { ...prev[liftValue], ...patch } }))
  }

  return {
    oneRepMaxes,
    liftValues,
    savingLift,
    setLiftEntry,
    handleSaveLift,
  }
}
