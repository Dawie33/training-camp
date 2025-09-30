'use client'

import { ModeToggle } from '@/components/layout/theme-toggle'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default function SiteHeader() {
    return (
        <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                <div>

                </div>
                <div className="flex items-center gap-4">
                    <Link href="/" className="font-semibold">Training Camp</Link>
                    <nav className="hidden md:flex items-center gap-4 text-sm text-muted-foreground">
                        <Link href="/">Acceuil</Link>
                        <Link href="/sports">Les Sports</Link>
                        <Link href="/workouts">Entrainements</Link>
                        <Link href="/calendar">Plan</Link>
                        <Link href="/settings">Mes Entrainements</Link>
                    </nav>
                </div>
                <div className="flex items-center gap-2">
                    <ModeToggle />
                    <Button asChild size="sm"><Link href="/signin">Sign in</Link></Button>
                </div>
            </div>
        </header>
    )
}
