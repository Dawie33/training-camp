'use client'

import { Card } from '@/components/ui/card'
import { Sport } from '@/lib/types/sport'
import { cn } from '@/lib/utils'
import { getSportImage } from '@/lib/utils/sport-images'

interface SportCardProps {
  sport: Sport
  isSelected?: boolean
  onClick?: () => void
  variant?: 'default' | 'large'
}

/**
 * Composant réutilisable pour afficher un sport sous forme de card
 *
 * @param sport - L'objet sport à afficher
 * @param isSelected - Indique si la card est sélectionnée
 * @param onClick - Fonction callback appelée lors du clic sur la card
 * @param variant - Variante d'affichage ('default' ou 'large')
 */
export function SportCard({ sport, isSelected = false, onClick, variant = 'default' }: SportCardProps) {
  const isLarge = variant === 'large'

  return (
    <div className="p-1">
      <Card
        onClick={onClick}
        className={cn(
          'group relative overflow-hidden rounded-2xl border transition-all duration-300 cursor-pointer',
          'hover:scale-[1.02] hover:shadow-lg',
          isSelected ? 'border-primary shadow-primary/40 ring-2 ring-primary' : 'border-border',
          isLarge ? 'aspect-[16/9]' : 'aspect-[4/3]'
        )}
      >
        {/* Image de fond */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
          style={{
            backgroundImage: `url(${getSportImage(sport.slug)})`,
          }}
        />

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/20 group-hover:from-black/90 group-hover:via-black/50 transition-colors" />

        {/* Icône et nom du sport */}
        <div className="relative z-10 h-full flex flex-col justify-between p-5">
          {/* Badge sélectionné */}
          {isSelected && (
            <div className="absolute top-3 right-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-primary-foreground"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </div>
          )}

          {/* Contenu principal */}
          <div className="flex-1 flex items-center justify-center">
            {sport.icon && (
              <span className={cn(
                'transition-transform duration-300 group-hover:scale-110',
                isLarge ? 'text-8xl' : 'text-6xl'
              )}>
                {sport.icon}
              </span>
            )}
          </div>

          {/* Nom et description */}
          <div className="space-y-1 text-center">
            <h3 className={cn(
              'font-bold text-white transition-colors uppercase',
              isLarge ? 'text-2xl' : 'text-2xl'
            )}>
              {sport.slug}
            </h3>
          </div>
        </div>
      </Card>
    </div>
  )
}
