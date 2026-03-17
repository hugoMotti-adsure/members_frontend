'use client'

import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Plus, GripVertical, Pencil, Trash2, Video, ChevronDown, ChevronRight, Eye, EyeOff, Users, Layers, Globe, Lock, Settings } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { CreateModuleDialog } from '@/features/courses/components/create-module-dialog'
import { EditModuleDialog } from '@/features/courses/components/edit-module-dialog'
import { CreateLessonDialog } from '@/features/courses/components/create-lesson-dialog'
import { EditLessonDialog } from '@/features/courses/components/edit-lesson-dialog'
import { DeleteConfirmDialog } from '@/features/courses/components/delete-confirm-dialog'
import { CourseEnrollments } from '@/features/courses/components/course-enrollments'
import { AdminGuard } from '@/components/auth/admin-guard'
import { cn } from '@/lib/utils'

interface Lesson {
  id: string
  title: string
  description?: string
  video_url?: string
  duration_minutes?: number
  is_published: boolean
  is_free: boolean
  order_index: number
}

interface Module {
  id: string
  title: string
  description?: string
  is_published: boolean
  order_index: number
  lessons: Lesson[]
}

interface Course {
  id: string
  tenant_id: string
  title: string
  description?: string
  thumbnail_url?: string
  is_published: boolean
  slug: string
  modules: Module[]
}

