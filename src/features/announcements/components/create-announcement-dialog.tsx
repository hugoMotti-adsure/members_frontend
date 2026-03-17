'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ImageUpload } from '@/components/ui/image-upload'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

const createAnnouncementSchema = z.object({
  title: z.string().optional(),
  image_url: z.string().optional().nullable(),
  description: z.string().optional(),
  link: z.string().optional(),
  badge_text: z.string().optional(),
}).refine(
  (data) => data.title || data.image_url || data.description,
  { message: 'Ao menos um campo (título, imagem ou descrição) deve ser preenchido' }
)

type CreateAnnouncementForm = z.infer<typeof createAnnouncementSchema>

interface CreateAnnouncementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateAnnouncementDialog({ open, onOpenChange }: CreateAnnouncementDialogProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CreateAnnouncementForm>({
    resolver: zodResolver(createAnnouncementSchema),
  })

  const imageUrl = watch('image_url')

  const createMutation = useMutation({
    mutationFn: (data: CreateAnnouncementForm) => api.post('/announcements', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      toast({ title: 'Anúncio criado com sucesso!' })
      reset()
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar anúncio',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: CreateAnnouncementForm) => {
    createMutation.mutate(data)
  }

  const handleClose = (isOpen: boolean) => {
    if (!isOpen) {
      reset()
    }
    onOpenChange(isOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Novo Anúncio</DialogTitle>
          <DialogDescription>
            Crie um anúncio que será exibido abaixo de todas as aulas. Preencha ao menos um campo.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input
              id="title"
              placeholder="Ex: Promoção especial!"
              {...register('title')}
            />
          </div>

          <div className="space-y-2">
            <Label>Imagem (16:9)</Label>
            <ImageUpload
              value={imageUrl}
              onChange={(url) => setValue('image_url', url)}
              folder="announcements"
              disabled={createMutation.isPending}
              aspectRatio="video"
            />
            <p className="text-xs text-muted-foreground">Recomendado: 1920x1080px ou proporção 16:9</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <textarea
              id="description"
              rows={3}
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Descreva o anúncio..."
              {...register('description')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="link">Link (opcional)</Label>
            <Input
              id="link"
              type="url"
              placeholder="https://exemplo.com/promocao"
              {...register('link')}
            />
            <p className="text-xs text-muted-foreground">Se preenchido, o anúncio será clicável</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="badge_text">Texto do Badge</Label>
            <Input
              id="badge_text"
              placeholder="Anúncio"
              {...register('badge_text')}
            />
            <p className="text-xs text-muted-foreground">Texto exibido no canto do anúncio (padrão: "Anúncio")</p>
          </div>

          {errors.root && (
            <p className="text-sm text-destructive">{errors.root.message}</p>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                'Criar Anúncio'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
