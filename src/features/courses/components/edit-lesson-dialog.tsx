'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2, FileText, FolderOpen } from 'lucide-react'
import { useEffect, useState } from 'react'
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
import { ImageUpload } from '@/components/ui/image-upload'
import { LessonMaterialsManager } from './lesson-materials-manager'

const schema = z.object({
  title: z.string().min(2, 'O título deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  thumbnail_url: z.string().optional().nullable(),
  video_url: z.string().optional(),
  video_provider: z.string().optional(),
  duration_minutes: z.coerce.number().optional(),
  is_free: z.boolean().optional(),
  is_published: z.boolean().optional(),
  banner_url: z.string().optional().nullable(),
  banner_link: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Lesson {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  video_url?: string
  video_provider?: string
  duration_minutes?: number
  is_free: boolean
  is_published: boolean
  banner_url?: string
  banner_link?: string
}

interface EditLessonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lesson: Lesson
  tenantId: string
  onSuccess: () => void
}

export function EditLessonDialog({ open, onOpenChange, lesson, tenantId, onSuccess }: EditLessonDialogProps) {
  const { toast } = useToast()
  const [showMaterials, setShowMaterials] = useState(false)

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const thumbnailUrl = watch('thumbnail_url')
  const bannerUrl = watch('banner_url')

  useEffect(() => {
    reset({
      title: lesson.title,
      description: lesson.description || '',
      thumbnail_url: lesson.thumbnail_url || null,
      video_url: lesson.video_url || '',
      video_provider: lesson.video_provider || '',
      duration_minutes: lesson.duration_minutes || undefined,
      is_free: lesson.is_free,
      is_published: lesson.is_published,
      banner_url: lesson.banner_url || null,
      banner_link: lesson.banner_link || '',
    })
  }, [lesson, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.patch(`/lessons/${lesson.id}`, data),
    onSuccess: () => {
      toast({ title: 'Aula atualizada com sucesso!' })
      onOpenChange(false)
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar aula',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: FormData) => mutation.mutate(data)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Aula</DialogTitle>
          <DialogDescription>
            Atualize as informações da aula
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Aula *</Label>
            <Input id="title" {...register('title')} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              rows={2}
              className="flex min-h-[60px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('description')}
            />
          </div>

          {/* Capa da Aula */}
          <div className="space-y-2">
            <Label>Capa da Aula (Thumbnail)</Label>
            <ImageUpload
              value={thumbnailUrl}
              onChange={(url) => setValue('thumbnail_url', url)}
              folder="lessons"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url">URL do Vídeo (embed)</Label>
            <Input id="video_url" {...register('video_url')} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="video_provider">Provedor</Label>
              <select
                id="video_provider"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                {...register('video_provider')}
              >
                <option value="">Selecione...</option>
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
                <option value="panda">Panda Video</option>
                <option value="bunny">Bunny Stream</option>
                <option value="custom">Outro</option>
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration_minutes">Duração (min)</Label>
              <Input
                id="duration_minutes"
                type="number"
                {...register('duration_minutes')}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_free"
                className="rounded border-zinc-700"
                {...register('is_free')}
              />
              <Label htmlFor="is_free" className="cursor-pointer">
                Aula gratuita (preview)
              </Label>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is_published"
                className="rounded border-zinc-700"
                {...register('is_published')}
              />
              <Label htmlFor="is_published" className="cursor-pointer">
                Publicar aula
              </Label>
            </div>
          </div>

          {/* Banner Promocional */}
          <div className="pt-4 border-t border-zinc-800 space-y-4">
            <div className="space-y-2">
              <Label>Banner Promocional (horizontal)</Label>
              <p className="text-xs text-zinc-500">Exibido abaixo da descrição da aula</p>
              <ImageUpload
                value={bannerUrl}
                onChange={(url) => setValue('banner_url', url)}
                folder="lessons/banners"
                aspectRatio="banner"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner_link">Link do Banner</Label>
              <Input 
                id="banner_link" 
                placeholder="https://exemplo.com/oferta"
                {...register('banner_link')} 
              />
              <p className="text-xs text-zinc-500">URL para onde o banner direciona ao ser clicado</p>
            </div>
          </div>

          {/* Botão para gerenciar materiais */}
          <div className="pt-2 border-t border-zinc-800">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setShowMaterials(true)}
            >
              <FolderOpen className="w-4 h-4 mr-2" />
              Gerenciar Materiais da Aula
            </Button>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </form>

        {/* Dialog de Materiais */}
        <LessonMaterialsManager
          open={showMaterials}
          onOpenChange={setShowMaterials}
          lessonId={lesson.id}
          tenantId={tenantId}
        />
      </DialogContent>
    </Dialog>
  )
}
