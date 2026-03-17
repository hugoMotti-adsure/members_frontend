'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { trackingService } from '../services/tracking.service'

export function TrackingProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  useEffect(() => {
    // Inicializar tracking service
    trackingService.init()

    return () => {
      // Cleanup
      trackingService.destroy()
    }
  }, [])

  useEffect(() => {
    // Track page view sempre que a rota mudar
    if (pathname) {
      trackingService.trackPageView(pathname)
    }
  }, [pathname])

  return <>{children}</>
}
