'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  Link2, 
  LayoutGrid, 
  ListOrdered,
  Sparkles,
  Image as ImageIcon,
  FileText,
  Settings2,
  ChevronRight
} from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/components/ui/use-toast'
import { ImageUpload } from '@/components/ui/image-upload'
import { DisplayMode } from '@/features/courses/types'
import { AdminGuard } from '@/components/auth/admin-guard'
import { cn } from '@/lib/utils'

const PLATFORMS = [
  { value: 'greenn', label: 'Greenn', color: 'bg-green-500' },
  { value: 'hotmart', label: 'Hotmart', color: 'bg-orange-500' },
  { value: 'kiwify', label: 'Kiwify', color: 'bg-blue-500' },
  { value: 'lightforms', label: 'Lightforms', color: 'bg-purple-500' },
  { value: 'eduzz', label: 'Eduzz', color: 'bg-cyan-500' },
  { value: 'monetizze', label: 'Monetizze', color: 'bg-red-500' },
]

const editCourseSchema = z.object({
  title: z.string().min(3, 'O título deve ter no mínimo 3 caracteres'),
  slug: z
    .string()
    .min(3, 'O slug deve ter no mínimo 3 caracteres')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug inválido. Use apenas letras minúsculas, números e hífens'),
  description: z.string().optional(),
  thumbnail_url: z.string().optional(),
  small_thumbnail_url: z.string().optional(),
  display_mode: z.enum(['default', 'netflix']).optional(),
  platform: z.string().optional(),
  external_product_id: z.string().optional(),
})

type EditCourseForm = z.infer<typeof editCourseSchema>

interface Course {
  id: string
  title: string
  slug: string
  description?: string
  thumbnail_url?: string
  small_thumbnail_url?: string
  display_mode?: DisplayMode
  is_published: boolean
}

