'use client'

import { useEffect, useState } from 'react'
import { X, Share, PlusSquare } from 'lucide-react'

const STORAGE_KEY = 'ios-install-banner-dismissed'

export function IOSInstallBanner() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent)
    const isStandalone = ('standalone' in window.navigator) && (window.navigator as Navigator & { standalone: boolean }).standalone
    const isDismissed = localStorage.getItem(STORAGE_KEY) === '1'

    if (isIOS && !isStandalone && !isDismissed) {
      setVisible(true)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 bg-slate-800 border-t border-slate-700 shadow-lg">
      <button
        onClick={dismiss}
        className="absolute top-3 right-3 text-slate-400 hover:text-white"
        aria-label="Fermer"
      >
        <X size={18} />
      </button>

      <p className="text-white font-semibold text-sm mb-2">Installer Training Camp</p>
      <p className="text-slate-300 text-xs leading-relaxed">
        Appuie sur{' '}
        <Share size={13} className="inline-block mx-0.5 text-blue-400" />{' '}
        <strong className="text-white">Partager</strong>, puis sur{' '}
        <PlusSquare size={13} className="inline-block mx-0.5 text-blue-400" />{' '}
        <strong className="text-white">Sur l&apos;écran d&apos;accueil</strong>{' '}
        pour accéder à l&apos;appli comme une vraie app.
      </p>
    </div>
  )
}
