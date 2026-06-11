'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Séances', href: '/running' },
  { label: 'Enregistrer', href: '/running/log' },
  { label: 'Générer', href: '/running/generate' },
  { label: 'Bibliothèque', href: '/running/library' },
]

export default function RunningLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="px-6 pt-8 pb-8">

        <div className="mb-7">
          <h1 className="text-2xl font-bold text-cyan-400">Running</h1>
          <div className="w-7 h-0.5 bg-cyan-500 mt-1.5 mb-2" />
          <p className="text-slate-400 text-sm">Suivi de tes sorties et génération de séances IA</p>
        </div>

        <div className="flex border-b border-slate-800 mb-6">
          {TABS.map(tab => {
            const isActive = tab.href === '/running' ? pathname === '/running' : pathname.startsWith(tab.href)
            return (
              <Link key={tab.href} href={tab.href}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${isActive ? 'border-cyan-500 text-cyan-400' : 'border-transparent text-slate-400 hover:text-white'
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
