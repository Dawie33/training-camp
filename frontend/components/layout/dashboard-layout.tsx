'use client'

import { Menu } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Button } from '../ui/button'
import { AppSidebar } from './app-sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  // Pages qui ne doivent pas afficher la sidebar
  const noSidebarRoutes = ['/login', '/signup', '/onboarding', '/']

  const shouldShowSidebar = !noSidebarRoutes.includes(pathname)

  if (!shouldShowSidebar) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Overlay pour mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 overflow-y-auto lg:ml-64 w-full">
        {/* Bouton burger pour mobile */}
        <div className="lg:hidden fixed top-4 left-4 z-50">
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsSidebarOpen(true)}
            className="bg-background shadow-md"
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
        {children}
      </main>
    </div>
  )
}
