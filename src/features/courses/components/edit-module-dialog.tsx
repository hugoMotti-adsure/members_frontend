'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
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

const schema = z.object({
  title: z.string().min(2, 'O título deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  thumbnail_url: z.string().optional().nullable(),
  is_published: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface Module {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  is_published: boolean
}

interface EditModuleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  module: Module
  onSuccess: () => void
}

export function EditModuleDialog({ open, onOpenChange, module, onSuccess }: EditModuleDialogProps) {
  const { toast } = useToast()

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: module.title,
      description: module.description || '',
      thumbnail_url: module.thumbnail_url || null,
      is_published: module.is_published,
    },
  })

  const thumbnailUrl = watch('thumbnail_url')

  useEffect(() => {
    reset({
      title: module.title,
      description: module.description || '',
      thumbnail_url: module.thumbnail_url || null,
      is_published: module.is_published,
    })
  }, [module, reset])

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.patch(`/modules/${module.id}`, data),
    onSuccess: () => {
      toast({ title: 'Módulo atualizado com sucesso!' })
      onOpenChange(false)
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar módulo',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: FormData) => mutation.mutate(data)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Editar Módulo</DialogTitle>
          <DialogDescription>
            Atualize as informações do módulo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título do Módulo *</Label>
            <Input id="title" {...register('title')} />
            {errors.title && (
              <p className="text-sm text-destructive">{errors.title.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              rows={3}
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              {...register('description')}
            />
          </div>

          {/* Capa do Módulo */}
          <div className="space-y-2">
            <Label>Capa do Módulo</Label>
            <div className="max-w-[140px]">
              <ImageUpload
                value={thumbnailUrl}
                onChange={(url) => setValue('thumbnail_url', url)}
                folder="modules"
                aspectRatio="portrait"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Para exibição no modo Netflix (9:16 recomendado)
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is_published"
              className="rounded border-zinc-700"
              {...register('is_published')}
            />
            <Label htmlFor="is_published" className="cursor-pointer">
              Publicar módulo
            </Label>
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
      </DialogContent>
    </Dialog>
  )
}
