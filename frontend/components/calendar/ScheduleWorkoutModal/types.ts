import { Activity, Bike, Dumbbell, Footprints, LucideIcon } from 'lucide-react'

export type SportTab = 'crossfit' | 'running' | 'biking' | 'strength'

export interface SportTabConfig {
  id: SportTab
  label: string
  icon: LucideIcon
  activeColor: string
}

export const SPORT_TABS: SportTabConfig[] = [
  { id: 'crossfit', label: 'CrossFit', icon: Activity, activeColor: 'bg-primary/10 text-primary border-primary/30' },
  { id: 'running', label: 'Running', icon: Footprints, activeColor: 'bg-green-600/10 text-green-700 border-green-600/30' },
  { id: 'biking', label: 'Vélo', icon: Bike, activeColor: 'bg-blue-600/10 text-blue-700 border-blue-600/30' },
  { id: 'strength', label: 'Force', icon: Dumbbell, activeColor: 'bg-red-600/10 text-red-700 border-red-600/30' },
]
