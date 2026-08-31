'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Séances', href: '/crossfit' },
  { label: 'Enregistrer un WOD', href: '/crossfit/log-workout' },
  { label: 'Générer un WOD', href: '/crossfit/generate' },
  { label: 'Catalogue WOD', href: '/crossfit/workouts' },
  { label: 'Programme', href: '/crossfit/program' },
  { label: 'Progressions', href: '/crossfit/skills' },
]

export default function CrossFitLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <div className="eyebrow mb-3">CrossFit · WODs et progressions</div>
        <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-none tracking-tight">CrossFit</h1>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => {
          const isActive = tab.href === '/crossfit' ? pathname === '/crossfit' : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                isActive
                  ? 'text-primary border-primary bg-primary/10'
                  : 'border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground'
              }`}
            >
              {tab.label}
            </Link>
          )
        })}
      </div>

      {children}
    </div>
  )
}
