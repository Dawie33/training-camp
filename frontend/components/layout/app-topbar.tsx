'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import { Activity, Calendar, Dumbbell, Home, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Tableau de bord', icon: <Home className="w-4 h-4" /> },
  { href: '/calendar', label: 'Calendrier', icon: <Calendar className="w-4 h-4" /> },
  { href: '/tracking', label: 'Suivi', icon: <TrendingUp className="w-4 h-4" /> },
  { href: '/crossfit', label: 'CrossFit', icon: <Activity className="w-4 h-4" /> },
]

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part[0])
    .join('')
    .toUpperCase()
}

/**
 * Barre de navigation supérieure (desktop).
 *
 * Remplace la colonne latérale : les mêmes destinations et le même menu de compte,
 * sur une bande fine, pour rendre toute la largeur au contenu — le dashboard porte
 * des graphes qui gagnent à occuper l'espace.
 */
export function AppTopbar() {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  return (
    <header className="border-b border-border bg-card/60 backdrop-blur-sm">
      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center gap-6">
        <Link href="/dashboard" className="flex items-center gap-2 shrink-0 group">
          <motion.div whileHover={{ rotate: 180 }} transition={{ duration: 0.3 }}>
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Dumbbell className="h-4 w-4 text-primary-foreground" />
            </div>
          </motion.div>
          <span className="font-display text-lg font-semibold tracking-tight text-foreground hidden xl:inline">
            Training-camp
          </span>
        </Link>

        <nav className="flex items-center gap-1 flex-1 min-w-0" aria-label="Navigation principale">
          {NAV_ITEMS.map(item => {
            const isActive =
              pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-secondary text-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                }`}
              >
                <span className={isActive ? 'text-primary' : ''}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="shrink-0 h-9 px-1.5 hover:bg-secondary"
                aria-label={`Compte de ${user.firstName} ${user.lastName}`}
              >
                <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                  {getInitials(`${user.firstName} ${user.lastName}`)}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <p className="font-medium text-sm truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-xs text-muted-foreground truncate font-normal">{user.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link className="cursor-pointer" href="/profile">
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600"
                onClick={logout}
              >
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button asChild size="sm" className="shrink-0">
            <Link href="/login">Se connecter</Link>
          </Button>
        )}
      </div>
    </header>
  )
}
