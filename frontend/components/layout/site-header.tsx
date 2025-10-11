'use client'

import { SportSwitcher } from '@/components/layout/SportSwitcher'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { Search } from 'lucide-react'
import Link from 'next/link'

export default function SiteHeader() {
    const { isAuthenticated, user, logout } = useAuth()
    console.log(user)
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
    }

    return (
        <header className="sticky top-0 z-50 border-b border-border/40 bg-[#1a1a1a]/95 backdrop-blur supports-[backdrop-filter]:bg-[#1a1a1a]/80">
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                <div className="flex items-center gap-8">
                    <Link href="/" className="font-bold text-xl tracking-tight">
                        TRAINING CAMP
                    </Link>
                    {isAuthenticated && <SportSwitcher />}
                </div>
                <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
                    <Link href="/dashboard" className="hover:text-foreground transition-colors">HOME</Link>
                    <Link href="/explore" className="hover:text-foreground transition-colors">EXPLORE</Link>
                    <Link href="/plans" className="hover:text-foreground transition-colors">PLANS</Link>
                    <Link href="/learn" className="hover:text-foreground transition-colors">LEARN</Link>
                    <Link href="/shop" className="hover:text-foreground transition-colors">SHOP</Link>
                    <Link href="/workouts" className="hover:text-foreground transition-colors">MY WORKOUTS</Link>
                    {user && user.role === 'admin' ? (
                        <Link href="/admin" className="hover:text-foreground transition-colors text-orange-500">ADMIN</Link>
                    ) : null}
                </nav>
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="hover:bg-accent">
                        <Search className="h-5 w-5" />
                    </Button>
                    {isAuthenticated && user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                    <Avatar className="h-9 w-9 cursor-pointer">
                                        <AvatarImage src={undefined} alt={`${user.firstName} ${user.lastName}`} />
                                        <AvatarFallback>{getInitials(`${user.firstName} ${user.lastName}`)}</AvatarFallback>
                                    </Avatar>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="end" forceMount>
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium leading-none">{user.firstName} {user.lastName}</p>
                                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem asChild>
                                    <Link className="cursor-pointer" href="/profile">Profil</Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link className="cursor-pointer" href="/settings">Paramètres</Link>
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem className="cursor-pointer" onClick={logout}>Se déconnecter</DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button asChild size="sm"><Link href="/login">Sign in</Link></Button>
                    )}
                </div>
            </div>
        </header>
    )
}

