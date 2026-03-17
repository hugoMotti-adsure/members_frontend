'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
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

const schema = z.object({
  title: z.string().min(2, 'O título deve ter no mínimo 2 caracteres'),
  description: z.string().optional(),
  video_url: z.string().optional(),
  video_provider: z.string().optional(),
  duration_minutes: z.coerce.number().optional(),
  is_free: z.boolean().optional(),
})

type FormData = z.infer<typeof schema>

interface CreateLessonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  moduleId: string
  onSuccess: () => void
}

export function CreateLessonDialog({ open, onOpenChange, moduleId, onSuccess }: CreateLessonDialogProps) {
  const { toast } = useToast()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      is_free: false,
    },
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/lessons', { ...data, module_id: moduleId }),
    onSuccess: () => {
      toast({ title: 'Aula criada com sucesso!' })
      reset()
      onOpenChange(false)
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar aula',
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
          <DialogTitle>Nova Aula</DialogTitle>
          <DialogDescription>
            Adicione uma nova aula ao módulo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Aula *</Label>
            <Input
              id="title"
              placeholder="Ex: Aula 1 - Primeiros Passos"
              {...register('title')}
            />
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
              placeholder="Descrição da aula..."
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="video_url">URL do Vídeo (embed)</Label>
            <Input
              id="video_url"
              placeholder="https://www.youtube.com/embed/..."
              {...register('video_url')}
            />
            <p className="text-xs text-zinc-500">
              Cole o link embed do YouTube, Vimeo, Panda Video, etc.
            </p>
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
              <Label htmlFor="duration_minutes">Duração (minutos)</Label>
              <Input
                id="duration_minutes"
                type="number"
                placeholder="10"
                {...register('duration_minutes')}
              />
            </div>
          </div>

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

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Aula'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
