'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Historique', href: '/running' },
  { label: 'Enregistrer', href: '/running/log' },
  { label: 'Générer', href: '/running/generate' },
]

export default function RunningLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
      <div>
        <div className="eyebrow mb-3">Running · sorties et plans IA</div>
        <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-none tracking-tight">Running</h1>
        <p className="text-muted-foreground text-sm mt-3">Suivi de tes sorties et génération de séances IA</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TABS.map(tab => {
          const isActive = tab.href === '/running' ? pathname === '/running' : pathname.startsWith(tab.href)
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${isActive
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
