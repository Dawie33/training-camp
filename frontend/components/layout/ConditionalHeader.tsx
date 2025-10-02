'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import SiteHeader from './site-header'

/**
 * ConditionalHeader est un composant qui permet de rendre le
 * composant SiteHeader uniquement si la page courante n'est pas
 * dans la liste des pages sans header.
 *
 * @returns {React.ReactElement | null} Le composant SiteHeader
 *          si la page courante n'est pas dans la liste des pages sans
 *          header, null sinon.
 */
export default function ConditionalHeader() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Pages sans header
  const authPages = ['/', '/login', '/signup', '/onboarding']
  const hideHeader = authPages.includes(pathname)

  // Ne pas rendre pendant le SSR ou avant le montage
  if (!mounted || hideHeader) {
    return null
  }

  return <SiteHeader />
}
