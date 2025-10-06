'use client'

import { Clock } from 'lucide-react'

interface WorkoutCardProps {
  title: string
  duration: string
  image: string
  category?: string
  isNew?: boolean
}

export function WorkoutCard({ title, duration, image, category, isNew }: WorkoutCardProps) {
  return (
    <div className="group relative overflow-hidden rounded-lg cursor-pointer transition-transform hover:scale-[1.02]">
      {/* Image de fond */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {/* <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform group-hover:scale-105"
        /> */}
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      </div>

      {/* Contenu */}
      <div className="absolute inset-0 flex flex-col justify-between p-4">
        {/* Badge catégorie */}
        {(category || isNew) && (
          <div className="flex gap-2">
            {isNew && (
              <span className="text-xs font-semibold px-2 py-1 bg-white text-black rounded">
                NEW
              </span>
            )}
            {category && (
              <span className="text-xs font-semibold px-2 py-1 bg-white/10 backdrop-blur-sm text-white rounded">
                {category}
              </span>
            )}
          </div>
        )}

        {/* Titre et durée */}
        <div className="space-y-2">
          <h3 className="font-bold text-lg text-white">{title}</h3>
          <div className="flex items-center gap-2 text-white/80 text-sm">
            <Clock className="w-4 h-4" />
            <span>{duration}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
