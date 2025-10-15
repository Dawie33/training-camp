'use client'

import { SportCard } from '@/components/sport/SportCard'
import { Sport } from '@/lib/types/sport'
import { cn } from '@/lib/utils'

interface SportGridProps {
  sports: Sport[]
  selectedSportId?: string | null
  onSportSelect?: (sport: Sport) => void
  title?: string
  description?: string
  showCategories?: boolean
  variant?: 'default' | 'large'
  layout?: 'grid' | 'horizontal'
  columns?: {
    sm?: number
    md?: number
    lg?: number
    xl?: number
  }
}

/**
 * Composant réutilisable pour afficher une grille de sports
 *
 * @param sports - Liste des sports à afficher
 * @param selectedSportId - ID du sport actuellement sélectionné
 * @param onSportSelect - Fonction callback appelée lors de la sélection d'un sport
 * @param title - Titre optionnel de la section
 * @param description - Description optionnelle de la section
 * @param showCategories - Afficher les sports groupés par catégorie
 * @param variant - Variante d'affichage ('default' ou 'large')
 * @param layout - Mode d'affichage ('grid' ou 'horizontal')
 * @param columns - Configuration du nombre de colonnes responsive
 */
export function SportGrid({
  sports,
  selectedSportId,
  onSportSelect,
  title,
  description,
  showCategories = false,
  variant = 'default',
  layout = 'grid',
  columns = { sm: 2, md: 3, lg: 4, xl: 5 }
}: SportGridProps) {

  const gridClasses = cn(
    'grid gap-6',
    `grid-cols-1`,
    columns.sm && `sm:grid-cols-${columns.sm}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`,
    columns.xl && `xl:grid-cols-${columns.xl}`
  )

  const horizontalClasses = cn(
    'flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide',
    'scroll-smooth'
  )

  // Mode horizontal scroll pour le dashboard
  if (layout === 'horizontal') {
    return (
      <div className="space-y-6">
        {title && (
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            {description && (
              <p className="text-muted-foreground text-lg">{description}</p>
            )}
          </div>
        )}

        <div className={horizontalClasses}>
          {sports.map((sport) => (
            <div key={sport.id} className="flex-shrink-0 w-64 snap-start">
              <SportCard
                sport={sport}
                isSelected={selectedSportId === sport.id}
                onClick={() => onSportSelect?.(sport)}
                variant={variant}
              />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (showCategories) {
    // Grouper les sports par catégorie
    const sportsByCategory = sports.reduce((acc, sport) => {
      const category = sport.category || 'other'
      if (!acc[category]) {
        acc[category] = []
      }
      acc[category].push(sport)
      return acc
    }, {} as Record<string, Sport[]>)

    const categoryLabels: Record<string, string> = {
      endurance: 'Endurance',
      strength: 'Force',
      mixed: 'Mixte',
      team: 'Sports d\'équipe',
      individual: 'Sports individuels',
      water: 'Sports aquatiques',
      combat: 'Sports de combat',
      other: 'Autres'
    }

    return (
      <div className="space-y-12">
        {title && (
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
            {description && (
              <p className="text-muted-foreground text-lg">{description}</p>
            )}
          </div>
        )}

        {Object.entries(sportsByCategory).map(([category, categorySports]) => (
          <div key={category} className="space-y-6">
            <h3 className="text-2xl font-semibold">{categoryLabels[category] || category}</h3>
            <div className={gridClasses}>
              {categorySports.map((sport) => (
                <SportCard
                  key={sport.id}
                  sport={sport}
                  isSelected={selectedSportId === sport.id}
                  onClick={() => onSportSelect?.(sport)}
                  variant={variant}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {title && (
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
          {description && (
            <p className="text-muted-foreground text-lg">{description}</p>
          )}
        </div>
      )}

      <div className={gridClasses}>
        {sports.map((sport) => (
          <SportCard
            key={sport.id}
            sport={sport}
            isSelected={selectedSportId === sport.id}
            onClick={() => onSportSelect?.(sport)}
            variant={variant}
          />
        ))}
      </div>
    </div>
  )
}
