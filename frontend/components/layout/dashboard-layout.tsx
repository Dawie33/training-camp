'use client'

import { usePathname } from 'next/navigation'
import { AppTopbar } from './app-topbar'
import { BottomNavigation } from './bottom-navigation'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  // Pages qui ne doivent pas afficher la navigation
  const noNavRoutes = ['/login', '/signup', '/']

  // Pages en fullscreen (pas de bottom nav ni topbar)
  const fullscreenRoutes = ['/workout/', '/personalized-workout/']

  const shouldShowNav = !noNavRoutes.includes(pathname)
  const isFullscreen = fullscreenRoutes.some(route => pathname.includes(route))

  if (!shouldShowNav) {
    return <>{children}</>
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Barre supérieure — masquée sur mobile, où la barre du bas prend le relais */}
      {!isFullscreen && (
        <div className="hidden lg:block shrink-0">
          <AppTopbar />
        </div>
      )}

      <main className={`flex-1 overflow-y-auto w-full ${!isFullscreen ? 'pb-20 lg:pb-0' : ''}`}>
        {children}
      </main>

      {/* Navigation mobile — masquée sur desktop et en fullscreen */}
      {!isFullscreen && <BottomNavigation />}
    </div>
  )
}
