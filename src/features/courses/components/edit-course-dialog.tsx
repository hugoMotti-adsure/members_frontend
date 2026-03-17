'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { Loader2, Upload, X, Image as ImageIcon, Link2, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'
import { DisplayMode } from '../types'

const PLATFORMS = [
  { value: 'greenn', label: 'Greenn' },
  { value: 'hotmart', label: 'Hotmart' },
  { value: 'kiwify', label: 'Kiwify' },
  { value: 'lightforms', label: 'Lightforms' },
  { value: 'eduzz', label: 'Eduzz' },
  { value: 'monetizze', label: 'Monetizze' },
]

const editCourseSchema = z.object({
  title: z.string().min(3, 'O título deve ter no mínimo 3 caracteres'),
  slug: z
    .string()
    .min(3, 'O slug deve ter no mínimo 3 caracteres')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido. Use apenas letras minúsculas, números e hífens'),
  description: z.string().optional(),
  thumbnail_url: z.string().optional(),
  small_thumbnail_url: z.string().optional(),
  display_mode: z.enum(['default', 'netflix']).optional(),
  // Integração com plataforma de vendas
  platform: z.string().optional(),
  external_product_id: z.string().optional(),
})

type EditCourseForm = z.infer<typeof editCourseSchema>

interface Course {
  id: string
  title: string
  slug: string
  description?: string
  thumbnail_url?: string
  small_thumbnail_url?: string
  display_mode?: DisplayMode
}

interface EditCourseDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  course: Course
  onSuccess?: () => void
}

