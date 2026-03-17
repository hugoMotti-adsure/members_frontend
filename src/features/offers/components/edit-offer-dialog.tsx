'use client'

import { useState, useEffect } from 'react'
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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, FileText, FileSpreadsheet, File } from 'lucide-react'
import { useAuthStore } from '@/features/auth/stores/auth.store'

interface Offer {
  id: string
  name: string
  description: string | null
  access_days: number | null
  is_active: boolean
  courses: Array<{ id: string; title: string }>
  materials?: Array<{ id: string; title: string; file_type: string }>
}

interface EditOfferDialogProps {
  offer: Offer
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormData {
  name: string
  description: string
  access_days: string
  is_active: boolean
}

interface Course {
  id: string
  title: string
  is_published: boolean
}

interface GlobalMaterial {
  id: string
  title: string
  file_type: string
  is_published: boolean
}

const fileTypeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="w-4 h-4 text-red-500" />,
  doc: <FileText className="w-4 h-4 text-blue-500" />,
  xls: <FileSpreadsheet className="w-4 h-4 text-green-500" />,
  csv: <FileSpreadsheet className="w-4 h-4 text-green-400" />,
  link: <File className="w-4 h-4 text-cyan-500" />,
}

export function EditOfferDialog({ offer, open, onOpenChange }: EditOfferDialogProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const user = useAuthStore((state) => state.user)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])
  const [isActive, setIsActive] = useState(offer.is_active)

  const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: offer.name,
      description: offer.description || '',
      access_days: offer.access_days?.toString() || '',
      is_active: offer.is_active,
    },
  })

  const { data: courses } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses').then((res) => res.data),
    enabled: open,
  })

  const { data: materials } = useQuery<GlobalMaterial[]>({
    queryKey: ['global-materials', user?.tenant_id],
    queryFn: () => api.get(`/global-materials/tenant/${user?.tenant_id}?includeUnpublished=true`).then((res) => res.data),
    enabled: open && !!user?.tenant_id,
  })

  useEffect(() => {
    if (open && offer) {
      reset({
        name: offer.name,
        description: offer.description || '',
        access_days: offer.access_days?.toString() || '',
        is_active: offer.is_active,
      })
      setSelectedCourses(offer.courses.map((c) => c.id))
      setSelectedMaterials(offer.materials?.map((m) => m.id) || [])
      setIsActive(offer.is_active)
    }
  }, [open, offer, reset])

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.patch(`/offers/${offer.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      toast({ title: 'Entrega atualizada com sucesso' })
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar entrega',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: FormData) => {
    updateMutation.mutate({
      name: data.name,
      description: data.description || null,
      access_days: data.access_days && data.access_days !== 'lifetime' ? parseInt(data.access_days) : null,
      is_active: isActive,
      course_ids: selectedCourses,
      material_ids: selectedMaterials,
    })
  }

  const toggleCourse = (courseId: string) => {
    setSelectedCourses((prev) =>
      prev.includes(courseId)
        ? prev.filter((id) => id !== courseId)
        : [...prev, courseId]
    )
  }

  const toggleMaterial = (materialId: string) => {
    setSelectedMaterials((prev) =>
      prev.includes(materialId)
        ? prev.filter((id) => id !== materialId)
        : [...prev, materialId]
    )
  }

  const getFileIcon = (fileType: string) => {
    return fileTypeIcons[fileType] || <File className="w-4 h-4 text-zinc-500" />
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogHeader>
            <DialogTitle>Editar Entrega</DialogTitle>
            <DialogDescription>
              Atualize as informações da entrega e os cursos incluídos
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div>
                <Label htmlFor="is_active" className="font-medium">Status da Entrega</Label>
                <p className="text-xs text-muted-foreground">
                  Entregas inativas não serão processadas nos webhooks
                </p>
              </div>
              <Switch
                id="is_active"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nome da Entrega *</Label>
              <Input
                id="name"
                placeholder="Ex: Pacote Premium"
                {...register('name', { required: 'Nome é obrigatório' })}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva o que está incluído nesta entrega"
                {...register('description')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="access_days">Prazo de Acesso</Label>
              <Select
                value={offer.access_days?.toString() || 'lifetime'}
                onValueChange={(value) => {
                  setValue('access_days', value)
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o prazo de acesso" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lifetime">Vitalício (sem prazo)</SelectItem>
                  <SelectItem value="30">1 mês (30 dias)</SelectItem>
                  <SelectItem value="90">3 meses (90 dias)</SelectItem>
                  <SelectItem value="180">6 meses (180 dias)</SelectItem>
                  <SelectItem value="365">1 ano (365 dias)</SelectItem>
                  <SelectItem value="730">2 anos (730 dias)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Após esse período, o acesso aos cursos será expirado automaticamente
              </p>
            </div>

            <div className="space-y-2">
              <Label>Cursos Incluídos</Label>
              <div className="border rounded-lg p-4 space-y-3 max-h-[200px] overflow-y-auto">
                {courses?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Nenhum curso disponível
                  </p>
                ) : (
                  courses?.map((course) => (
                    <div key={course.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`edit-course-${course.id}`}
                        checked={selectedCourses.includes(course.id)}
                        onCheckedChange={() => toggleCourse(course.id)}
                      />
                      <label
                        htmlFor={`edit-course-${course.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {course.title}
                        {!course.is_published && (
                          <span className="ml-2 text-xs text-muted-foreground">(Rascunho)</span>
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>
              {selectedCourses.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedCourses.length} curso{selectedCourses.length !== 1 ? 's' : ''} selecionado{selectedCourses.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Materiais Incluídos</Label>
              <div className="border rounded-lg p-4 space-y-3 max-h-[200px] overflow-y-auto">
                {materials?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-2">
                    Nenhum material disponível
                  </p>
                ) : (
                  materials?.map((material) => (
                    <div key={material.id} className="flex items-center space-x-3">
                      <Checkbox
                        id={`edit-material-${material.id}`}
                        checked={selectedMaterials.includes(material.id)}
                        onCheckedChange={() => toggleMaterial(material.id)}
                      />
                      <span className="flex-shrink-0">{getFileIcon(material.file_type)}</span>
                      <label
                        htmlFor={`edit-material-${material.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                      >
                        {material.title}
                        {!material.is_published && (
                          <span className="ml-2 text-xs text-muted-foreground">(Rascunho)</span>
                        )}
                      </label>
                    </div>
                  ))
                )}
              </div>
              {selectedMaterials.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedMaterials.length} material{selectedMaterials.length !== 1 ? 'is' : ''} selecionado{selectedMaterials.length !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
