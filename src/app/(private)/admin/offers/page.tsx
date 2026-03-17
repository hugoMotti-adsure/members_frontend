'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, MoreVertical, Edit, Trash2, Package, Clock, BookOpen } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { CreateOfferDialog } from '@/features/offers/components/create-offer-dialog'
import { EditOfferDialog } from '@/features/offers/components/edit-offer-dialog'

interface Offer {
  id: string
  name: string
  description: string | null
  access_days: number | null
  is_active: boolean
  courses: Array<{ id: string; title: string; slug: string; thumbnail_url: string | null }>
  courses_count: number
  mappings_count: number
  created_at: string
}

export default function OffersPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: offers, isLoading } = useQuery<Offer[]>({
    queryKey: ['offers'],
    queryFn: () => api.get('/offers').then((res) => res.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (offerId: string) => api.delete(`/offers/${offerId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      toast({ title: 'Entrega excluída com sucesso' })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir entrega',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const formatAccessDays = (days: number | null) => {
    if (!days) return 'Vitalício'
    if (days === 365) return '1 ano'
    if (days === 180) return '6 meses'
    if (days === 90) return '3 meses'
    if (days === 30) return '1 mês'
    return `${days} dias`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Entregas</h1>
          <p className="text-muted-foreground">
            Configure as entregas dos seus produtos (agrupe cursos para vender juntos)
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Entrega
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                <div className="h-4 bg-muted rounded w-1/2" />
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-muted rounded w-full mb-2" />
                <div className="h-4 bg-muted rounded w-2/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : offers?.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Package className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhuma entrega configurada</h3>
          <p className="text-muted-foreground mb-4 max-w-md mx-auto">
            Crie entregas para agrupar cursos que serão liberados juntos quando um produto for comprado.
          </p>
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Criar Entrega
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {offers?.map((offer) => (
            <Card key={offer.id} className="overflow-hidden hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{offer.name}</h3>
                      <Badge variant={offer.is_active ? 'default' : 'secondary'} className="mt-1">
                        {offer.is_active ? 'Ativa' : 'Inativa'}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditingOffer(offer)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => {
                          if (offer.mappings_count > 0) {
                            toast({
                              title: 'Não é possível excluir',
                              description: 'Remova os mapeamentos de produtos primeiro',
                              variant: 'destructive',
                            })
                            return
                          }
                          if (confirm('Tem certeza que deseja excluir esta entrega?')) {
                            deleteMutation.mutate(offer.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                {offer.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {offer.description}
                  </p>
                )}
                {offer.courses.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Cursos incluídos:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {offer.courses.slice(0, 3).map((course) => (
                        <Badge key={course.id} variant="outline" className="text-xs">
                          {course.title}
                        </Badge>
                      ))}
                      {offer.courses.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{offer.courses.length - 3} mais
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex items-center justify-between text-sm text-muted-foreground border-t pt-4">
                <div className="flex items-center gap-1">
                  <BookOpen className="h-4 w-4" />
                  {offer.courses_count} curso{offer.courses_count !== 1 ? 's' : ''}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatAccessDays(offer.access_days)}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <CreateOfferDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
      
      {editingOffer && (
        <EditOfferDialog
          offer={editingOffer}
          open={!!editingOffer}
          onOpenChange={(open) => !open && setEditingOffer(null)}
        />
      )}
    </div>
  )
}
