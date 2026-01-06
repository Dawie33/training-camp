'use client'

import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
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

  return (
    <div className="rounded-2xl bg-gradient-to-r from-orange-500/10 to-rose-500/10 backdrop-blur-xl border border-orange-500/20 p-6">
      <motion.div
        key={currentTip}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.3 }}
        className="flex items-start gap-4"
      >
        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-rose-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-orange-500/30">
          <span className="text-xl">💡</span>
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-orange-300 mb-1">{tip.title}</h4>
          <p className="text-slate-300">
            {tip.description}
          </p>
          {tip.link && (
            <Link
              href={tip.link}
              className="inline-flex items-center gap-1 text-sm text-orange-400 hover:text-orange-300 mt-2 transition-colors"
            >
              En savoir plus
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
        <div className="ml-auto flex gap-1">
          {tips.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentTip(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentTip ? 'bg-orange-400' : 'bg-white/20'
              }`}
              aria-label={`Voir le tip ${index + 1}`}
            />
          ))}
        </div>
      </motion.div>
    </div>
  )
}