function EditCoursePageContent() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const courseId = params.id as string
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [smallThumbnailUrl, setSmallThumbnailUrl] = useState<string | null>(null)

  // Busca dados do curso
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await api.get(`/courses/${courseId}`)
      return res.data
    },
  })

  // Busca mapeamentos existentes para este curso
  const { data: mappings } = useQuery({
    queryKey: ['product-mappings', courseId],
    queryFn: () => api.get('/webhooks/mappings').then(res => res.data),
    enabled: !!courseId,
  })

  // Encontra o mapeamento para este curso (se existir)
  const existingMapping = mappings?.find((m: any) => m.course_id === courseId)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<EditCourseForm>({
    resolver: zodResolver(editCourseSchema),
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      thumbnail_url: '',
      small_thumbnail_url: '',
      display_mode: 'default',
      platform: '',
      external_product_id: '',
    },
  })

  // Reset form quando carregar o curso
  useEffect(() => {
    if (course) {
      reset({
        title: course.title,
        slug: course.slug,
        description: course.description || '',
        thumbnail_url: course.thumbnail_url || '',
        small_thumbnail_url: course.small_thumbnail_url || '',
        display_mode: course.display_mode || 'default',
        platform: existingMapping?.platform || '',
        external_product_id: existingMapping?.external_product_id || '',
      })
      setThumbnailUrl(course.thumbnail_url || null)
      setSmallThumbnailUrl(course.small_thumbnail_url || null)
    }
  }, [course, reset, existingMapping])

  const title = watch('title')
  const displayMode = watch('display_mode')
  const platform = watch('platform')

  // Gera slug automaticamente
  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  const updateMutation = useMutation({
    mutationFn: async (data: EditCourseForm) => {
      const { platform, external_product_id, ...courseData } = data
      await api.patch(`/courses/${courseId}`, courseData)

      if (platform && external_product_id) {
        if (existingMapping && existingMapping.external_product_id !== external_product_id) {
          await api.delete(`/webhooks/mappings/${existingMapping.id}`)
        }
        
        if (!existingMapping || existingMapping.external_product_id !== external_product_id) {
          await api.post('/webhooks/mappings', {
            platform,
            external_product_id,
            course_id: courseId,
            product_name: data.title,
          })
        }
      } else if (existingMapping && !external_product_id) {
        await api.delete(`/webhooks/mappings/${existingMapping.id}`)
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course', courseId] })
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      queryClient.invalidateQueries({ queryKey: ['product-mappings'] })
      toast({ title: 'Curso atualizado com sucesso!' })
      router.push(`/courses/${courseId}`)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar curso',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: EditCourseForm) => {
    updateMutation.mutate(data)
  }

  // Atualiza o form quando fizer upload da imagem
  const handleThumbnailChange = (url: string | null) => {
    setThumbnailUrl(url)
    setValue('thumbnail_url', url || '', { shouldDirty: true })
  }

  // Atualiza o form quando fizer upload da miniatura
  const handleSmallThumbnailChange = (url: string | null) => {
    setSmallThumbnailUrl(url)
    setValue('small_thumbnail_url', url || '', { shouldDirty: true })
  }

  if (courseLoading) {
    return (
      <div className="flex items-center justify-center min-h-[600px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-zinc-400">Carregando curso...</p>
        </div>
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] gap-4">
        <p className="text-zinc-400">Curso não encontrado</p>
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header com Breadcrumb */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push(`/courses/${courseId}`)}
                className="hover:bg-zinc-800"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div className="flex items-center gap-2 text-sm text-zinc-400">
                <span 
                  className="hover:text-white cursor-pointer transition-colors"
                  onClick={() => router.push('/courses')}
                >
                  Cursos
                </span>
                <ChevronRight className="w-4 h-4" />
                <span 
                  className="hover:text-white cursor-pointer transition-colors"
                  onClick={() => router.push(`/courses/${courseId}`)}
                >
                  {course.title}
                </span>
                <ChevronRight className="w-4 h-4" />
                <span className="text-white font-medium">Editar</span>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={() => router.push(`/courses/${courseId}`)}
              >
                Cancelar
              </Button>
              <Button 
                onClick={handleSubmit(onSubmit)}
                disabled={updateMutation.isPending || !isDirty}
                className="bg-primary hover:bg-primary/90"
              >
                {updateMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Grid de duas colunas */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Coluna Principal */}
            <div className="lg:col-span-2 space-y-6">
              {/* Informações Básicas */}
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Informações Básicas</CardTitle>
                      <CardDescription>Título, URL e descrição do curso</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-5">
                  {/* Título */}
                  <div className="space-y-2">
                    <Label htmlFor="title" className="text-sm font-medium">
                      Título do Curso
                    </Label>
                    <Input 
                      id="title" 
                      {...register('title')} 
                      placeholder="Ex: Curso Completo de React"
                      className="bg-zinc-800/50 border-zinc-700 focus:border-primary"
                    />
                    {errors.title && (
                      <p className="text-sm text-red-400">{errors.title.message}</p>
                    )}
                  </div>

                  {/* Slug */}
                  <div className="space-y-2">
                    <Label htmlFor="slug" className="text-sm font-medium">
                      URL do Curso (slug)
                    </Label>
                    <div className="flex gap-2">
                      <div className="flex items-center px-3 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-zinc-400">
                        /course/
                      </div>
                      <Input 
                        id="slug" 
                        {...register('slug')} 
                        className="flex-1 bg-zinc-800/50 border-zinc-700 focus:border-primary"
                        placeholder="meu-curso"
                      />
                    </div>
                    {errors.slug && (
                      <p className="text-sm text-red-400">{errors.slug.message}</p>
                    )}
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-zinc-500">
                        Use apenas letras minúsculas, números e hífens
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setValue('slug', generateSlug(title), { shouldDirty: true })}
                        className="h-6 px-2 text-xs text-primary hover:text-primary/80"
                      >
                        <Sparkles className="w-3 h-3 mr-1" />
                        Gerar do título
                      </Button>
                    </div>
                  </div>

                  {/* Descrição */}
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">
                      Descrição
                      <span className="text-zinc-500 font-normal ml-1">(opcional)</span>
                    </Label>
                    <textarea
                      id="description"
                      {...register('description')}
                      rows={4}
                      className="flex w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm ring-offset-background placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      placeholder="Descreva o conteúdo do curso, o que o aluno vai aprender..."
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Modo de Exibição */}
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Settings2 className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Modo de Exibição</CardTitle>
                      <CardDescription>Como o conteúdo será apresentado aos alunos</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Modo Padrão */}
                    <button
                      type="button"
                      onClick={() => setValue('display_mode', 'default', { shouldDirty: true })}
                      className={cn(
                        'relative p-4 rounded-xl border-2 transition-all text-left group',
                        displayMode === 'default'
                          ? 'border-primary bg-primary/10'
                          : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/30'
                      )}
                    >
                      <div className={cn(
                        'absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center',
                        displayMode === 'default'
                          ? 'border-primary bg-primary'
                          : 'border-zinc-600'
                      )}>
                        {displayMode === 'default' && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      
                      <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-700 transition-colors">
                        <ListOrdered className="w-6 h-6 text-zinc-400" />
                      </div>
                      <h4 className="font-semibold mb-1">Padrão</h4>
                      <p className="text-sm text-zinc-400">
                        Lista de aulas organizadas por módulo. Ideal para cursos sequenciais.
                      </p>
                    </button>

                    {/* Modo Netflix */}
                    <button
                      type="button"
                      onClick={() => setValue('display_mode', 'netflix', { shouldDirty: true })}
                      className={cn(
                        'relative p-4 rounded-xl border-2 transition-all text-left group',
                        displayMode === 'netflix'
                          ? 'border-primary bg-primary/10'
                          : 'border-zinc-700 hover:border-zinc-600 bg-zinc-800/30'
                      )}
                    >
                      <div className={cn(
                        'absolute top-3 right-3 w-5 h-5 rounded-full border-2 transition-all flex items-center justify-center',
                        displayMode === 'netflix'
                          ? 'border-primary bg-primary'
                          : 'border-zinc-600'
                      )}>
                        {displayMode === 'netflix' && (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )}
                      </div>
                      
                      <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center mb-3 group-hover:bg-zinc-700 transition-colors">
                        <LayoutGrid className="w-6 h-6 text-zinc-400" />
                      </div>
                      <h4 className="font-semibold mb-1">Netflix</h4>
                      <p className="text-sm text-zinc-400">
                        Grid visual com capas dos módulos. Experiência moderna e interativa.
                      </p>
                    </button>
                  </div>

                  {displayMode === 'netflix' && (
                    <div className="mt-4 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <p className="text-sm text-amber-400 flex items-center gap-2">
                        <span className="text-amber-500">💡</span>
                        Configure capas nos módulos para melhor visualização no modo Netflix
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Integração com Plataforma */}
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                      <Link2 className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Integração com Plataforma de Vendas</CardTitle>
                      <CardDescription>
                        Configure para liberar acesso automático quando alguém comprar o produto
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="platform" className="text-sm font-medium">
                        Plataforma
                      </Label>
                      <select
                        id="platform"
                        {...register('platform')}
                        className="flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      >
                        <option value="">Selecione uma plataforma</option>
                        {PLATFORMS.map((p) => (
                          <option key={p.value} value={p.value}>
                            {p.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="external_product_id" className="text-sm font-medium">
                        ID do Produto
                      </Label>
                      <Input
                        id="external_product_id"
                        placeholder="Ex: 138334"
                        {...register('external_product_id')}
                        disabled={!platform}
                        className="bg-zinc-800/50 border-zinc-700 focus:border-primary"
                      />
                    </div>
                  </div>

                  {existingMapping && (
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className={cn(
                        'w-2 h-2 rounded-full',
                        PLATFORMS.find(p => p.value === existingMapping.platform)?.color || 'bg-green-500'
                      )} />
                      <p className="text-sm text-green-400">
                        Integração ativa: {existingMapping.platform} #{existingMapping.external_product_id}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar - Thumbnails */}
            <div className="space-y-6">
              {/* Capa do Curso */}
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-pink-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Capa do Curso</CardTitle>
                      <CardDescription>Imagem de destaque</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ImageUpload
                    value={thumbnailUrl}
                    onChange={handleThumbnailChange}
                    folder="thumbnails"
                    aspectRatio="video"
                  />
                  <p className="text-xs text-zinc-500 text-center">
                    Recomendado: 1280x720 (16:9)
                  </p>
                </CardContent>
              </Card>

              {/* Miniatura */}
              <Card className="border-zinc-800 bg-zinc-900/50">
                <CardHeader className="pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                      <ImageIcon className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">Miniatura</CardTitle>
                      <CardDescription>Ícone pequeno do curso</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ImageUpload
                    value={smallThumbnailUrl}
                    onChange={handleSmallThumbnailChange}
                    folder="thumbnails"
                    aspectRatio="square"
                  />
                  <p className="text-xs text-zinc-500 text-center">
                    Recomendado: 200x200 (1:1)
                  </p>
                  <p className="text-xs text-zinc-400 text-center">
                    Exibida no header do player e listagens
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function EditCoursePage() {
  return (
    <AdminGuard>
      <EditCoursePageContent />
    </AdminGuard>
  )
}
