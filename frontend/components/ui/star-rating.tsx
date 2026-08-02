'use client'

import { Star } from 'lucide-react'

interface StarRatingProps {
  rating: number
  onChange: (rating: number) => void
  allowDeselect?: boolean
}

export function StarRating({ rating, onChange, allowDeselect = true }: StarRatingProps) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button key={star} type="button" onClick={() => onChange(allowDeselect && star === rating ? 0 : star)}>
          <Star
            className={`w-6 h-6 transition-colors ${
              star <= rating ? 'text-primary fill-primary' : 'text-muted-foreground hover:text-primary/60'
            }`}
          />
        </button>
      ))}
    </div>
  )
}
