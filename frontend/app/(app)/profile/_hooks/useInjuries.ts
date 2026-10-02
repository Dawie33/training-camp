'use client'

import type { User } from '@/domain/entities/auth'
import type { Injury } from '@/domain/entities/injury'
import { usersService } from '@/services'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

/** Index de la blessure en cours de modification, 'new' pour un ajout, null si aucun formulaire ouvert. */
export type InjuryEditing = number | 'new' | null

/**
 * Blessures du profil. Chaque ajout, modification ou suppression est enregistré immédiatement :
 * la liste complète est renvoyée à PATCH /users/me.
 */
export function useInjuries(fullUser: User | null) {
  const [injuries, setInjuries] = useState<Injury[]>([])
  const [editing, setEditing] = useState<InjuryEditing>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (fullUser) setInjuries(fullUser.injuries ?? [])
  }, [fullUser])

  const persist = async (next: Injury[], successMessage: string): Promise<boolean> => {
    try {
      setSaving(true)
      const updated = await usersService.updateMe({ injuries: next })
      setInjuries(updated.injuries ?? next)
      toast.success(successMessage)
      return true
    } catch {
      toast.error("Erreur lors de l'enregistrement des blessures")
      return false
    } finally {
      setSaving(false)
    }
  }

  const saveInjury = async (injury: Injury) => {
    if (editing === null) return
    const next = editing === 'new' ? [...injuries, injury] : injuries.map((item, i) => (i === editing ? injury : item))
    // En cas d'erreur, le formulaire reste ouvert pour ne pas perdre la saisie
    if (await persist(next, editing === 'new' ? 'Blessure ajoutée' : 'Blessure mise à jour')) {
      setEditing(null)
    }
  }

  const deleteInjury = async (index: number) => {
    await persist(
      injuries.filter((_, i) => i !== index),
      'Blessure supprimée'
    )
  }

  return {
    injuries,
    editing,
    saving,
    startAdd: () => setEditing('new'),
    startEdit: (index: number) => setEditing(index),
    cancelEdit: () => setEditing(null),
    saveInjury,
    deleteInjury,
  }
}
