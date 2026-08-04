'use client'

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
import { AnimatePresence, motion } from 'framer-motion'
import {
  Activity,
  Bike,
  Calendar,
  ChevronDown,
  Dumbbell,
  Footprints,
  Home,
  Target,
  TrendingUp,
} from 'lucide-react'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ReactNode
  adminOnly?: boolean
}

interface isSidebarOpen {
  isOpen: boolean
}

export function AppSidebar({ isOpen }: isSidebarOpen) {
  const { user, logout } = useAuth()
  const pathname = usePathname()
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({})

  const toggleGroup = (label: string) => {
    setCollapsedGroups(prev => ({ ...prev, [label]: !prev[label] }))
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const navGroups: { label: string; items: NavItem[] }[] = [
    {
      label: 'Principal',
      items: [
        { href: '/dashboard', label: 'Tableau de bord', icon: <Home className="w-5 h-5" /> },
        { href: '/training-programs', label: 'Programme', icon: <Target className="w-5 h-5" /> },
        { href: '/calendar', label: 'Calendrier', icon: <Calendar className="w-5 h-5" /> },
        { href: '/tracking', label: 'Suivi', icon: <TrendingUp className="w-5 h-5" /> },
      ],
    },
    {
      label: 'Sports',
      items: [
        { href: '/crossfit', label: 'CrossFit', icon: <Activity className="w-5 h-5" /> },
        { href: '/running', label: 'Running', icon: <Footprints className="w-5 h-5" /> },
        { href: '/biking', label: 'Vélo', icon: <Bike className="w-5 h-5" /> },
        { href: '/force', label: 'Force', icon: <Dumbbell className="w-5 h-5" /> },
      ],
    },
  ]

  return (
    <aside className="w-56 h-screen p-4 flex flex-col">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Dumbbell className="h-6 w-6 text-primary-foreground" />
              </div>

            </motion.div>
            <span className="font-display text-xl font-semibold tracking-tight text-foreground">Training-camp</span>
          </Link>
        </div>

        {/* Navigation */}
        {isOpen && (
          <nav className="flex-1 space-y-4 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
            {navGroups.map((group, groupIndex) => {
              const isCollapsed = collapsedGroups[group.label] ?? false
              return (
                <div key={group.label}>
                  {groupIndex > 0 && <div className="rule mb-3" />}
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-4 mb-1 group/header"
                  >
                    <span className="eyebrow group-hover/header:text-foreground transition-colors">
                      {group.label}
                    </span>
                    <motion.span
                      animate={{ rotate: isCollapsed ? -90 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-3 h-3 text-muted-foreground group-hover/header:text-foreground transition-colors" />
                    </motion.span>
                  </button>
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        className="overflow-hidden"
                      >
                        <div className="space-y-1">
                          {group.items.map((item) => {
                            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                            return (
                              <Link
                                href={item.href}
                                key={item.href}
                                className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-300 group
                                  ${isActive
                                    ? 'bg-secondary border border-border'
                                    : 'hover:bg-secondary/60'}`}
                              >
                                <span className={`text-lg transition-all duration-300 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                                  {item.icon}
                                </span>
                                <span className={`font-medium ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                                  {item.label}
                                </span>
                                {isActive && (
                                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />
                                )}
                              </Link>
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </nav>
        )}


        {/* User Profile */}
        <div className="mt-auto pt-6 border-t border-border">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center gap-3 px-2 hover:bg-secondary">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {getInitials(`${user.firstName} ${user.lastName}`)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-sm truncate text-foreground">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
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