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

function extractSubdomain(hostname: string): string | null {
  const cleanHost = hostname.split(':')[0].toLowerCase()
  
  // Se é localhost, não tem subdomínio
  if (cleanHost === 'localhost' || cleanHost === '127.0.0.1') {
    return null
  }
  
  // Se termina com o domínio principal
  if (cleanHost.endsWith(`.${MAIN_DOMAIN}`)) {
    const subdomain = cleanHost.replace(`.${MAIN_DOMAIN}`, '')
    
    // Ignora www e api
    if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
      return subdomain
    }
  }
  
  // Retorna o host completo para buscar domínio customizado
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

      const hostname = window.location.hostname
      const subdomain = extractSubdomain(hostname)

      if (!subdomain) {
        // Sem subdomínio - é a landing page ou localhost
        setIsLoading(false)
        return
      }

      setIsSubdomain(true)

      try {
        // Tenta buscar pelo host completo (cobre tanto slug quanto domínio customizado)
        const response = await api.get(`/tenants/by-host/${hostname}`)
        
        if (response.data) {
          setTenant(response.data)
          
          // Salva o tenant_id para requisições autenticadas
          localStorage.setItem('tenant_id', response.data.id)
          
          // Aplica a cor primária se existir
          if (response.data.primary_color) {
            document.documentElement.style.setProperty('--primary', response.data.primary_color)
          }
        }
      } catch (err: any) {
        console.error('Erro ao carregar tenant:', err)
        setError(err.response?.data?.message || 'Escola não encontrada')
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
