'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, ExternalLink, Image, FileText, Megaphone } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { CreateAnnouncementDialog, EditAnnouncementDialog } from '@/features/announcements'

interface Announcement {
  id: string
  title?: string | null
  image_url?: string | null
  description?: string | null
  link?: string | null
  badge_text?: string | null
  is_active: boolean
  order_index: number
  created_at: string
}

export default function AnnouncementsPage() {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null)

  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['announcements'],
    queryFn: () => api.get('/announcements').then((res) => res.data),
  })

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/announcements/${id}/toggle`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao alterar status',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/announcements/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['announcements'] })
      toast({ title: 'Anúncio excluído com sucesso!' })
      setDeleteDialogOpen(false)
      setSelectedAnnouncement(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir anúncio',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setEditDialogOpen(true)
  }

  const handleDelete = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (selectedAnnouncement) {
      deleteMutation.mutate(selectedAnnouncement.id)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Anúncios</h1>
          <p className="text-muted-foreground">
            Gerencie os anúncios globais que aparecem abaixo de todas as aulas
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Anúncio
        </Button>
      </div>

      {/* Lista de Anúncios */}
      {announcements.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Megaphone className="w-12 h-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum anúncio criado</h3>
            <p className="text-muted-foreground text-center mb-4">
              Crie anúncios para exibir promoções, avisos ou informações importantes abaixo das aulas.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Anúncio
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {announcements.map((announcement) => (
            <Card key={announcement.id} className={!announcement.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Preview da Imagem */}
                  <div className="w-48 h-27 flex-shrink-0 rounded-lg overflow-hidden bg-muted">
                    {announcement.image_url ? (
                      <img
                        src={announcement.image_url}
                        alt={announcement.title || 'Anúncio'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Image className="w-8 h-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Conteúdo */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        {announcement.title && (
                          <h3 className="font-semibold text-lg truncate">{announcement.title}</h3>
                        )}
                        {announcement.description && (
                          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                            {announcement.description}
                          </p>
                        )}
                        {announcement.link && (
                          <a
                            href={announcement.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-2"
                          >
                            <ExternalLink className="w-3 h-3" />
                            {announcement.link}
                          </a>
                        )}
                        {!announcement.title && !announcement.description && (
                          <p className="text-sm text-muted-foreground italic">Apenas imagem</p>
                        )}
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {announcement.is_active ? 'Ativo' : 'Inativo'}
                          </span>
                          <Switch
                            checked={announcement.is_active}
                            onCheckedChange={() => toggleMutation.mutate(announcement.id)}
                            disabled={toggleMutation.isPending}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(announcement)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(announcement)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Dialogs */}
      <CreateAnnouncementDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      <EditAnnouncementDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        announcement={selectedAnnouncement}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Anúncio</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este anúncio? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
