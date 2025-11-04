'use client'

import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import { motion } from 'framer-motion'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red'
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

const colorClasses = {
  blue: {
    bg: 'bg-blue-500/10',
    icon: 'text-blue-500',
    border: 'border-blue-500/20'
  },
  green: {
    bg: 'bg-green-500/10',
    icon: 'text-green-500',
    border: 'border-green-500/20'
  },
  orange: {
    bg: 'bg-orange-500/10',
    icon: 'text-orange-500',
    border: 'border-orange-500/20'
  },
  purple: {
    bg: 'bg-purple-500/10',
    icon: 'text-purple-500',
    border: 'border-purple-500/20'
  },
  red: {
    bg: 'bg-red-500/10',
    icon: 'text-red-500',
    border: 'border-red-500/20'
  }
}

export function StatsCard({ title, value, icon: Icon, color, subtitle, trend }: StatsCardProps) {
  const colors = colorClasses[color]

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card className={cn(
        'p-6 border-2 transition-all duration-200',
        colors.border
      )}>
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold">{value}</p>
              {trend && (
                <span className={cn(
                  'text-sm font-medium',
                  trend.isPositive ? 'text-green-500' : 'text-red-500'
                )}>
                  {trend.isPositive ? '+' : ''}{trend.value}%
                </span>
              )}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className={cn(
            'p-3 rounded-xl',
            colors.bg
          )}>
            <Icon className={cn('w-6 h-6', colors.icon)} />
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
