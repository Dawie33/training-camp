'use client'

import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  emoji: string
  color: 'blue' | 'green' | 'orange' | 'purple' | 'red'
  subtitle?: string
  trend?: {
    value: number
    isPositive: boolean
  }
}

export function StatsCard({ title, value, emoji, subtitle, trend }: StatsCardProps) {
  return (
    <div className="rounded-lg bg-card border border-border p-6 transition-colors hover:border-foreground/25">
      <div className="flex items-center justify-between mb-4">
        <span className="eyebrow">{title}</span>
        <span className="text-base opacity-60 grayscale">{emoji}</span>
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
