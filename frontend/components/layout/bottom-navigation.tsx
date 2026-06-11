'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Activity, Bike, Calendar, Dumbbell, Footprints, Home, PenLine, TrendingUp, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

interface NavItem {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
}

const mainItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/calendar', label: 'Calendrier', icon: Calendar },
  { href: '/tracking', label: 'Suivi', icon: TrendingUp },
]

const sportItems: NavItem[] = [
  { href: '/crossfit/log-workout', label: 'Log workout', icon: PenLine },
  { href: '/crossfit', label: 'CrossFit', icon: Activity },
  { href: '/running', label: 'Running', icon: Footprints },
  { href: '/biking', label: 'Vélo', icon: Bike },
  { href: '/strength', label: 'Force', icon: Dumbbell },
]

export function BottomNavigation() {
  const pathname = usePathname()
  const [showSportMenu, setShowSportMenu] = useState(false)

  const isSportActive = sportItems.some(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  )

  return (
    <>
      {/* Menu Sports */}
      <AnimatePresence>
        {showSportMenu && (
          <motion.div
            className="fixed inset-0 z-[60] bg-background lg:hidden"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-xl font-black">Sports</h2>
                <motion.button
                  onClick={() => setShowSportMenu(false)}
                  className="p-2 hover:bg-accent rounded-full transition-colors"
                  whileTap={{ scale: 0.9 }}
                >
                  <X className="w-6 h-6" />
                </motion.button>
              </div>

              <div className="flex-1 p-4 space-y-2">
                {sportItems.map((item, index) => {
                  const Icon = item.icon
                  const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowSportMenu(false)}
                    >
                      <motion.div
                        className={`flex items-center gap-4 p-4 rounded-xl transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'hover:bg-accent'
                          }`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className={`p-3 rounded-xl ${isActive ? 'bg-primary/20' : 'bg-accent'}`}>
                          <Icon className="w-6 h-6" />
                        </div>
                        <span className="text-lg font-semibold">{item.label}</span>
                      </motion.div>
                    </Link>
                  )
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Barre de navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border lg:hidden">
        <div className="pb-safe">
          <div className="flex items-center justify-around h-16 px-2">
            {mainItems.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
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
                    <Icon className={`w-6 h-6 relative z-10 ${isActive ? 'scale-110' : 'group-hover:scale-105'} transition-transform`} />
                  </motion.div>
                  <span className={`text-xs mt-1 font-medium transition-colors ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}

            {/* Bouton Sport */}
            <button
              onClick={() => setShowSportMenu(true)}
              className="relative flex flex-col items-center justify-center flex-1 h-full group"
            >
              {isSportActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <motion.div
                className={`relative ${isSportActive ? 'text-primary' : 'text-muted-foreground'}`}
                whileTap={{ scale: 0.9 }}
              >
                {isSportActive && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute inset-0 -m-2 bg-primary/10 rounded-full"
                  />
                )}
                <Activity className={`w-6 h-6 relative z-10 ${isSportActive ? 'scale-110' : 'group-hover:scale-105'} transition-transform`} />
              </motion.div>
              <span className={`text-xs mt-1 font-medium transition-colors ${isSportActive ? 'text-primary' : 'text-muted-foreground'}`}>
                Sport
              </span>
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}