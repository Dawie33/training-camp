'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import SiteFooter from './site-footer'

/**
 * ConditionalFooter est un composant qui permet de rendre le
 * composant SiteFooter uniquement si la page courante n'est pas
 * dans la liste des pages sans footer.
 *
 * @returns {React.ReactElement | null} Le composant SiteFooter
 *          si la page courante n'est pas dans la liste des pages sans
 *          footer, null sinon.
 */
export default function ConditionalFooter() {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Pages sans footer (même que les pages sans header)
  const authPages = ['/', '/login', '/signup', '/onboarding']
  const hideFooter = authPages.includes(pathname)

  // Ne pas rendre pendant le SSR ou avant le montage
  if (!mounted || hideFooter) {
    return null
  }

  return <SiteFooter />
}
