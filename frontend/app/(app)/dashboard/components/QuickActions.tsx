'use client'

import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'

export function QuickActions({ index }: { index?: string } = {}) {
  // Logger passe en action principale : c'est la saisie qui alimente tout le diagnostic
  const actions = [
    { label: 'Logger une séance', href: '/crossfit/log-workout', primary: true },
    { label: 'Mon diagnostic', href: '/tracking' },
    { label: 'Générer avec IA', href: '/crossfit/generate' },
    { label: 'Mes 1RM', href: '/crossfit/rm' },
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
