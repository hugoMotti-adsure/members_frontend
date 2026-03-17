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
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/components/ui/use-toast'
import { Loader2, FileText, FileSpreadsheet, File } from 'lucide-react'
import { useAuthStore } from '@/features/auth/stores/auth.store'

interface CreateOfferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface FormData {
  name: string
  description: string
  access_days: string
  course_ids: string[]
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

export function CreateOfferDialog({ open, onOpenChange }: CreateOfferDialogProps) {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const user = useAuthStore((state) => state.user)
  const [selectedCourses, setSelectedCourses] = useState<string[]>([])
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([])

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      name: '',
      description: '',
      access_days: '',
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

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/offers', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] })
      toast({ title: 'Entrega criada com sucesso' })
      reset()
      setSelectedCourses([])
      setSelectedMaterials([])
      onOpenChange(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao criar entrega',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: FormData) => {
    createMutation.mutate({
      name: data.name,
      description: data.description || null,
      access_days: data.access_days && data.access_days !== 'lifetime' ? parseInt(data.access_days) : null,
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
            <DialogTitle>Nova Entrega</DialogTitle>
            <DialogDescription>
              Crie uma entrega para agrupar cursos que serão liberados juntos
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
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
                onValueChange={(value) => {
                  const input = document.getElementById('access_days') as HTMLInputElement
                  if (input) input.value = value
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
              <input type="hidden" id="access_days" {...register('access_days')} />
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
                        id={`course-${course.id}`}
                        checked={selectedCourses.includes(course.id)}
                        onCheckedChange={() => toggleCourse(course.id)}
                      />
                      <label
                        htmlFor={`course-${course.id}`}
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
                        id={`material-${material.id}`}
                        checked={selectedMaterials.includes(material.id)}
                        onCheckedChange={() => toggleMaterial(material.id)}
                      />
                      <span className="flex-shrink-0">{getFileIcon(material.file_type)}</span>
                      <label
                        htmlFor={`material-${material.id}`}
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
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Criar Entrega
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
