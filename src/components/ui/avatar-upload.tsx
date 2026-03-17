'use client'

import { useState, useRef, useCallback } from 'react'
import Cropper, { Area, Point } from 'react-easy-crop'
import { Upload, X, Loader2, ZoomIn, ZoomOut, RotateCw, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'
import { Button } from './button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'

interface AvatarUploadProps {
  value?: string | null
  onChange: (url: string | null) => void
  className?: string
  disabled?: boolean
}

// Função para criar imagem a partir de URL
const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

// Função para obter a imagem recortada
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: Area,
  rotation = 0
): Promise<Blob | null> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  if (!ctx) return null

  const rotRad = (rotation * Math.PI) / 180

  // Calcula bounding box da imagem rotacionada
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  )

  // Define tamanho do canvas para conter a imagem rotacionada
  canvas.width = bBoxWidth
  canvas.height = bBoxHeight

  // Translada o canvas para o centro antes de rotacionar
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2)
  ctx.rotate(rotRad)
  ctx.translate(-image.width / 2, -image.height / 2)

  // Desenha a imagem rotacionada
  ctx.drawImage(image, 0, 0)

  // Extrai a área recortada
  const croppedCanvas = document.createElement('canvas')
  const croppedCtx = croppedCanvas.getContext('2d')

  if (!croppedCtx) return null

  // Define tamanho do canvas de saída (quadrado para avatar)
  const outputSize = Math.min(pixelCrop.width, pixelCrop.height, 512)
  croppedCanvas.width = outputSize
  croppedCanvas.height = outputSize

  // Desenha a área recortada no canvas de saída
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputSize,
    outputSize
  )

  // Retorna como blob
  return new Promise((resolve) => {
    croppedCanvas.toBlob(
      (blob) => resolve(blob),
      'image/jpeg',
      0.9
    )
  })
}

// Função para calcular o tamanho da imagem rotacionada
function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  }
}

export function AvatarUpload({
  value,
  onChange,
  className,
  disabled = false,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [imageSrc, setImageSrc] = useState<string | null>(null)
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const onCropComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação do tipo
    if (!file.type.match(/^image\/(jpeg|jpg|png|gif|webp)$/)) {
      setError('Formato inválido. Use JPG, PNG, GIF ou WebP.')
      return
    }

    // Validação do tamanho (10MB para permitir imagens maiores antes do crop)
    if (file.size > 10 * 1024 * 1024) {
      setError('Arquivo muito grande. Máximo 10MB.')
      return
    }

    setError(null)

    // Lê o arquivo e abre o dialog de crop
    const reader = new FileReader()
    reader.addEventListener('load', () => {
      setImageSrc(reader.result as string)
      setCropDialogOpen(true)
      // Reset crop settings
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
    })
    reader.readAsDataURL(file)

    // Limpa o input
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return

    setIsUploading(true)
    setCropDialogOpen(false)

    try {
      // Gera a imagem recortada
      const croppedBlob = await getCroppedImg(imageSrc, croppedAreaPixels, rotation)
      
      if (!croppedBlob) {
        throw new Error('Erro ao processar imagem')
      }

      // Cria FormData para upload
      const formData = new FormData()
      formData.append('file', croppedBlob, 'avatar.jpg')

      // Faz upload
      const response = await api.post('/upload/image?folder=avatars', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      onChange(response.data.url)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao fazer upload')
    } finally {
      setIsUploading(false)
      setImageSrc(null)
    }
  }

  const handleRemove = () => {
    onChange(null)
    setError(null)
  }

  const handleCropCancel = () => {
    setCropDialogOpen(false)
    setImageSrc(null)
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

      {/* Preview do Avatar */}
      {value ? (
        <div className="relative w-32 h-32 mx-auto">
          <div className="w-full h-full rounded-full overflow-hidden border-4 border-zinc-700 bg-zinc-900">
            <img
              src={value}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          {!disabled && (
            <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
              >
                <Upload className="w-5 h-5 text-white" />
              </button>
              <button
                type="button"
                onClick={handleRemove}
                className="p-2 bg-red-500/80 hover:bg-red-500 rounded-full transition-colors"
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
            'w-32 h-32 mx-auto rounded-full border-2 border-dashed border-zinc-700 hover:border-primary/50 transition-colors flex flex-col items-center justify-center gap-1 bg-zinc-900/50',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isUploading ? (
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          ) : (
            <>
              <Upload className="w-6 h-6 text-zinc-500" />
              <span className="text-xs text-zinc-500">Upload</span>
            </>
          )}
        </button>
      )}

      {/* Loading indicator */}
      {isUploading && (
        <p className="text-sm text-center text-zinc-400">Enviando...</p>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}

      {/* Dialog de Crop */}
      <Dialog open={cropDialogOpen} onOpenChange={setCropDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajustar Foto</DialogTitle>
            <DialogDescription>
              Arraste para posicionar e use os controles para ajustar
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Área do Cropper */}
            <div className="relative h-[300px] bg-zinc-900 rounded-lg overflow-hidden">
              {imageSrc && (
                <Cropper
                  image={imageSrc}
                  crop={crop}
                  zoom={zoom}
                  rotation={rotation}
                  aspect={1}
                  cropShape="round"
                  showGrid={false}
                  onCropChange={setCrop}
                  onCropComplete={onCropComplete}
                  onZoomChange={setZoom}
                />
              )}
            </div>

            {/* Controles */}
            <div className="space-y-3">
              {/* Zoom */}
              <div className="flex items-center gap-3">
                <ZoomOut className="w-4 h-4 text-zinc-500" />
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <ZoomIn className="w-4 h-4 text-zinc-500" />
              </div>

              {/* Rotação */}
              <div className="flex items-center gap-3">
                <RotateCw className="w-4 h-4 text-zinc-500" />
                <input
                  type="range"
                  min={0}
                  max={360}
                  step={1}
                  value={rotation}
                  onChange={(e) => setRotation(Number(e.target.value))}
                  className="flex-1 h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-primary"
                />
                <span className="text-xs text-zinc-500 w-10">{rotation}°</span>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCropCancel}>
              Cancelar
            </Button>
            <Button
              type="button"
              onClick={handleCropSave}
              disabled={isUploading}
              className="bg-primary hover:bg-primary/90"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Aplicar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
