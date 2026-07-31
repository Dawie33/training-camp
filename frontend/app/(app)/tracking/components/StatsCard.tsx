'use client'

import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatsCardProps {
  title: string
  value: string | number
  icon: LucideIcon
  color?: 'orange' | 'green' | 'blue' | 'purple' | 'neutral'
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

const COLOR_STYLES: Record<NonNullable<StatsCardProps['color']>, string> = {
  orange: 'text-orange-600',
  green: 'text-emerald-600',
  blue: 'text-blue-600',
  purple: 'text-purple-600',
  neutral: 'text-muted-foreground',
}

export function StatsCard({ title, value, icon: Icon, color = 'neutral', subtitle, trend }: StatsCardProps) {
  return (
    <div className="rounded-lg bg-card border border-border p-6 transition-colors hover:border-foreground/25">
      <div className="flex items-center justify-between mb-4">
        <span className="eyebrow">{title}</span>
        <Icon className={cn('w-4 h-4', COLOR_STYLES[color])} />
      </div>
      <p className="font-display text-4xl font-semibold leading-none">{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-2">{subtitle}</p>}
      {trend && (
        <p className={cn('text-xs mt-2 font-semibold', trend.isPositive ? 'text-primary' : 'text-muted-foreground')}>
          {trend.isPositive ? '+' : ''}{trend.value}%
        </p>
      )}
    </div>
  )
}
