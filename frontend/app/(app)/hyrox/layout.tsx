'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { label: 'Séances', href: '/hyrox' },
  { label: 'Enregistrer', href: '/hyrox/log' },
  { label: 'Générer', href: '/hyrox/generate' },
  { label: 'Bibliothèque', href: '/hyrox/library' },
]

export default function HyroxLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="px-6 pt-8 pb-8">

        <div className="mb-7">
          <h1 className="text-2xl font-bold text-yellow-400">HYROX</h1>
          <div className="w-7 h-0.5 bg-yellow-500 mt-1.5 mb-2" />
          <p className="text-slate-400 text-sm">8× (1km run + 1 station) — Préparation et suivi des temps</p>
        </div>

        <div className="flex border-b border-slate-800 mb-6">
          {TABS.map(tab => {
            const isActive = tab.href === '/hyrox' ? pathname === '/hyrox' : pathname.startsWith(tab.href)
            return (
              <Link key={tab.href} href={tab.href}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${
                  isActive ? 'border-yellow-500 text-yellow-400' : 'border-transparent text-slate-400 hover:text-white'
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
