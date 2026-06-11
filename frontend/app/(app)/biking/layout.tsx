'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
    { label: 'Séances', href: '/biking' },
    { label: 'Enregistrer', href: '/biking/log' },
    { label: 'Générer', href: '/biking/generate' },
    { label: 'Bibliothèque', href: '/biking/library' },
]

export default function BikingLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <div className="min-h-screen bg-slate-900 text-white">
            <div className="px-6 pt-8 pb-8">

                <div className="mb-7">
                    <h1 className="text-2xl font-bold text-blue-400">Vélo</h1>
                    <div className="w-7 h-0.5 bg-blue-500 mt-1.5 mb-2" />
                    <p className="text-slate-400 text-sm">Suivi de tes séances et génération de plans IA (home trainer & route)</p>
                </div>

                <div className="flex border-b border-slate-800 mb-6">
                    {TABS.map(tab => {
                        const isActive = tab.href === '/biking' ? pathname === '/biking' : pathname.startsWith(tab.href)
                        return (
                            <Link key={tab.href} href={tab.href}
                                className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors ${isActive ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-white'
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
