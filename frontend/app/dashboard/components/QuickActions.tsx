'use client'

import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { FileText, Plus, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export function QuickActions() {
  const actions = [
    {
      label: 'Créer un workout',
      icon: <Plus className="w-4 h-4" />,
      href: '/admin/workouts/generate-ai',
      variant: 'default' as const,
    },
    {
      label: 'Voir mes stats',
      icon: <TrendingUp className="w-4 h-4" />,
      href: '/tracking',
      variant: 'outline' as const,
    },
    {
      label: 'Historique',
      icon: <FileText className="w-4 h-4" />,
      href: '/tracking',
      variant: 'outline' as const,
    },
  ]

  return (
    <div className="bg-card rounded-lg border p-6">
      <h3 className="text-sm font-semibold text-muted-foreground mb-4">
        ACTIONS RAPIDES
      </h3>
      <div className="space-y-3">
        {actions.map((action, index) => (
          <motion.div
            key={action.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              asChild
              variant={action.variant}
              className="w-full justify-start gap-3"
            >
              <Link href={action.href}>
                <span className="p-1 rounded-md bg-background">
                  {action.icon}
                </span>
                {action.label}
              </Link>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
