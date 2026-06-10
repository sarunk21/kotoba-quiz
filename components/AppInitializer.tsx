'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'

export default function AppInitializer() {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    let active = true

    async function initCapacitor() {
      try {
        const { Capacitor } = await import('@capacitor/core')
        if (!Capacitor.isNativePlatform()) return

        const { App } = await import('@capacitor/app')

        // Clean up listeners for App before registering new ones
        await App.removeAllListeners()

        await App.addListener('backButton', () => {
          if (!active) return

          if (pathname === '/') {
            if (window.history.state?.modal === 'practice') {
              window.history.back()
            } else {
              App.exitApp()
            }
          } else {
            router.back()
          }
        })
      } catch (e) {
        console.error('[Capacitor App Listener Error]', e)
      }
    }

    initCapacitor()

    return () => {
      active = false
    }
  }, [pathname, router])

  return null
}
