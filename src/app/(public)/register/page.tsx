'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Página de registro temporariamente desabilitada.
 * Redireciona automaticamente para a landing page.
 */
export default function RegisterPage() {
  const router = useRouter()

  useEffect(() => {
    // Registro desabilitado - redireciona para home
    router.replace('/')
  }, [router])

  return null
}
