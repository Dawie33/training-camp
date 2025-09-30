'use client'

import { ModeToggle } from '@/components/layout/theme-toggle'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Search } from 'lucide-react'
import Link from 'next/link'

export default function SiteHeader() {
    // TODO: Remplacer par la vraie logique d'authentification
    const isAuthenticated = false
    const user = {
        name: 'Dawie Syly',
        email: 'dawie@example.com',
        avatar: null // ou une URL d'image
    }

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
    }

    return (
        <header className="sticky top-0 z-50 border-b bg-black backdrop-blur">
            <div className="mx-auto flex h-14 items-center justify-between px-4">
                <Link href="/" className="font-bold text-lg text-white">Training Camp</Link>
                <nav className="hidden md:flex items-center gap-8 text-sm text-white/80">
                    <Link href="/" className="hover:text-white hover:scale-110 transition-all">Accueil</Link>
                    <Link href="/sports" className="hover:text-white hover:scale-110 transition-all">Les Sports</Link>
                    <Link href="/workouts" className="hover:text-white hover:scale-110 transition-all">Entrainements</Link>
                    <Link href="/calendar" className="hover:text-white hover:scale-110 transition-all">Plans</Link>
                    <Link href="/settings" className="hover:text-white hover:scale-110 transition-all">Mes Entrainements</Link>
                </nav>
                <div className="flex items-center gap-2">

                    <Button variant="ghost" size="icon" className="text-white hover:text-gray-400 hover:scale-120 transition-all hover:bg-transparent cursor-pointer">
                        <Search className="h-5 w-5" />
                    </Button>
                    {isAuthenticated ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={user.avatar || undefined} alt={user.name} />
                                        <AvatarFallback>{getInitials(user.name)}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.name}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link href="/profile">Profil</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/settings">Paramètres</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem>Se déconnecter</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild size="sm"><Link href="/signin">Sign in</Link></Button>
                    )}
                    <ModeToggle />
                </div>
            </div>
        </header>
    )
}

