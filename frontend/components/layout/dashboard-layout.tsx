'use client'

import { usePathname } from 'next/navigation'
import { AppSidebar } from './app-sidebar'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname()

  // Pages qui ne doivent pas afficher la sidebar
  const noSidebarRoutes = ['/login', '/signup', '/onboarding', '/']

  const shouldShowSidebar = !noSidebarRoutes.includes(pathname)

  if (!shouldShowSidebar) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto ml-64">
        {children}
      </main>
    </div>
  )
}
