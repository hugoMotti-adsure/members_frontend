'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, Package, BookOpen } from 'lucide-react'

interface CreateMappingDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormData {
  platform: string
  external_product_id: string
  product_name: string
}

interface Offer {
  id: string
  name: string
  is_active: boolean
  offer_courses: Array<{ count: number }>
}

interface Course {
  id: string
  title: string
  is_published: boolean
}

const PLATFORMS = [
  { id: 'hotmart', name: 'Hotmart' },
  { id: 'kiwify', name: 'Kiwify' },
  { id: 'greenn', name: 'Greenn' },
  { id: 'eduzz', name: 'Eduzz' },
  { id: 'braip', name: 'Braip' },
  { id: 'monetizze', name: 'Monetizze' },
  { id: 'perfectpay', name: 'PerfectPay' },
]

export function CreateMappingDialog({ open, onOpenChange }: CreateMappingDialogProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const [linkType, setLinkType] = useState<'offer' | 'course'>('offer')
  const [selectedOfferId, setSelectedOfferId] = useState<string>('')
  const [selectedCourseId, setSelectedCourseId] = useState<string>('')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('')

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      platform: '',
      external_product_id: '',
      product_name: '',
    },
  })

  const { data: offers } = useQuery<Offer[]>({
    queryKey: ['offers-select'],
    queryFn: () => api.get('/offers/select').then((res) => res.data),
    enabled: open,
  })

  const { data: courses } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses').then((res) => res.data),
    enabled: open,
  })

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/webhooks/mappings', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-mappings'] })
      toast({ title: 'Mapeamento criado com sucesso' })
      handleClose()
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar mapeamento',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const handleClose = () => {
    reset()
    setLinkType('offer')
    setSelectedOfferId('')
    setSelectedCourseId('')
    setSelectedPlatform('')
    onOpenChange(false)
  }

  const onSubmit = (data: FormData) => {
    if (linkType === 'offer' && !selectedOfferId) {
      toast({
        title: 'Selecione uma entrega',
        variant: 'destructive',
      })
      return
    }

    if (linkType === 'course' && !selectedCourseId) {
      toast({
        title: 'Selecione um curso',
        variant: 'destructive',
      })
      return
    }

    createMutation.mutate({
      platform: selectedPlatform,
      external_product_id: data.external_product_id,
      product_name: data.product_name || null,
      offer_id: linkType === 'offer' ? selectedOfferId : null,
      course_id: linkType === 'course' ? selectedCourseId : null,
    })
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Novo Mapeamento</DialogTitle>
            <DialogDescription>
              Vincule um produto da plataforma de vendas a uma entrega ou curso
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Plataforma *</Label>
              <Select value={selectedPlatform} onValueChange={setSelectedPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a plataforma" />
                </SelectTrigger>
                <SelectContent>
                  {PLATFORMS.map((platform) => (
                    <SelectItem key={platform.id} value={platform.id}>
                      {platform.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="external_product_id">ID do Produto *</Label>
              <Input
                id="external_product_id"
                placeholder="Ex: 12345678"
                {...register('external_product_id', { required: 'ID do produto é obrigatório' })}
              />
              {errors.external_product_id && (
                <p className="text-sm text-destructive">{errors.external_product_id.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Encontre este ID nas configurações do produto na plataforma
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="product_name">Nome do Produto (opcional)</Label>
              <Input
                id="product_name"
                placeholder="Ex: Curso de Marketing Digital"
                {...register('product_name')}
              />
              <p className="text-xs text-muted-foreground">
                Apenas para facilitar a identificação
              </p>
            </div>

            <div className="space-y-3">
              <Label>Vincular a</Label>
              <RadioGroup
                value={linkType}
                onValueChange={(v) => setLinkType(v as 'offer' | 'course')}
                className="grid grid-cols-2 gap-4"
              >
                <div>
                  <RadioGroupItem value="offer" id="offer" className="peer sr-only" />
                  <Label
                    htmlFor="offer"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <Package className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">Entrega</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Múltiplos cursos
                    </span>
                  </Label>
                </div>
                <div>
                  <RadioGroupItem value="course" id="course" className="peer sr-only" />
                  <Label
                    htmlFor="course"
                    className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
                  >
                    <BookOpen className="mb-2 h-6 w-6" />
                    <span className="text-sm font-medium">Curso</span>
                    <span className="text-xs text-muted-foreground text-center">
                      Curso único
                    </span>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {linkType === 'offer' && (
              <div className="space-y-2">
                <Label>Selecione a Entrega *</Label>
                <Select value={selectedOfferId} onValueChange={setSelectedOfferId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma entrega" />
                  </SelectTrigger>
                  <SelectContent>
                    {offers?.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Nenhuma entrega disponível
                      </div>
                    ) : (
                      offers?.map((offer) => (
                        <SelectItem key={offer.id} value={offer.id}>
                          <div className="flex items-center gap-2">
                            <Package className="h-4 w-4" />
                            <span>{offer.name}</span>
                            <span className="text-muted-foreground text-xs">
                              ({offer.offer_courses?.[0]?.count || 0} cursos)
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {offers?.length === 0 && (
                  <p className="text-xs text-amber-500">
                    Crie uma entrega primeiro em "Entregas" no menu
                  </p>
                )}
              </div>
            )}

            {linkType === 'course' && (
              <div className="space-y-2">
                <Label>Selecione o Curso *</Label>
                <Select value={selectedCourseId} onValueChange={setSelectedCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um curso" />
                  </SelectTrigger>
                  <SelectContent>
                    {courses?.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        Nenhum curso disponível
                      </div>
                    ) : (
                      courses?.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4" />
                            <span>{course.title}</span>
                            {!course.is_published && (
                              <span className="text-muted-foreground text-xs">(Rascunho)</span>
                            )}
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending || !selectedPlatform}
            >
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Mapeamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