export function EditCourseDialog({ open, onOpenChange, course, onSuccess }: EditCourseDialogProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(course.thumbnail_url || null)
  const [smallThumbnailPreview, setSmallThumbnailPreview] = useState<string | null>(course.small_thumbnail_url || null)

  // Busca mapeamentos existentes para este curso
  const { data: mappings } = useQuery({
    queryKey: ['product-mappings', course.id],
    queryFn: () => api.get('/webhooks/mappings').then(res => res.data),
    enabled: open,
  })

  // Encontra o mapeamento para este curso (se existir)
  const existingMapping = mappings?.find((m: any) => m.course_id === course.id)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<EditCourseForm>({
    resolver: zodResolver(editCourseSchema),
    defaultValues: {
      title: course.title,
      slug: course.slug,
      description: course.description || '',
      thumbnail_url: course.thumbnail_url || '',
      small_thumbnail_url: course.small_thumbnail_url || '',
      display_mode: course.display_mode || 'default',
      platform: '',
      external_product_id: '',
    },
  })

  // Reset form when course changes ou quando carregar mapeamento
  useEffect(() => {
    if (course) {
      reset({
        title: course.title,
        slug: course.slug,
        description: course.description || '',
        thumbnail_url: course.thumbnail_url || '',
        small_thumbnail_url: course.small_thumbnail_url || '',
        display_mode: course.display_mode || 'default',
        platform: existingMapping?.platform || '',
        external_product_id: existingMapping?.external_product_id || '',
      })
      setThumbnailPreview(course.thumbnail_url || null)
      setSmallThumbnailPreview(course.small_thumbnail_url || null)
    }
  }, [course, reset, existingMapping])

  const title = watch('title')
  const displayMode = watch('display_mode')
  const platform = watch('platform')

  // Gera slug automaticamente quando o título muda (só se o slug atual for igual ao gerado do título original)
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const updateMutation = useMutation({
    mutationFn: async (data: EditCourseForm) => {
      // Atualiza o curso
      const { platform, external_product_id, ...courseData } = data
      await api.patch(`/courses/${course.id}`, courseData)

      // Se tiver plataforma e ID do produto, cria/atualiza mapeamento
      if (platform && external_product_id) {
        // Se já existe um mapeamento diferente, deleta o antigo
        if (existingMapping && existingMapping.external_product_id !== external_product_id) {
          await api.delete(`/webhooks/mappings/${existingMapping.id}`)
        }
        
        // Cria o novo mapeamento (se não existir ou for diferente)
        if (!existingMapping || existingMapping.external_product_id !== external_product_id) {
          await api.post('/webhooks/mappings', {
            platform,
            external_product_id,
            course_id: course.id,
            product_name: course.title,
          })
        }
      } else if (existingMapping && !external_product_id) {
        // Se removeu o ID do produto, deleta o mapeamento
        await api.delete(`/webhooks/mappings/${existingMapping.id}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', course.id] })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['product-mappings'] })
      toast({ title: 'Curso atualizado com sucesso!' })
      onSuccess?.()
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar curso',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: EditCourseForm) => {
    updateMutation.mutate(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Curso</DialogTitle>
          <DialogDescription>
            Altere as informações do curso
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="grid gap-2">
            <Label htmlFor="title">Título do Curso</Label>
            <Input id="title" {...register('title')} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="slug">URL do Curso (slug)</Label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">/course/</span>
              <Input id="slug" {...register('slug')} className="flex-1" />
            </div>
            {errors.slug && (
              <p className="text-sm text-destructive">{errors.slug.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Use apenas letras minúsculas, números e hífens. Ex: meu-curso-incrivel
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setValue('slug', generateSlug(title))}
            >
              Gerar do título
            </Button>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <textarea
              id="description"
              {...register('description')}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Descreva o conteúdo do curso..."
            />
          </div>

          {/* Capa do Curso */}
          <div className="grid gap-2">
            <Label>Capa do Curso</Label>
            <div className="flex items-start gap-4">
              {thumbnailPreview ? (
                <div className="relative w-32 h-20 rounded-lg overflow-hidden border border-border">
                  <img
                    src={thumbnailPreview}
                    alt="Capa do curso"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setThumbnailPreview(null)
                      setValue('thumbnail_url', '')
                    }}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-32 h-20 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="URL da imagem de capa"
                  {...register('thumbnail_url')}
                  onChange={(e) => {
                    setValue('thumbnail_url', e.target.value)
                    setThumbnailPreview(e.target.value || null)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Cole a URL de uma imagem (recomendado: 16:9, mín. 1280x720)
                </p>
              </div>
            </div>
          </div>

          {/* Thumbnail Pequena */}
          <div className="grid gap-2">
            <Label>Thumbnail Pequena</Label>
            <p className="text-xs text-muted-foreground -mt-1">
              Exibida no header do player e nas listagens
            </p>
            <div className="flex items-start gap-4">
              {smallThumbnailPreview ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden border border-border">
                  <img
                    src={smallThumbnailPreview}
                    alt="Thumbnail pequena"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSmallThumbnailPreview(null)
                      setValue('small_thumbnail_url', '')
                    }}
                    className="absolute top-1 right-1 p-1 bg-black/50 rounded-full hover:bg-black/70"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg border-2 border-dashed border-border flex items-center justify-center">
                  <ImageIcon className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="URL da thumbnail pequena"
                  {...register('small_thumbnail_url')}
                  onChange={(e) => {
                    setValue('small_thumbnail_url', e.target.value)
                    setSmallThumbnailPreview(e.target.value || null)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Recomendado: 1:1 (quadrada), mín. 200x200
                </p>
              </div>
            </div>
          </div>

          {/* Modo de Exibição */}
          <div className="grid gap-2">
            <Label>Modo de Exibição</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setValue('display_mode', 'default')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  displayMode === 'default'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-left">
                  <p className="font-medium text-sm">Padrão</p>
                  <p className="text-xs text-muted-foreground">Lista de aulas por módulo</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setValue('display_mode', 'netflix')}
                className={`p-3 rounded-lg border-2 transition-all ${
                  displayMode === 'netflix'
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="text-left">
                  <p className="font-medium text-sm">Netflix</p>
                  <p className="text-xs text-muted-foreground">Grid de módulos com capas</p>
                </div>
              </button>
            </div>
            {displayMode === 'netflix' && (
              <p className="text-xs text-amber-500">
                ⚠️ Configure capas nos módulos para melhor visualização
              </p>
            )}
          </div>

          {/* Integração com Plataforma de Vendas */}
          <div className="grid gap-2 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-muted-foreground" />
              <Label>Integração com Plataforma de Vendas</Label>
            </div>
            <p className="text-xs text-muted-foreground">
              Configure para liberar acesso automático quando alguém comprar o produto
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="platform" className="text-xs">Plataforma</Label>
                <select
                  id="platform"
                  {...register('platform')}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Nenhuma</option>
                  {PLATFORMS.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-1">
                <Label htmlFor="external_product_id" className="text-xs">ID do Produto</Label>
                <Input
                  id="external_product_id"
                  placeholder="Ex: 138334"
                  {...register('external_product_id')}
                  disabled={!platform}
                />
              </div>
            </div>
            
            {existingMapping && (
              <p className="text-xs text-green-500 flex items-center gap-1">
                ✓ Integração ativa: {existingMapping.platform} #{existingMapping.external_product_id}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar Alterações'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
