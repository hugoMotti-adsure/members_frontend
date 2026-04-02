'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { api } from './api'

interface Tenant {
  id: string
  name: string
  slug: string
  logo_url?: string
  logo_horizontal_url?: string
  logo_icon_url?: string
  primary_color?: string
}

interface TenantContextType {
  tenant: Tenant | null
  isLoading: boolean
  error: string | null
  isSubdomain: boolean
}

const TenantContext = createContext<TenantContextType>({
  tenant: null,
  isLoading: true,
  error: null,
  isSubdomain: false,
})

export function useTenant() {
  return useContext(TenantContext)
}

const MAIN_DOMAIN = process.env.NEXT_PUBLIC_MAIN_DOMAIN || 'trivapp.com.br'

function hexToHslValue(hex: string): string | null {
  const normalizedHex = hex.replace('#', '')

  if (!/^[0-9A-Fa-f]{6}$/.test(normalizedHex)) {
    return null
  }

  const r = parseInt(normalizedHex.substring(0, 2), 16) / 255
  const g = parseInt(normalizedHex.substring(2, 4), 16) / 255
  const b = parseInt(normalizedHex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  const lightness = (max + min) / 2

  let hue = 0
  let saturation = 0

  if (delta !== 0) {
    saturation =
      lightness > 0.5 ? delta / (2 - max - min) : delta / (max + min)

    switch (max) {
      case r:
        hue = ((g - b) / delta + (g < b ? 6 : 0)) / 6
        break
      case g:
        hue = ((b - r) / delta + 2) / 6
        break
      case b:
        hue = ((r - g) / delta + 4) / 6
        break
    }
  }

  return `${Math.round(hue * 360)} ${Math.round(saturation * 100)}% ${Math.round(lightness * 100)}%`
}

function applyTenantTheme(primaryColor?: string) {
  if (!primaryColor) {
    return
  }

  const hslValue = hexToHslValue(primaryColor)

  if (!hslValue) {
    return
  }

  document.documentElement.style.setProperty('--primary', hslValue)
  document.documentElement.style.setProperty('--accent', hslValue)
  document.documentElement.style.setProperty('--ring', hslValue)
  document.documentElement.style.setProperty('--primary-hex', primaryColor)
}

function extractSubdomain(hostname: string): string | null {
  const cleanHost = hostname.split(':')[0].toLowerCase()

  if (cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
    return null
  }

  if (cleanHost.endsWith(`.${MAIN_DOMAIN}`)) {
    const subdomain = cleanHost.replace(`.${MAIN_DOMAIN}`, '')

    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      return subdomain
    }
  }

  if (cleanHost !== MAIN_DOMAIN && cleanHost !== `www.${MAIN_DOMAIN}`) {
    return cleanHost
  }

  return null
}

export function TenantProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isSubdomain, setIsSubdomain] = useState(false)

  useEffect(() => {
    async function loadTenant() {
      if (typeof window === 'undefined') {
        setIsLoading(false)
        return
      }

      // Verifica ?tenant=slug na URL (usado no email de convite de nova escola)
      const urlParams = new URLSearchParams(window.location.search)
      const tenantParam = urlParams.get('tenant')

      if (tenantParam) {
        setIsSubdomain(true)
        try {
          const response = await api.get(`/tenants/slug/${tenantParam}`)
          if (response.data) {
            setTenant(response.data)
            localStorage.setItem('tenant_id', response.data.id)
            applyTenantTheme(response.data.primary_color)
          }
        } catch (err: any) {
          console.error('Erro ao carregar tenant por slug:', err)
          setError(err.response?.data?.message || 'Escola nao encontrada')
        } finally {
          setIsLoading(false)
        }
        return
      }

      const hostname = window.location.hostname
      const subdomain = extractSubdomain(hostname)

      if (!subdomain) {
        setIsLoading(false)
        return
      }

      setIsSubdomain(true)

      try {
        const response = await api.get(`/tenants/by-host/${hostname}`)

        if (response.data) {
          setTenant(response.data)
          localStorage.setItem('tenant_id', response.data.id)
          applyTenantTheme(response.data.primary_color)
        }
      } catch (err: any) {
        console.error('Erro ao carregar tenant:', err)
        setError(err.response?.data?.message || 'Escola nao encontrada')
      } finally {
        setIsLoading(false)
      }
    }

    loadTenant()
  }, [])

  return (
    <TenantContext.Provider value={{ tenant, isLoading, error, isSubdomain }}>
      {children}
    </TenantContext.Provider>
  )
}
