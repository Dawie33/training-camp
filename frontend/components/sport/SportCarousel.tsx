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
import { useEffect, useState } from 'react'
import type { CarouselApi } from '@/components/ui/carousel'

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
  const [api, setApi] = useState<CarouselApi>()
  const [current, setCurrent] = useState(0)
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!api) {
      return
    }

    setCount(api.scrollSnapList().length)
    setCurrent(api.selectedScrollSnap() + 1)

    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1)
    })
  }, [api])

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
        setApi={setApi}
        opts={{
          align: 'start',
          loop: true,
        }}
        className="w-full px-4"
      >
        <CarouselContent className="-ml-2 md:-ml-4">
          {sports.map((sport) => (
            <CarouselItem key={sport.id} className="pl-2 md:pl-4 basis-[85%] sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
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

      {/* Dots indicateurs pour mobile */}
      <div className="flex justify-center gap-2 md:hidden pt-2">
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            className={`h-2 rounded-full transition-all ${
              index + 1 === current
                ? 'bg-primary w-8'
                : 'bg-muted-foreground/30 w-2'
            }`}
            onClick={() => api?.scrollTo(index)}
            aria-label={`Aller à la diapositive ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