function CourseEditPageContent() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const courseId = params.id as string

  const [activeTab, setActiveTab] = useState<'content' | 'students'>('content')
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [createModuleOpen, setCreateModuleOpen] = useState(false)
  const [editModuleData, setEditModuleData] = useState<Module | null>(null)
  const [createLessonModuleId, setCreateLessonModuleId] = useState<string | null>(null)
  const [editLessonData, setEditLessonData] = useState<Lesson | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'module' | 'lesson', id: string, title: string } | null>(null)

  const { data: course, isLoading, refetch } = useQuery<Course>({
    queryKey: ['course', courseId],
    queryFn: async () => {
      const res = await api.get(`/courses/${courseId}`)
      return res.data
    },
  })

  // Mutation para publicar/despublicar curso
  const toggleCoursePublishMutation = useMutation({
    mutationFn: (publish: boolean) => 
      api.patch(`/courses/${courseId}`, { is_published: publish }),
    onSuccess: (_, publish) => {
      toast({ title: publish ? 'Curso publicado!' : 'Curso despublicado' })
      refetch()
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar curso', variant: 'destructive' })
    },
  })

  // Mutation para publicar/despublicar módulo
  const toggleModulePublishMutation = useMutation({
    mutationFn: ({ moduleId, publish }: { moduleId: string; publish: boolean }) =>
      api.patch(`/modules/${moduleId}`, { is_published: publish }),
    onSuccess: (_, { publish }) => {
      toast({ title: publish ? 'Módulo publicado!' : 'Módulo despublicado' })
      refetch()
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar módulo', variant: 'destructive' })
    },
  })

  // Mutation para publicar/despublicar aula
  const toggleLessonPublishMutation = useMutation({
    mutationFn: ({ lessonId, publish }: { lessonId: string; publish: boolean }) =>
      api.patch(`/lessons/${lessonId}`, { is_published: publish }),
    onSuccess: (_, { publish }) => {
      toast({ title: publish ? 'Aula publicada!' : 'Aula despublicada' })
      refetch()
    },
    onError: () => {
      toast({ title: 'Erro ao atualizar aula', variant: 'destructive' })
    },
  })

  const toggleModule = (moduleId: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleId)) {
        next.delete(moduleId)
      } else {
        next.add(moduleId)
      }
      return next
    })
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">Curso não encontrado</p>
      </div>
    )
  }

  const totalLessons = course.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">{course.title}</h1>
            <Badge variant={course.is_published ? 'default' : 'secondary'}>
              {course.is_published ? 'Publicado' : 'Rascunho'}
            </Badge>
          </div>
          <p className="text-zinc-400 text-sm mt-1">
            {course.modules?.length || 0} módulos • {totalLessons} aulas
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/courses/${courseId}/edit`)}
          >
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button
            variant={course.is_published ? 'outline' : 'default'}
            onClick={() => toggleCoursePublishMutation.mutate(!course.is_published)}
            disabled={toggleCoursePublishMutation.isPending}
          >
            {course.is_published ? (
              <>
                <Lock className="w-4 h-4 mr-2" />
                Despublicar
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Publicar Curso
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Course Thumbnail */}
      {course.thumbnail_url && (
        <div className="relative w-full max-w-md h-48 rounded-lg overflow-hidden">
          <img 
            src={course.thumbnail_url} 
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 border-b border-zinc-800">
        <button
          onClick={() => setActiveTab('content')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'content' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-zinc-400 hover:text-white'
          )}
        >
          <Layers className="w-4 h-4" />
          Conteúdo
        </button>
        <button
          onClick={() => setActiveTab('students')}
          className={cn(
            'flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px',
            activeTab === 'students' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-zinc-400 hover:text-white'
          )}
        >
          <Users className="w-4 h-4" />
          Alunos
        </button>
      </div>

      {/* Students Tab */}
      {activeTab === 'students' && (
        <CourseEnrollments courseId={courseId} />
      )}

      {/* Content Tab - Modules Section */}
      {activeTab === 'content' && (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Módulos</h2>
          <Button onClick={() => setCreateModuleOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Módulo
          </Button>
        </div>

        {course.modules?.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-700 rounded-lg">
            <Video className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
            <p className="text-zinc-400 mb-4">Nenhum módulo criado ainda</p>
            <Button variant="outline" onClick={() => setCreateModuleOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Criar Primeiro Módulo
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {course.modules?.map((module, index) => (
              <div 
                key={module.id} 
                className="border border-zinc-800 rounded-lg bg-zinc-900/50 overflow-hidden"
              >
                {/* Module Header */}
                <div 
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-zinc-800/50 transition-colors"
                  onClick={() => toggleModule(module.id)}
                >
                  <GripVertical className="w-5 h-5 text-zinc-600 cursor-grab" />
                  <button className="text-zinc-400 hover:text-white">
                    {expandedModules.has(module.id) ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-500">Módulo {index + 1}</span>
                      <h3 className="font-medium">{module.title}</h3>
                      {!module.is_published && (
                        <Badge variant="secondary" className="text-xs">Rascunho</Badge>
                      )}
                    </div>
                    <p className="text-sm text-zinc-500">
                      {module.lessons?.length || 0} aulas
                    </p>
                  </div>
                  <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="ghost"
                      size="icon"
                      title={module.is_published ? 'Despublicar módulo' : 'Publicar módulo'}
                      onClick={() => toggleModulePublishMutation.mutate({ 
                        moduleId: module.id, 
                        publish: !module.is_published 
                      })}
                    >
                      {module.is_published ? (
                        <Eye className="w-4 h-4 text-green-500" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-zinc-500" />
                      )}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setCreateLessonModuleId(module.id)}
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setEditModuleData(module)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => setDeleteTarget({ type: 'module', id: module.id, title: module.title })}
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </Button>
                  </div>
                </div>

                {/* Lessons */}
                {expandedModules.has(module.id) && (
                  <div className="border-t border-zinc-800">
                    {module.lessons?.length === 0 ? (
                      <div className="p-4 text-center text-zinc-500">
                        <p className="text-sm mb-2">Nenhuma aula neste módulo</p>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setCreateLessonModuleId(module.id)}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Adicionar Aula
                        </Button>
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-800">
                        {module.lessons?.map((lesson, lessonIndex) => (
                          <div 
                            key={lesson.id}
                            className="flex items-center gap-3 p-3 pl-14 hover:bg-zinc-800/30 transition-colors"
                          >
                            <GripVertical className="w-4 h-4 text-zinc-600 cursor-grab" />
                            <Video className="w-4 h-4 text-primary" />
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm">{lesson.title}</span>
                                {lesson.is_free && (
                                  <Badge variant="outline" className="text-xs">Grátis</Badge>
                                )}
                                {!lesson.is_published && (
                                  <EyeOff className="w-3 h-3 text-zinc-500" />
                                )}
                              </div>
                              {lesson.duration_minutes && (
                                <span className="text-xs text-zinc-500">
                                  {lesson.duration_minutes} min
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                title={lesson.is_published ? 'Despublicar aula' : 'Publicar aula'}
                                onClick={() => toggleLessonPublishMutation.mutate({
                                  lessonId: lesson.id,
                                  publish: !lesson.is_published
                                })}
                              >
                                {lesson.is_published ? (
                                  <Eye className="w-3 h-3 text-green-500" />
                                ) : (
                                  <EyeOff className="w-3 h-3 text-zinc-500" />
                                )}
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setEditLessonData(lesson)}
                              >
                                <Pencil className="w-3 h-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => setDeleteTarget({ type: 'lesson', id: lesson.id, title: lesson.title })}
                              >
                                <Trash2 className="w-3 h-3 text-red-400" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      {/* Dialogs */}
      <CreateModuleDialog 
        open={createModuleOpen}
        onOpenChange={setCreateModuleOpen}
        courseId={courseId}
        onSuccess={() => refetch()}
      />

      {editModuleData && (
        <EditModuleDialog 
          open={!!editModuleData}
          onOpenChange={() => setEditModuleData(null)}
          module={editModuleData}
          onSuccess={() => refetch()}
        />
      )}

      {createLessonModuleId && (
        <CreateLessonDialog 
          open={!!createLessonModuleId}
          onOpenChange={() => setCreateLessonModuleId(null)}
          moduleId={createLessonModuleId}
          onSuccess={() => refetch()}
        />
      )}

      {editLessonData && course && (
        <EditLessonDialog 
          open={!!editLessonData}
          onOpenChange={() => setEditLessonData(null)}
          lesson={editLessonData}
          tenantId={course.tenant_id}
          onSuccess={() => refetch()}
        />
      )}

      {deleteTarget && (
        <DeleteConfirmDialog
          open={!!deleteTarget}
          onOpenChange={() => setDeleteTarget(null)}
          type={deleteTarget.type}
          id={deleteTarget.id}
          title={deleteTarget.title}
          onSuccess={() => refetch()}
        />
      )}
    </div>
  )
}

export default function CourseEditPage() {
  return (
    <AdminGuard>
      <CourseEditPageContent />
    </AdminGuard>
  )
}
