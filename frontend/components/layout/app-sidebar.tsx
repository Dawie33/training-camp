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
import { motion } from 'framer-motion'
import {
  Activity,
  Calendar,
  Clock,
  Dumbbell,
  Home,
  Package,
  Settings,
  Target,
  TrendingUp,
} from 'lucide-react'
import Link from 'next/link'
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
  const [activeTab, setActiveTab] = useState('/dashboard')

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  const mainNavItems: NavItem[] = [
    { href: '/dashboard', label: 'Tableau de bord', icon: <Home className="w-5 h-5" /> },
    { href: '/timer', label: 'Timer', icon: <Clock className="w-5 h-5" /> },
    { href: '/calendar', label: 'Calendrier', icon: <Calendar className="w-5 h-5" /> },
    { href: '/tracking', label: 'Suivi', icon: <TrendingUp className="w-5 h-5" /> },
    { href: '/benchmarks', label: 'Benchmarks', icon: <Target className="w-5 h-5" /> },
    { href: '/workouts', label: 'Workouts', icon: <Dumbbell className="w-5 h-5" /> },
    { href: '/personalized-workout', label: 'Mes Workouts', icon: <Dumbbell className="w-5 h-5" /> },
    { href: '/equipments', label: 'Equipements', icon: <Package className="w-5 h-5" /> },
    { href: '/exercises', label: 'Exercices', icon: <Activity className="w-5 h-5" /> },
  ]

  return (
    <aside className="w-72 min-h-screen p-6 flex flex-col">
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-10">
          <Link href="/dashboard" className="flex items-center gap-2 group">
            <motion.div
              whileHover={{ rotate: 180 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center shadow-lg shadow-orange-500/30">
                <Dumbbell className="h-6 w-6 text-primary" />
              </div>

            </motion.div>
            <span className="text-xl font-bold tracking-tight text-white">Training-camp</span>
          </Link>
        </div>

        {/* Navigation */}
        {isOpen && (
          <nav className="flex-1 space-y-1">
            {mainNavItems.map((item) => (
              <Link
                href={item.href}
                key={item.href}
                onClick={() => setActiveTab(item.href)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group
                  ${activeTab === item.href
                    ? 'bg-white/10 backdrop-blur-xl border border-white/20 shadow-lg'
                    : 'hover:bg-white/5'}`}
              >
                <span className={`text-lg transition-all duration-300 ${activeTab === item.href ? 'text-orange-400' : 'text-slate-400 group-hover:text-orange-300'}`}>
                  {item.icon}
                </span>
                <span className={`font-medium ${activeTab === item.href ? 'text-white' : 'text-slate-300'}`}>
                  {item.label}
                </span>
                {activeTab === item.href && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-orange-400 shadow-lg shadow-orange-400/50" />
                )}
              </Link>
            ))}
          </nav>
        )}


        {/* User Profile */}
        <div className="mt-auto pt-6 border-t border-white/10">
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full flex items-center gap-3 px-2 hover:bg-white/5">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-rose-500 flex items-center justify-center text-sm font-bold">
                    {getInitials(`${user.firstName} ${user.lastName}`)}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="font-medium text-sm truncate text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-slate-400 truncate">
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
