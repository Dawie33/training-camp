'use client'

import { usePathname } from 'next/navigation'
import SiteHeader from './site-header'

export default function ConditionalHeader() {
  const pathname = usePathname()

  // Pages sans header
  const authPages = ['/login', '/signup']
  const hideHeader = authPages.includes(pathname)

  if (hideHeader) {
    return null
  }

  return <SiteHeader />
}
