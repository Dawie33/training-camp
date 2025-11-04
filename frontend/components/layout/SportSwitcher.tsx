'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSport } from '@/contexts/SportContext'
import { useAllSports } from '@/hooks/useAllSports'
import { ChevronDown, Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'

/**
 * Compoosent SportSwitcher.
 *
 * Ce composant est utilisé pour afficher un menu de choix de sport pour l'utilisateur.
 *
 * Si aucun sport actif ou aucun sport utilisateur, le composant est renvoyé null.
 *
 * @returns {JSX.Element} une liste de choix de sport.
 */
export function SportSwitcher() {
  const { activeSport, setActiveSport } = useSport()
  const { sports: userSports } = useAllSports()
  const router = useRouter()

  if (!activeSport && userSports.length === 0) {
    return null
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="text-white hover:text-white hover:bg-white/10 gap-2 cursor-pointer"
        >
          {activeSport?.icon && <span className="text-xl">{activeSport.icon}</span>}
          <span className="font-semibold">{activeSport?.name || 'Sélectionner un sport'}</span>
          <ChevronDown className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        <DropdownMenuLabel>Mes sports</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {userSports.map((sport) => (
          <DropdownMenuItem
            key={sport.id}
            onClick={() => setActiveSport(sport)}
            className="cursor-pointer"
          >
            <span className="mr-2 text-lg">{sport.icon}</span>
            <span className="flex-1">{sport.name}</span>
            {activeSport?.id === sport.id && (
              <span className="text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => router.push('/sports')}
          className="cursor-pointer text-primary"
        >
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un sport
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
