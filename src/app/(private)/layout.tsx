'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { TenantTheme } from '@/components/theme/tenant-theme'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { TrackingProvider } from '@/features/analytics/components/tracking-provider'

export default function PrivateLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, isLoading, checkAuth } = useAuthStore()

  // Verifica se está na página de assistir curso
  const isWatchingCourse = pathname.startsWith('/course/')

  useEffect(() => {
    checkAuth()
  }, [checkAuth])

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Se está assistindo curso: sidebar + header + conteúdo (sem padding, 100vh)
  if (isWatchingCourse) {
    return (
      <TrackingProvider>
        <TenantTheme />
        <div className="h-screen flex overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden">
            <Header />
            <main className="flex-1 overflow-hidden">{children}</main>
          </div>
        </div>
      </TrackingProvider>
    )
  }

  return (
    <TrackingProvider>
      <TenantTheme />
      <div className="min-h-screen flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header />
          <main className="flex-1 p-6 overflow-auto">{children}</main>
        </div>
      </div>
    </TrackingProvider>
  )
}
