'use client'

import { AuthGuard } from '@/components/guards/AuthGuard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Dumbbell, LayoutDashboard, Package, Users, Zap } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

const sidebarItems = [
  {
    href: '/admin',
    icon: LayoutDashboard,
    label: 'Dashboard',
  },
  {
    href: '/admin/users',
    icon: Users,
    label: 'Users',
  },
  {
    href: '/admin/exercises',
    icon: Dumbbell,
    label: 'Exercises',
  },
  {
    href: '/admin/equipments',
    icon: Package,
    label: 'Equipments',
  },
  {
    href: '/admin/workouts',
    icon: Zap,
    label: 'Workouts',
  },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  // Force light mode for admin panel
  useEffect(() => {
    document.documentElement.classList.remove('dark')
    document.documentElement.classList.add('light')

    return () => {
      document.documentElement.classList.remove('light')
      document.documentElement.classList.add('dark')
    }
  }, [])

  return (
    <AuthGuard requireAdmin={true}>
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <aside className="w-64 border-r bg-card">
          <div className="p-6">
            <nav className="space-y-2">
              {sidebarItems.map((item) => {
                const Icon = item.icon
                const isActive = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href))

                return (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant={isActive ? 'secondary' : 'ghost'}
                      className={cn('w-full justify-start', isActive && 'bg-accent')}
                    >
                      <Icon className="mr-2 h-4 w-4" />
                      {item.label}
                    </Button>
                  </Link>
                )
              })}
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </AuthGuard>
  )
}
