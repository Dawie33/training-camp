'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Séances', href: '/athx' },
  { label: 'Enregistrer', href: '/athx/log' },
  { label: 'Générer', href: '/athx/generate' },
  { label: 'Bibliothèque', href: '/athx/library' },
]

export default function AthxLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="px-6 pt-8 pb-8">

        <div className="mb-7">
          <h1 className="text-2xl font-bold text-purple-400">ATHX</h1>
          <div className="w-7 h-0.5 bg-purple-500 mt-1.5 mb-2" />
          <p className="text-slate-400 text-sm">Athletic Fitness — Préparation compétition hybride 2h30</p>
        </div>

        <div className="flex border-b border-slate-800 mb-6">
          {TABS.map(tab => {
            const isActive = tab.href === '/athx' ? pathname === '/athx' : pathname.startsWith(tab.href)
            return (
              <Link key={tab.href} href={tab.href}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  isActive ? 'border-purple-500 text-purple-400' : 'border-transparent text-slate-400 hover:text-white'
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
