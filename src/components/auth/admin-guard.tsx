'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/features/auth/stores/auth.store'

interface AdminGuardProps {
  children: React.ReactNode
  allowedRoles?: ('super_admin' | 'owner' | 'admin' | 'instructor')[]
}

export function AdminGuard({ 
  children, 
  allowedRoles = ['super_admin', 'owner', 'admin', 'instructor'] 
}: AdminGuardProps) {
  const router = useRouter()
  const { user, isLoading } = useAuthStore()

  useEffect(() => {
    if (!isLoading && user) {
      const hasPermission = allowedRoles.includes(user.role as any)
      if (!hasPermission) {
        router.push('/dashboard')
      }
    }
  }, [user, isLoading, router, allowedRoles])

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const hasPermission = allowedRoles.includes(user.role as any)
  if (!hasPermission) {
    return null
  }

  return <>{children}</>
}
