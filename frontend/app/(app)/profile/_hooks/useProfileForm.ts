'use client'

import type { User } from '@/domain/entities/auth'
import { usersService } from '@/services'
import { useAuth } from '@/hooks/useAuth'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

export function useProfileForm() {
  const { user: authUser } = useAuth()
  const [fullUser, setFullUser] = useState<User | null>(null)

  // Profile tab
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [sportLevel, setSportLevel] = useState('')
  const [height, setHeight] = useState('')
  const [weight, setWeight] = useState('')
  const [bodyFat, setBodyFat] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  // Equipment tab
  const [equipment, setEquipment] = useState<string[]>([])
  const [savingEquipment, setSavingEquipment] = useState(false)

  useEffect(() => {
    usersService.getUserProfile().then((user) => {
      setFullUser(user)
      setFirstName(user.firstName ?? '')
      setLastName(user.lastName ?? '')
      setSportLevel(user.sport_level ?? '')
      setHeight(user.height != null ? String(user.height) : '')
      setWeight(user.weight != null ? String(user.weight) : '')
      setBodyFat(user.body_fat_percentage != null ? String(user.body_fat_percentage) : '')
      setEquipment(user.equipment_available ?? [])
    }).catch(() => {
      if (authUser) {
        setFirstName(authUser.firstName ?? '')
        setLastName(authUser.lastName ?? '')
      }
    })
  }, [authUser])

  const handleSaveProfile = async () => {
    try {
      setSavingProfile(true)
      await usersService.updateMe({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        sport_level: (sportLevel as 'beginner' | 'intermediate' | 'advanced' | 'elite') || undefined,
        height: height ? Number(height) : undefined,
        weight: weight ? Number(weight) : undefined,
        body_fat_percentage: bodyFat ? Number(bodyFat) : undefined,
      })
      toast.success('Profil mis à jour')
    } catch {
      toast.error('Erreur lors de la mise à jour du profil')
    } finally {
      setSavingProfile(false)
    }
  }

  const handleSaveEquipment = async () => {
    try {
      setSavingEquipment(true)
      await usersService.updateMe({ equipment_available: equipment })
      toast.success('Équipement mis à jour')
    } catch {
      toast.error("Erreur lors de la mise à jour de l'équipement")
    } finally {
      setSavingEquipment(false)
    }
  }

  const toggleEquipment = (item: string) => {
    setEquipment((prev) => prev.includes(item) ? prev.filter((e) => e !== item) : [...prev, item])
  }

  return {
    fullUser,
    authUser,
    // Profile tab
    firstName, setFirstName,
    lastName, setLastName,
    sportLevel, setSportLevel,
    height, setHeight,
    weight, setWeight,
    bodyFat, setBodyFat,
    savingProfile,
    handleSaveProfile,
    // Equipment tab
    equipment,
    savingEquipment,
    toggleEquipment,
    setEquipment,
    handleSaveEquipment,
  }
}
