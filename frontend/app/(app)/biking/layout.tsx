'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
    { label: 'Historique', href: '/biking' },
    { label: 'Enregistrer', href: '/biking/log' },
    { label: 'Générer', href: '/biking/generate' },
]

export default function BikingLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()

    return (
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-8">
            <div>
                <div className="eyebrow mb-3">Vélo · séances et plans IA</div>
                <h1 className="font-display text-5xl sm:text-6xl font-semibold leading-none tracking-tight">Vélo</h1>
                <p className="text-muted-foreground text-sm mt-3">Suivi de tes séances et génération de plans IA (home trainer &amp; route)</p>
            </div>

            <div className="flex flex-wrap gap-2">
                {TABS.map(tab => {
                    const isActive = tab.href === '/biking' ? pathname === '/biking' : pathname.startsWith(tab.href)
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
