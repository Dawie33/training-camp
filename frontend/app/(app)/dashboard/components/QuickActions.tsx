'use client'

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export function QuickActions({ index }: { index?: string } = {}) {
  const actions = [
    { label: 'Générer avec IA', href: '/crossfit/generate', primary: true },
    { label: 'Créer un workout', href: '/workouts/new' },
    { label: 'Voir mes stats', href: '/tracking' },
  ]

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
        <span className="eyebrow">
          {index && <span className="text-primary mr-2">{index}</span>}
          Actions rapides
        </span>
        <div className="flex flex-wrap gap-2.5">
          {actions.map((action) => (
            <Link
              key={action.label}
              href={action.href}
              className={`group inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-display text-sm font-semibold transition-colors ${
                action.primary
                  ? 'bg-primary text-primary-foreground hover:opacity-90'
                  : 'border border-border text-foreground hover:border-primary hover:text-primary'
              }`}
            >
              {action.label}
              <ArrowUpRight className="w-4 h-4 group-hover:-translate-y-0.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          ))}
        </div>
      </div>
      <div className="rule-strong" />
    </div>
  )
}
