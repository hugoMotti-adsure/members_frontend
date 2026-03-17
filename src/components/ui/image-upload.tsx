'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface ImageUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  folder?: string
  aspectRatio?: 'video' | 'square' | 'portrait' | 'banner'
  className?: string
  disabled?: boolean
}

export function ImageUpload({
  value,
  onChange,
  folder = 'thumbnails',
  aspectRatio = 'video',
  className,
  disabled = false,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação do tipo
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      setError('Formato inválido. Use JPG, PNG, GIF ou WebP.')
      return
    }

    // Validação do tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 5MB.')
      return
    }

    setError(null)
    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post(`/upload/image?folder=${folder}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      onChange(response.data.url)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer upload')
    } finally {
      setIsUploading(false)
      // Limpa o input para permitir selecionar o mesmo arquivo novamente
      if (inputRef.current) {
        inputRef.current.value = ''
      }
    }
  }

  const handleRemove = () => {
    onChange(null)
    setError(null)
  }

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled || isUploading}
      />

      {value ? (
        <div className={cn(
          'relative rounded-lg overflow-hidden border border-border bg-zinc-900',
          aspectRatio === 'video' && 'aspect-video',
          aspectRatio === 'square' && 'aspect-square',
          aspectRatio === 'portrait' && 'aspect-[9/16]',
          aspectRatio === 'banner' && 'aspect-[16/5]'
        )}>
          <img
            src={value}
            alt="Preview"
            className="w-full h-full object-cover"
          />
          {!disabled && (
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <Upload className="w-5 h-5 text-white" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 bg-red-500/80 hover:bg-red-500 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || isUploading}
          className={cn(
            'w-full rounded-lg border-2 border-dashed border-zinc-700 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-2 bg-zinc-900/50',
            aspectRatio === 'video' && 'aspect-video',
            aspectRatio === 'square' && 'aspect-square',
            aspectRatio === 'portrait' && 'aspect-[9/16]',
            aspectRatio === 'banner' && 'aspect-[16/5]',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isUploading ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm text-zinc-400">Enviando...</span>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-zinc-500" />
              </div>
              <span className="text-sm text-zinc-400">Clique para enviar imagem</span>
              <span className="text-xs text-zinc-500">JPG, PNG, GIF ou WebP (máx. 5MB)</span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  )
}
