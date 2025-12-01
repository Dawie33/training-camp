'use client'

import { motion } from 'framer-motion'
import { Book, ChevronRight, Lightbulb, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Tip } from './types'


const tips: Tip[] = [
  {
    id: '1',
    type: 'advice',
    title: 'Conseil du jour',
    description: 'Hydrate-toi bien avant, pendant et après ton workout pour optimiser tes performances.',
    icon: 'lightbulb',
    color: 'bg-yellow-500/10 text-yellow-700 border-yellow-500/20'
  },
  {
    id: '2',
    type: 'exercise',
    title: 'Exercice en vedette',
    description: 'Le Squat bulgare : excellent pour développer force et équilibre des jambes.',
    link: '/exercises/bulgarian-squat',
    icon: 'sparkles',
    color: 'bg-purple-500/10 text-purple-700 border-purple-500/20'
  },
  {
    id: '3',
    type: 'article',
    title: 'Article recommandé',
    description: 'Les 5 erreurs à éviter lors de ton échauffement pour prévenir les blessures.',
    link: '/blog/warmup-mistakes',
    icon: 'book',
    color: 'bg-blue-500/10 text-blue-700 border-blue-500/20'
  },
  {
    id: '4',
    type: 'advice',
    title: 'Astuce nutrition',
    description: 'Consomme des protéines dans les 30 min après ton workout pour optimiser la récupération.',
    icon: 'lightbulb',
    color: 'bg-green-500/10 text-green-700 border-green-500/20'
  }
]

export function QuickTips() {
  const [currentTip, setCurrentTip] = useState(0)

  // Rotation automatique des tips toutes les 8 secondes
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTip((prev) => (prev + 1) % tips.length)
    }, 8000)

    return () => clearInterval(interval)
  }, [])

  const tip = tips[currentTip]

  const getIcon = (iconType: string) => {
    switch (iconType) {
      case 'lightbulb':
        return <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
      case 'sparkles':
        return <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
      case 'book':
        return <Book className="w-5 h-5 sm:w-6 sm:h-6" />
      default:
        return <Lightbulb className="w-5 h-5 sm:w-6 sm:h-6" />
    }
  }

  const TipContent = () => (
    <motion.div
      key={currentTip}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.3 }}
      className={`border rounded-lg p-4 sm:p-5 ${tip.color}`}
    >
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="flex-shrink-0 mt-0.5">
          {getIcon(tip.icon)}
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-sm sm:text-base font-semibold mb-1">
            {tip.title}
          </h4>
          <p className="text-xs sm:text-sm opacity-90 leading-relaxed">
            {tip.description}
          </p>
          {tip.link && (
            <Link
              href={tip.link}
              className="inline-flex items-center gap-1 text-xs sm:text-sm font-medium mt-2 hover:underline"
            >
              En savoir plus
              <ChevronRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  )

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base sm:text-lg font-semibold">Tips & Conseils</h3>
        <div className="flex gap-1">
          {tips.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTip(index)}
              className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all ${index === currentTip
                  ? 'bg-primary w-4 sm:w-6'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              aria-label={`Voir le tip ${index + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Tip Content */}
      <TipContent />
    </div>
  )
}
