'use client'

import { motion } from 'framer-motion'
import { Activity, Calendar, Home, TrendingUp } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const mainItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/calendar', label: 'Calendrier', icon: Calendar },
  { href: '/tracking', label: 'Suivi', icon: TrendingUp },
  { href: '/crossfit', label: 'CrossFit', icon: Activity },
]

export function BottomNavigation() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border lg:hidden"
    >
      <div className="pb-safe">
        <div className="flex items-center justify-around h-16 px-2">
          {mainItems.map(item => {
            const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className="relative flex flex-col items-center justify-center flex-1 h-full group"
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <motion.div
                  className={`relative ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                  whileTap={{ scale: 0.9 }}
                >
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 -m-2 bg-primary/10 rounded-full"
                    />
                  )}
                  <Icon
                    className={`w-6 h-6 relative z-10 ${isActive ? 'scale-110' : 'group-hover:scale-105'} transition-transform`}
                  />
                </motion.div>
                <span
                  className={`text-xs mt-1 font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}
                >
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </nav>
  )
}
