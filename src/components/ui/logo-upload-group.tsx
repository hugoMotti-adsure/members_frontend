'use client'

import { useState, useRef } from 'react'
import { Upload, X, Loader2, Image as ImageIcon, Maximize2, Square, CircleDot } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

interface LogoValues {
  logo_url: string | null
  logo_horizontal_url: string | null
  logo_icon_url: string | null
}

interface LogoUploadGroupProps {
  values: LogoValues
  onChange: (values: LogoValues) => void
  disabled?: boolean
}

type LogoType = 'horizontal' | 'square' | 'icon'

interface LogoConfig {
  type: LogoType
  key: keyof LogoValues
  label: string
  description: string
  icon: React.ElementType
  aspectRatio: string
  containerClass: string
  previewClass: string
}

const LOGO_CONFIGS: LogoConfig[] = [
  {
    type: 'horizontal',
    key: 'logo_horizontal_url',
    label: 'Logo Horizontal',
    description: 'Para headers e áreas amplas',
    icon: Maximize2,
    aspectRatio: 'aspect-[3/1]',
    containerClass: 'col-span-2',
    previewClass: 'max-h-16',
  },
  {
    type: 'square',
    key: 'logo_url',
    label: 'Logo 1:1',
    description: 'Para avatars e miniaturas',
    icon: Square,
    aspectRatio: 'aspect-square',
    containerClass: '',
    previewClass: 'max-h-24',
  },
  {
    type: 'icon',
    key: 'logo_icon_url',
    label: 'Apenas Ícone',
    description: 'Símbolo/marca compacta',
    icon: CircleDot,
    aspectRatio: 'aspect-square',
    containerClass: '',
    previewClass: 'max-h-16',
  },
]

export function LogoUploadGroup({
  values,
  onChange,
  disabled = false,
}: LogoUploadGroupProps) {
  const [uploadingType, setUploadingType] = useState<LogoType | null>(null)
  const [errors, setErrors] = useState<Partial<Record<LogoType, string>>>({})
  const inputRefs = useRef<Record<LogoType, HTMLInputElement | null>>({
    horizontal: null,
    square: null,
    icon: null,
  })

  const handleFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>,
    config: LogoConfig
  ) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação do tipo
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp|svg\+xml)$/)) {
      setErrors((prev) => ({
        ...prev,
        [config.type]: 'Formato inválido. Use JPG, PNG, GIF, WebP ou SVG.',
      }))
      return
    }

    // Validação do tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({
        ...prev,
        [config.type]: 'Arquivo muito grande. Máximo 5MB.',
      }))
      return
    }

    setErrors((prev) => ({ ...prev, [config.type]: undefined }))
    setUploadingType(config.type)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await api.post('/upload/image?folder=logos', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      onChange({
        ...values,
        [config.key]: response.data.url,
      })
    } catch (err: any) {
      setErrors((prev) => ({
        ...prev,
        [config.type]: err.response?.data?.message || 'Erro ao fazer upload',
      }))
    } finally {
      setUploadingType(null)
      // Limpa o input para permitir selecionar o mesmo arquivo novamente
      const inputRef = inputRefs.current[config.type]
      if (inputRef) {
        inputRef.value = ''
      }
    }
  }

  const handleRemove = (config: LogoConfig) => {
    onChange({
      ...values,
      [config.key]: null,
    })
    setErrors((prev) => ({ ...prev, [config.type]: undefined }))
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        {LOGO_CONFIGS.map((config) => {
          const value = values[config.key]
          const isUploading = uploadingType === config.type
          const error = errors[config.type]
          const Icon = config.icon

          return (
            <div
              key={config.type}
              className={cn('space-y-2', config.containerClass)}
            >
              {/* Label */}
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-zinc-800 flex items-center justify-center">
                  <Icon className="w-3.5 h-3.5 text-zinc-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {config.label}
                  </p>
                  <p className="text-xs text-zinc-500">{config.description}</p>
                </div>
              </div>

              {/* Hidden Input */}
              <input
                ref={(el) => {
                  inputRefs.current[config.type] = el
                }}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
                onChange={(e) => handleFileSelect(e, config)}
                className="hidden"
                disabled={disabled || isUploading}
              />

              {/* Upload Area */}
              {value ? (
                <div
                  className={cn(
                    'relative rounded-xl overflow-hidden border border-zinc-700/50 bg-zinc-900/80',
                    'backdrop-blur-sm',
                    config.aspectRatio
                  )}
                >
                  <div className="absolute inset-0 flex items-center justify-center p-4">
                    <img
                      src={value}
                      alt={config.label}
                      className={cn(
                        'w-full h-full object-contain',
                        config.previewClass
                      )}
                    />
                  </div>
                  {!disabled && (
                    <div className="absolute inset-0 bg-black/60 opacity-0 hover:opacity-100 transition-all duration-200 flex items-center justify-center gap-3">
                      <button
                        type="button"
                        onClick={() => inputRefs.current[config.type]?.click()}
                        className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors border border-white/10"
                        title="Trocar imagem"
                      >
                        <Upload className="w-4 h-4 text-white" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemove(config)}
                        className="p-2.5 bg-red-500/20 hover:bg-red-500/40 rounded-xl transition-colors border border-red-500/20"
                        title="Remover"
                      >
                        <X className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => inputRefs.current[config.type]?.click()}
                  disabled={disabled || isUploading}
                  className={cn(
                    'w-full rounded-xl border-2 border-dashed border-zinc-700/50 bg-zinc-900/30',
                    'hover:border-zinc-600 hover:bg-zinc-900/50 transition-all duration-200',
                    'flex flex-col items-center justify-center gap-2 cursor-pointer',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    config.aspectRatio
                  )}
                >
                  {isUploading ? (
                    <Loader2 className="w-6 h-6 text-zinc-500 animate-spin" />
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-xl bg-zinc-800/80 flex items-center justify-center">
                        <ImageIcon className="w-5 h-5 text-zinc-500" />
                      </div>
                      <div className="text-center">
                        <p className="text-xs text-zinc-400">
                          Clique para enviar
                        </p>
                        <p className="text-[10px] text-zinc-600 mt-0.5">
                          JPG, PNG, SVG (máx. 5MB)
                        </p>
                      </div>
                    </>
                  )}
                </button>
              )}

              {/* Error */}
              {error && (
                <p className="text-xs text-red-400 flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-red-400" />
                  {error}
                </p>
              )}
            </div>
          )
        })}
      </div>

      {/* Dica */}
      <div className="bg-zinc-800/30 rounded-xl p-3 border border-zinc-700/30">
        <p className="text-xs text-zinc-500 leading-relaxed">
          <span className="text-zinc-400 font-medium">Dica:</span> Use o{' '}
          <span className="text-zinc-300">Logo Horizontal</span> para o header,{' '}
          <span className="text-zinc-300">Logo 1:1</span> como avatar/favicon e o{' '}
          <span className="text-zinc-300">Ícone</span> em espaços reduzidos.
          Recomendamos usar imagens PNG ou SVG com fundo transparente.
        </p>
      </div>
    </div>
  )
}
