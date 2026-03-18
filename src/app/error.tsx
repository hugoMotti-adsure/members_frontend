'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Detecta erro de chunk do Next.js após redeploy
    // e recarrega automaticamente uma vez para buscar os novos arquivos
    const isChunkError =
      error?.message?.includes('ChunkLoadError') ||
      error?.message?.includes('Loading chunk') ||
      error?.message?.includes('Failed to fetch dynamically imported module') ||
      error?.message?.includes('is not a function') ||
      error?.name === 'ChunkLoadError'

    if (isChunkError) {
      // Evita loop de reload infinito com um flag no sessionStorage
      const alreadyReloaded = sessionStorage.getItem('chunk-error-reload')
      if (!alreadyReloaded) {
        sessionStorage.setItem('chunk-error-reload', '1')
        window.location.reload()
      } else {
        sessionStorage.removeItem('chunk-error-reload')
      }
    }
  }, [error])

  return (
    <html>
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#09090b',
          color: '#fafafa',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
            Algo deu errado
          </h2>
          <p style={{ color: '#a1a1aa', marginBottom: '1.5rem' }}>
            A plataforma foi atualizada. Atualize a página para continuar.
          </p>
          <button
            onClick={() => {
              sessionStorage.removeItem('chunk-error-reload')
              window.location.reload()
            }}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: '#e11d48',
              color: '#fff',
              border: 'none',
              borderRadius: '0.5rem',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Atualizar página
          </button>
        </div>
      </body>
    </html>
  )
}
