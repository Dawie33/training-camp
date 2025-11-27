'use client'

import { motion } from 'framer-motion'
import { FileText, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  const actions = [
    {
      label: 'Créer un workout',
      description: 'Créer manuellement',
      icon: Plus,
      href: '/workouts/new',
      color: 'bg-primary',
      iconColor: 'text-primary-foreground',
    },
    {
      label: 'Générer avec IA',
      description: 'Workout automatique',
      icon: FileText,
      href: '/workouts/generate-ai',
      color: 'bg-green-500',
      iconColor: 'text-white',
    },
    {
      label: 'Voir mes stats',
      description: 'Suivre ma progression',
      icon: TrendingUp,
      href: '/tracking',
      color: 'bg-blue-500',
      iconColor: 'text-white',
    },
  ]

  return (
    <div className="bg-card rounded-lg border p-4 sm:p-6 h-full">
      <h3 className="text-xs sm:text-sm font-semibold text-muted-foreground mb-4 sm:mb-6">
        ACTIONS RAPIDES
      </h3>
      <div className="grid grid-cols-1 gap-3 sm:gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon
          return (
            <motion.div
              key={action.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={action.href}
                className="block p-4 sm:p-6 rounded-lg border bg-card hover:bg-accent transition-all duration-200 hover:shadow-md"
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className={`p-2 sm:p-3 rounded-lg ${action.color}`}>
                    <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${action.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-base sm:text-lg mb-0.5 sm:mb-1 truncate">{action.label}</h4>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {action.description}
                    </p>
                  </div>
                </div>
              </Link>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
