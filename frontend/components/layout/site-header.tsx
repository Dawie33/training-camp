'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import { Dumbbell, Menu } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

export default function SiteHeader() {
    const { isAuthenticated, user, logout } = useAuth()
    const [open, setOpen] = useState(false)
    const pathname = usePathname()

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
    }

    const navItems = [
        { href: '/dashboard', label: 'Home' },
        { href: '/explore', label: 'Explore' },
        { href: '/plans', label: 'Plans' },
        { href: '/personalized-workout', label: 'My Workouts' },
    ]

    return (
        <motion.header
            className="sticky top-0 z-50 border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80"
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ duration: 0.3 }}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
                {/* Logo et Menu Mobile */}
                <div className="flex items-center gap-4">
                    {/* Menu Hamburger pour mobile */}
                    <Sheet open={open} onOpenChange={setOpen}>
                        <SheetTrigger asChild>
                            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button variant="ghost" size="icon" className="md:hidden">
                                    <Menu className="h-5 w-5" />
                                    <span className="sr-only">Toggle menu</span>
                                </Button>
                            </motion.div>
                        </SheetTrigger>
                        <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                            <nav className="flex flex-col gap-4 mt-8">
                                {navItems.map((item) => (
                                    <motion.div
                                        key={item.href}
                                        whileHover={{ x: 4 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        <Link
                                            href={item.href}
                                            className={`text-lg font-medium transition-colors ${
                                                pathname === item.href
                                                    ? 'text-primary'
                                                    : 'text-muted-foreground hover:text-foreground'
                                            }`}
                                            onClick={() => setOpen(false)}
                                        >
                                            {item.label}
                                        </Link>
                                    </motion.div>
                                ))}
                                {user && user.role === 'admin' && (
                                    <motion.div whileHover={{ x: 4 }} transition={{ duration: 0.2 }}>
                                        <Link
                                            href="/admin"
                                            className="text-lg font-medium text-orange-500 hover:text-orange-400 transition-colors"
                                            onClick={() => setOpen(false)}
                                        >
                                            Admin
                                        </Link>
                                    </motion.div>
                                )}
                            </nav>
                        </SheetContent>
                    </Sheet>

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2 group">
                        <motion.div
                            whileHover={{ rotate: 180 }}
                            transition={{ duration: 0.3 }}
                        >
                            <Dumbbell className="h-6 w-6 text-primary" />
                        </motion.div>
                        <span className="font-bold text-xl tracking-tight group-hover:text-primary transition-colors">
                            TRAINING CAMP
                        </span>
                    </Link>
                </div>

                {/* Navigation desktop */}
                <nav className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => (
                        <Link key={item.href} href={item.href} className="relative px-4 py-2 group">
                            <span
                                className={`text-sm font-medium transition-colors ${
                                    pathname === item.href
                                        ? 'text-foreground'
                                        : 'text-muted-foreground group-hover:text-foreground'
                                }`}
                            >
                                {item.label}
                            </span>
                            {pathname === item.href && (
                                <motion.div
                                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                                    layoutId="activeTab"
                                    transition={{ duration: 0.3 }}
                                />
                            )}
                        </Link>
                    ))}
                    {user && user.role === 'admin' && (
                        <Link href="/admin" className="px-4 py-2 group">
                            <span className="text-sm font-medium text-orange-500 group-hover:text-orange-400 transition-colors">
                                Admin
                            </span>
                        </Link>
                    )}
                </nav>

                {/* User Menu */}
                <div className="flex items-center gap-4">
                    {isAuthenticated && user ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                    <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                                        <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-primary/20 transition-all hover:ring-primary/40">
                                            <AvatarImage src={undefined} alt={`${user.firstName} ${user.lastName}`} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                                {getInitials(`${user.firstName} ${user.lastName}`)}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </motion.div>
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
                                <DropdownMenuItem className="cursor-pointer text-red-600 focus:text-red-600" onClick={logout}>
                                    Se déconnecter
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button asChild size="sm" className="font-medium">
                                <Link href="/login">Sign in</Link>
                            </Button>
                        </motion.div>
                    )}
                </div>
            </div>
        </motion.header>
    )
}

