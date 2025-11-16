'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useAuth } from '@/hooks/useAuth'
import { motion } from 'framer-motion'
import {
  Activity,
  Dumbbell,
  Home,
  Package,
  Settings,
  Target,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

interface AppSidebarProps {
  isOpen?: boolean
  onClose?: () => void
}

export function AppSidebar({ isOpen = false, onClose }: AppSidebarProps) {
  const { user, logout } = useAuth()
  const pathname = usePathname()

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const mainNavItems: NavItem[] = [
    { href: '/dashboard', label: 'Tableau de bord', icon: <Home className="w-5 h-5" /> },
    { href: '/tracking', label: 'Suivi', icon: <TrendingUp className="w-5 h-5" /> },
    { href: '/benchmarks', label: 'Benchmarks', icon: <Target className="w-5 h-5" /> },
    { href: '/workouts', label: 'Workouts', icon: <Dumbbell className="w-5 h-5" /> },
    { href: '/personalized-workout', label: 'Mes Workouts', icon: <Dumbbell className="w-5 h-5" /> },
    { href: '/equipments', label: 'Equipment', icon: <Package className="w-5 h-5" /> },
    { href: '/exercises', label: 'Exercises', icon: <Activity className="w-5 h-5" /> },
  ]

  return (
    <aside
      className={`fixed left-0 top-0 z-40 h-screen w-64 border-r bg-background transition-transform duration-300 lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <Dumbbell className="h-6 w-6 text-primary" />
            </motion.div>
            <span className="font-bold text-lg tracking-tight">
              Training-camp
            </span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-4">
          {/* Main Navigation */}
          <div className="space-y-1">
            {mainNavItems.map((item) => (
              <Link key={item.href} href={item.href} onClick={onClose}>
                <motion.div
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${pathname === item.href
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                    }`}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </motion.div>
              </Link>
            ))}
          </div>

        </nav>

        {/* User Profile */}
        <div className="border-t p-4">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start h-auto p-2">
                  <div className="flex items-center gap-3 w-full">
                    <Avatar className="h-9 w-9">
                      <AvatarImage src={undefined} alt={`${user.firstName} ${user.lastName}`} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                        {getInitials(`${user.firstName} ${user.lastName}`)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col items-start text-left flex-1 min-w-0">
                      <p className="text-sm font-medium truncate w-full">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate w-full">
                        {user.email}
                      </p>
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" side="top">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link className="cursor-pointer" href="/profile">
                    <span>Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link className="cursor-pointer flex items-center gap-2" href="/settings">
                    <Settings className="w-4 h-4" />
                    <span>Paramètres</span>
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
            <Button asChild className="w-full">
              <Link href="/login">Sign in</Link>
            </Button>
          )}
        </div>
      </div>
    </aside>
  )
}
