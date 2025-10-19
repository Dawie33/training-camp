'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/hooks/useAuth'
import { Menu } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

export default function SiteHeader() {
    const { isAuthenticated, user, logout } = useAuth()
    const [open, setOpen] = useState(false)

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
                <div className="flex items-center gap-4">
                    {/* Menu Hamburger pour mobile */}
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <Menu className="h-5 w-5" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                            <nav className="flex flex-col gap-4 mt-8 ml-4">
                                <Link
                                    href="/dashboard"
                                    className="text-lg font-medium hover:text-foreground transition-colors"
                                    onClick={() => setOpen(false)}
                                >
                                    HOME
                                </Link>
                                <Link
                                    href="/explore"
                                    className="text-lg font-medium hover:text-foreground transition-colors"
                                    onClick={() => setOpen(false)}
                                >
                                    EXPLORE
                                </Link>
                                <Link
                                    href="/plans"
                                    className="text-lg font-medium hover:text-foreground transition-colors"
                                    onClick={() => setOpen(false)}
                                >
                                    PLANS
                                </Link>
                                <Link
                                    href="/learn"
                                    className="text-lg font-medium hover:text-foreground transition-colors"
                                    onClick={() => setOpen(false)}
                                >
                                    LEARN
                                </Link>
                                <Link
                                    href="/shop"
                                    className="text-lg font-medium hover:text-foreground transition-colors"
                                    onClick={() => setOpen(false)}
                                >
                                    SHOP
                                </Link>
                                <Link
                                    href="/workouts"
                                    className="text-lg font-medium hover:text-foreground transition-colors"
                                    onClick={() => setOpen(false)}
                                >
                                    MY WORKOUTS
                                </Link>
                                {user && user.role === 'admin' && (
                                    <Link
                                        href="/admin"
                                        className="text-lg font-medium hover:text-foreground transition-colors text-orange-500"
                                        onClick={() => setOpen(false)}
                                    >
                                        ADMIN
                                    </Link>
                                )}
                            </nav>
                        </SheetContent>
                    </Sheet>

                    <Link href="/" className="font-bold text-xl tracking-tight">
                        TRAINING CAMP
                    </Link>
                </div>

                {/* Navigation desktop */}
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

