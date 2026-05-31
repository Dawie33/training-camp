'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Séances', href: '/crossfit' },
  { label: 'Enregistrer un WOD', href: '/crossfit/log-workout' },
  { label: 'Générer IA', href: '/crossfit/generate' },
  { label: 'Bibliothèque', href: '/crossfit/workouts' },
  { label: 'Progressions', href: '/crossfit/skills' },
]

export default function CrossFitLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="px-6 pt-8 pb-8">

        <div className="mb-7">
          <h1 className="text-2xl font-bold text-orange-400">CrossFit</h1>
          <div className="w-7 h-0.5 bg-orange-500 mt-1.5 mb-2" />
          <p className="text-slate-400 text-sm">WODs, progressions techniques et suivi</p>
        </div>

        <div className="flex border-b border-slate-800 mb-6">
          {TABS.map(tab => {
            const isActive = tab.href === '/crossfit' ? pathname === '/crossfit' : pathname.startsWith(tab.href)
            return (
              <Link key={tab.href} href={tab.href}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  isActive ? 'border-orange-500 text-orange-400' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </Link>
            )
          })}
        </div>

        {children}
      </div>
    </div>
  )
}
