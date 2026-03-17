'use client'

import { useEffect } from 'react'
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

const editAnnouncementSchema = z.object({
  title: z.string().optional().nullable(),
  image_url: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  link: z.string().optional().nullable(),
  badge_text: z.string().optional().nullable(),
}).refine(
  (data) => data.title || data.image_url || data.description,
  { message: 'Ao menos um campo (título, imagem ou descrição) deve ser preenchido' }
)

type EditAnnouncementForm = z.infer<typeof editAnnouncementSchema>

interface Announcement {
  id: string
  title?: string | null
  image_url?: string | null
  description?: string | null
  link?: string | null
  badge_text?: string | null
  is_active: boolean
}

interface EditAnnouncementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  announcement: Announcement | null
}

export function EditAnnouncementDialog({ open, onOpenChange, announcement }: EditAnnouncementDialogProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<EditAnnouncementForm>({
    resolver: zodResolver(editAnnouncementSchema),
  })

  const imageUrl = watch('image_url')

  useEffect(() => {
    if (announcement) {
      reset({
        title: announcement.title || '',
        image_url: announcement.image_url || '',
        description: announcement.description || '',
        link: announcement.link || '',
        badge_text: announcement.badge_text || '',
      })
    }
  }, [announcement, reset])

  const updateMutation = useMutation({
    mutationFn: (data: EditAnnouncementForm) => 
      api.patch(`/announcements/${announcement?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      toast({ title: 'Anúncio atualizado com sucesso!' })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar anúncio',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: EditAnnouncementForm) => {
    updateMutation.mutate(data)
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
          <DialogTitle>Editar Anúncio</DialogTitle>
          <DialogDescription>
            Edite as informações do anúncio. Preencha ao menos um campo.
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
              disabled={updateMutation.isPending}
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
