'use client'

import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

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
    gradient: 'from-blue-500/20 to-cyan-500/20',
    iconBg: 'bg-blue-500/20',
    icon: 'text-blue-400'
  },
  green: {
    gradient: 'from-emerald-500/20 to-teal-500/20',
    iconBg: 'bg-emerald-500/20',
    icon: 'text-emerald-400'
  },
  orange: {
    gradient: 'from-orange-500/20 to-amber-500/20',
    iconBg: 'bg-orange-500/20',
    icon: 'text-orange-400'
  },
  purple: {
    gradient: 'from-violet-500/20 to-purple-500/20',
    iconBg: 'bg-violet-500/20',
    icon: 'text-violet-400'
  },
  red: {
    gradient: 'from-red-500/20 to-rose-500/20',
    iconBg: 'bg-red-500/20',
    icon: 'text-red-400'
  }
}

export function StatsCard({ title, value, icon: Icon, color, subtitle, trend }: StatsCardProps) {
  const colors = colorClasses[color]

  return (
    <div className={cn(
      'relative overflow-hidden rounded-2xl bg-gradient-to-br backdrop-blur-xl border border-white/10 p-6 group hover:border-white/20 transition-all duration-300',
      colors.gradient
    )}>
      <div className="flex items-start justify-between mb-4">
        <p className="text-sm text-slate-400">{title}</p>
        <div className={cn(
          'w-10 h-10 rounded-xl flex items-center justify-center',
          colors.iconBg
        )}>
          <Icon className={cn('w-5 h-5', colors.icon)} />
        </div>
      </div>
      <p className="text-3xl font-bold">
        {value}
      </p>
      {subtitle && (
        <p className="text-xs text-slate-500 mt-2">{subtitle}</p>
      )}
      {trend && (
        <p className={cn(
          'text-xs mt-2',
          trend.isPositive ? 'text-green-400' : 'text-red-400'
        )}>
          {trend.isPositive ? '+' : ''}{trend.value}%
        </p>
      )}
    </div>
  )
}
