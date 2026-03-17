'use client'

import { useEffect } from 'react'
import { useAuthStore } from '@/features/auth/stores/auth.store'

// Converte hex para HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } | null {
  // Remove o #
  hex = hex.replace('#', '')
  
  // Valida formato
  if (!/^[0-9A-Fa-f]{6}$/.test(hex)) {
    return null
  }

  // Converte para RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

// Converte HSL para string CSS
function hslToString(hsl: { h: number; s: number; l: number }): string {
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`
}

export function TenantTheme() {
  const user = useAuthStore((state) => state.user)
  const primaryColor = user?.tenant?.primary_color

  useEffect(() => {
    if (!primaryColor) {
      // Reset para cor padrão (violeta)
      document.documentElement.style.setProperty('--primary', '262 83% 58%')
      document.documentElement.style.setProperty('--accent', '262 83% 58%')
      document.documentElement.style.setProperty('--ring', '262 83% 58%')
      return
    }

    const hsl = hexToHSL(primaryColor)
    if (!hsl) return

    const hslString = hslToString(hsl)
    
    // Aplica a cor nas variáveis CSS
    document.documentElement.style.setProperty('--primary', hslString)
    document.documentElement.style.setProperty('--accent', hslString)
    document.documentElement.style.setProperty('--ring', hslString)
    
    // Também atualiza gradientes e efeitos que usam a cor diretamente
    // Criando uma variável adicional para uso em gradientes
    document.documentElement.style.setProperty('--primary-hex', primaryColor)

  }, [primaryColor])

  return null
}
