'use client'

import { Home } from 'lucide-react'

interface LocationToggleProps {
  location: 'box' | 'maison'
  onLocationChange: (location: 'box' | 'maison') => void
}

export function LocationToggle({ location, onLocationChange }: LocationToggleProps) {
  return (
    <div>
      <label className="text-xs text-muted-foreground mb-2 block">Lieu</label>
      <div className="flex gap-2">
        <button
          onClick={() => onLocationChange('box')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-md border transition-colors ${
            location === 'box'
              ? 'bg-blue-600/10 border-blue-600/30 text-blue-700'
              : 'bg-card border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          🏋️ Box
        </button>
        <button
          onClick={() => onLocationChange('maison')}
          className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-sm font-semibold rounded-md border transition-colors ${
            location === 'maison'
              ? 'bg-primary/10 border-primary/30 text-primary'
              : 'bg-card border-border text-muted-foreground hover:text-foreground'
          }`}
        >
          <Home className="w-4 h-4" /> Maison
        </button>
      </div>
    </div>
  )
}
