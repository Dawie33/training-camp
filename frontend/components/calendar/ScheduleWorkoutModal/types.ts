import { Activity, Dumbbell, LucideIcon } from 'lucide-react'

export type SportTab = 'crossfit' | 'strength'

export interface SportTabConfig {
  id: SportTab
  label: string
  icon: LucideIcon
  activeColor: string
}

export const SPORT_TABS: SportTabConfig[] = [
  { id: 'crossfit', label: 'CrossFit', icon: Activity, activeColor: 'bg-primary/10 text-primary border-primary/30' },
  { id: 'strength', label: 'Force', icon: Dumbbell, activeColor: 'bg-red-600/10 text-red-700 border-red-600/30' },
]
