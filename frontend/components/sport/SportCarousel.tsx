'use client'

import { SportCard } from '@/components/sport/SportCard'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Sport } from '@/lib/types/sport'

interface SportCarouselProps {
  sports: Sport[]
  selectedSportId?: string | null
  onSportSelect?: (sport: Sport) => void
  title?: string
  description?: string
  variant?: 'default' | 'large'
}

/**
 * Composant carousel pour afficher les sports avec navigation
 * Utilise shadcn/ui Carousel pour une meilleure UX
 *
 * @param sports - Liste des sports à afficher
 * @param selectedSportId - ID du sport actuellement sélectionné
 * @param onSportSelect - Fonction callback appelée lors de la sélection d'un sport
 * @param title - Titre optionnel de la section
 * @param description - Description optionnelle de la section
 * @param variant - Variante d'affichage ('default' ou 'large')
 */
export function SportCarousel({
  sports,
  selectedSportId,
  onSportSelect,
  title,
  description,
  variant = 'default'
}: SportCarouselProps) {
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

      <Carousel
        opts={{
          align: 'center',
          loop: true,
        }}
        className="w-full px-4"
      >
        <CarouselContent className="mx-0">
          {sports.map((sport) => (
            <CarouselItem key={sport.id} className="px-2 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
              <SportCard
                sport={sport}
                isSelected={selectedSportId === sport.id}
                onClick={() => onSportSelect?.(sport)}
                variant={variant}
              />
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex -left-12" />
        <CarouselNext className="hidden md:flex -right-12" />
      </Carousel>
    </div>
  )
}
