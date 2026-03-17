'use client'

import { AlertTriangle } from 'lucide-react'

export function TenantNotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 p-8">
        <AlertTriangle className="w-16 h-16 mx-auto text-yellow-500" />
        <h1 className="text-2xl font-bold">Escola não encontrada</h1>
        <p className="text-muted-foreground max-w-md">
          O endereço que você está tentando acessar não corresponde a nenhuma escola cadastrada.
        </p>
        <p className="text-sm text-muted-foreground">
          Verifique se o endereço está correto ou entre em contato com o suporte.
        </p>
      </div>
    </div>
  )
}
