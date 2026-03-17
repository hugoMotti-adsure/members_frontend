'use client'

import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, CheckCircle, Clock, Play, ChevronDown, ChevronRight, Grid, List, PlayCircle, Star, Menu, FileText, MessageCircle, Download, Link as LinkIcon, Send, ThumbsUp, Loader2 } from 'lucide-react'
import { VideoPlayer } from '@/components/video-player'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { DisplayMode } from '@/features/courses/types'
import { useToast } from '@/components/ui/use-toast'

interface Lesson {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
  video_url?: string
  duration_minutes?: number
  is_published: boolean
  is_free: boolean
  order_index: number
  banner_url?: string
  banner_link?: string
}

interface Module {
  id: string
  title: string
  description?: string
  thumbnail_url?: string
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
  small_thumbnail_url?: string
  display_mode?: DisplayMode
  is_published: boolean
  slug: string
  modules: Module[]
}

interface Material {
  id: string
  title: string
  description?: string
  file_url: string
  file_type: string
  file_size?: number
  is_downloadable: boolean
}

interface Transcript {
  id: string
  content: string
  language: string
  is_auto_generated: boolean
}

interface Comment {
  id: string
  content: string
  user: {
    id: string
    name: string
    avatar_url?: string
    role: string
  }
  parent_id?: string
  is_pinned: boolean
  is_highlighted: boolean
  likes_count: number
  created_at: string
  replies?: Comment[]
}

interface Announcement {
  id: string
  title?: string | null
  image_url?: string | null
  description?: string | null
  link?: string | null
  badge_text?: string | null
  is_active: boolean
}

interface WatchCourseClientProps {
  slug: string
}

// Helper para formatar duração em HH:MM:SS
const formatDuration = (minutes?: number): string => {
  if (!minutes) return '00:00:00'
  const hours = Math.floor(minutes / 60)
  const mins = Math.floor(minutes % 60)
  const secs = 0 // Assumindo que não temos segundos
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

// Helper para converter links em texto clicável
const linkifyText = (text: string): React.ReactNode => {
  // Regex para detectar URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g
  const parts = text.split(urlRegex)
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary hover:underline break-all"
        >
          {part}
        </a>
      )
    }
    return part
  })
}

// Helper para calcular duração total de um módulo
const getModuleDuration = (lessons: Lesson[]): number => {
  return lessons?.reduce((acc, l) => acc + (l.duration_minutes || 0), 0) || 0
}

export function WatchCourseClient({ slug }: WatchCourseClientProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set())
  const [currentLessonId, setCurrentLessonId] = useState<string | null>(null)
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'content' | 'materials' | 'transcript' | 'comments'>('content')
  const [newComment, setNewComment] = useState('')
  const [hasInitialized, setHasInitialized] = useState(false) // Controla se já fez a seleção inicial
  const [lastLessonByModule, setLastLessonByModule] = useState<Record<string, string>>({}) // Última aula por módulo (sessão)
  const [lessonRatings, setLessonRatings] = useState<Record<string, number>>({}) // Avaliações das aulas
  const [localCompletedLessons, setLocalCompletedLessons] = useState<Set<string>>(new Set()) // Aulas marcadas localmente
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false) // Controla se a sidebar está colapsada

  // Busca o curso pelo slug
  const { data: course, isLoading: loadingCourse } = useQuery<Course>({
    queryKey: ['course-watch', slug],
    queryFn: () => api.get(`/courses/slug/${slug}`).then((res) => res.data),
  })

  // Busca o progresso do usuário neste curso
  const { data: progressData } = useQuery({
    queryKey: ['course-progress', course?.id],
    queryFn: () => api.get(`/progress/course/${course?.id}`).then((res) => res.data),
    enabled: !!course?.id,
  })

  // Busca a aula atual
  const { data: currentLesson } = useQuery({
    queryKey: ['lesson', currentLessonId],
    queryFn: () => api.get(`/lessons/${currentLessonId}/watch`).then((res) => res.data),
    enabled: !!currentLessonId,
  })

  // Busca anúncios globais ativos
  const { data: globalAnnouncements = [] } = useQuery<Announcement[]>({
    queryKey: ['global-announcements', course?.tenant_id],
    queryFn: () => api.get('/announcements/active').then((res) => res.data),
    enabled: !!course?.tenant_id,
  })

  // Mutation para marcar aula como concluída
  const completeLessonMutation = useMutation({
    mutationFn: (lessonId: string) => api.post(`/progress/lesson/${lessonId}/complete`),
    onMutate: async (lessonId: string) => {
      // Atualiza estado local imediatamente
      setLocalCompletedLessons(prev => new Set([...prev, lessonId]))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['course-progress', course?.id] })
      toast({
        title: 'Aula marcada como assistida!',
        description: 'Seu progresso foi salvo.',
      })
    },
    onError: (error: any, lessonId) => {
      // Remove do estado local em caso de erro
      setLocalCompletedLessons(prev => {
        const next = new Set(prev)
        next.delete(lessonId)
        return next
      })
      console.error('Erro ao marcar aula como completa:', error)
      toast({
        title: 'Erro ao marcar aula',
        description: error.response?.data?.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    },
  })

  // Mutation para avaliar aula
  const rateLessonMutation = useMutation({
    mutationFn: ({ lessonId, rating }: { lessonId: string; rating: number }) => 
      api.post(`/progress/lesson/${lessonId}/rate`, { rating }),
    onMutate: async ({ lessonId, rating }) => {
      // Atualiza estado local imediatamente
      setLessonRatings(prev => ({ ...prev, [lessonId]: rating }))
    },
    onSuccess: () => {
      toast({
        title: 'Obrigado pela avaliação!',
        description: 'Sua avaliação foi salva.',
      })
    },
    onError: (error: any, { lessonId }) => {
      // Remove do estado local em caso de erro
      setLessonRatings(prev => {
        const next = { ...prev }
        delete next[lessonId]
        return next
      })
      toast({
        title: 'Erro ao avaliar',
        description: error.response?.data?.message || 'Tente novamente mais tarde.',
        variant: 'destructive',
      })
    },
  })

  // Função para avaliar aula
  const rateLesson = (lessonId: string, rating: number) => {
    rateLessonMutation.mutate({ lessonId, rating })
  }

  // Mutation para registrar acesso à aula (atualiza updated_at no progresso)
  const trackLessonAccessMutation = useMutation({
    mutationFn: (lessonId: string) => api.post(`/progress/lesson/${lessonId}`, { watched_seconds: 0 }),
  })

  // Inicializa ratings do backend quando progressData carregar
  useEffect(() => {
    if (progressData?.lessonRatings) {
      setLessonRatings(prev => ({ ...progressData.lessonRatings, ...prev }))
    }
  }, [progressData?.lessonRatings])

  // Registra acesso quando o aluno seleciona uma aula e guarda no estado local
  useEffect(() => {
    if (currentLessonId && selectedModuleId) {
      trackLessonAccessMutation.mutate(currentLessonId)
      // Guarda a última aula selecionada por módulo (para navegação na sessão)
      setLastLessonByModule(prev => ({ ...prev, [selectedModuleId]: currentLessonId }))
    }
  }, [currentLessonId, selectedModuleId])

  // Busca materiais da aula atual
  const { data: materials = [], isLoading: loadingMaterials } = useQuery<Material[]>({
    queryKey: ['lesson-materials', currentLessonId],
    queryFn: () => api.get(`/materials/lesson/${currentLessonId}`).then((res) => res.data),
    enabled: !!currentLessonId && activeTab === 'materials',
  })

  // Busca transcrição da aula atual
  const { data: transcript, isLoading: loadingTranscript } = useQuery<Transcript>({
    queryKey: ['lesson-transcript', currentLessonId],
    queryFn: () => api.get(`/transcripts/lesson/${currentLessonId}?language=pt-BR`).then((res) => res.data),
    enabled: !!currentLessonId && activeTab === 'transcript',
  })

  // Busca comentários da aula atual
  const { data: commentsData, isLoading: loadingComments } = useQuery<{ data: Comment[], pagination: any }>({
    queryKey: ['lesson-comments', currentLessonId, course?.tenant_id],
    queryFn: () => api.get(`/comments/lesson/${currentLessonId}?tenantId=${course?.tenant_id}`).then((res) => res.data),
    enabled: !!currentLessonId && !!course?.tenant_id && activeTab === 'comments',
  })

  // Mutation para adicionar comentário
  const addCommentMutation = useMutation({
    mutationFn: (content: string) => api.post('/comments', {
      lesson_id: currentLessonId,
      tenant_id: course?.tenant_id,
      content,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-comments', currentLessonId, course?.tenant_id] })
      setNewComment('')
    },
  })

  // Mutation para dar like
  const likeMutation = useMutation({
    mutationFn: (commentId: string) => api.post(`/comments/${commentId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['lesson-comments', currentLessonId, course?.tenant_id] })
    },
  })

  // Define a aula inicial: retoma de onde parou ou primeira aula (apenas na inicialização)
  useEffect(() => {
    if (course && !hasInitialized) {
      // Verifica se existe uma última aula assistida no progresso
      if (progressData?.lastWatchedLesson) {
        const { lessonId, moduleId } = progressData.lastWatchedLesson
        setCurrentLessonId(lessonId)
        setSelectedModuleId(moduleId) // Para modo Netflix
        setExpandedModules(new Set([moduleId]))
        // Inicializa o estado local com a última aula do backend
        setLastLessonByModule(prev => ({ ...prev, [moduleId]: lessonId }))
        setHasInitialized(true)
        return
      }

      // No modo Netflix, não seleciona automaticamente uma aula se não há progresso
      if (course.display_mode === 'netflix') {
        setHasInitialized(true)
        return
      }

      // Fallback: primeira aula do primeiro módulo
      const firstModule = course.modules?.[0]
      const firstLesson = firstModule?.lessons?.[0]
      if (firstLesson) {
        setCurrentLessonId(firstLesson.id)
        setExpandedModules(new Set([firstModule.id]))
      }
      setHasInitialized(true)
    }
  }, [course, progressData, hasInitialized])

  // Módulo selecionado (para modo Netflix)
  const selectedModule = course?.modules?.find(m => m.id === selectedModuleId)

  // Função para selecionar módulo (modo Netflix) - seleciona a última aula assistida ou primeira não completada
  const selectModule = (moduleId: string) => {
    setSelectedModuleId(moduleId)
    setExpandedModules(new Set([moduleId]))
    
    // 1. Primeiro verifica se tem última aula guardada na sessão atual
    if (lastLessonByModule[moduleId]) {
      setCurrentLessonId(lastLessonByModule[moduleId])
      return
    }
    
    // 2. Verifica se a última aula assistida (do backend) é deste módulo
    if (progressData?.lastWatchedLesson?.moduleId === moduleId) {
      setCurrentLessonId(progressData.lastWatchedLesson.lessonId)
      return
    }
    
    // Busca o módulo e suas aulas
    const module = course?.modules?.find(m => m.id === moduleId)
    if (!module?.lessons?.length) {
      setCurrentLessonId(null)
      return
    }
    
    // 3. Tenta encontrar a primeira aula não completada do módulo
    const progressModuleData = progressData?.modules?.find((m: any) => m.id === moduleId)
    if (progressModuleData?.lessons) {
      const firstIncomplete = progressModuleData.lessons.find((l: any) => !l.progress?.is_completed)
      if (firstIncomplete) {
        setCurrentLessonId(firstIncomplete.id)
        return
      }
    }
    
    // 4. Fallback: primeira aula do módulo
    setCurrentLessonId(module.lessons[0].id)
  }

  // Voltar para grid de módulos (modo Netflix)
  const backToModules = () => {
    setSelectedModuleId(null)
    setCurrentLessonId(null)
  }

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

  const isLessonCompleted = (lessonId: string) => {
    return localCompletedLessons.has(lessonId) || progressData?.completedLessons?.includes(lessonId)
  }

  const selectLesson = (lesson: Lesson, moduleId: string) => {
    setCurrentLessonId(lesson.id)
    setExpandedModules(prev => new Set([...prev, moduleId]))
  }

  // Calcula progresso
  const totalLessons = course?.modules?.reduce((acc, m) => acc + (m.lessons?.length || 0), 0) || 0
  const completedLessons = progressData?.completedLessons?.length || 0
  const progressPercentage = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  if (loadingCourse) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    )
  }

  if (!course) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <p className="text-zinc-400">Curso não encontrado</p>
        <Button variant="outline" onClick={() => router.back()}>
          Voltar
        </Button>
      </div>
    )
  }

  // ========== MODO NETFLIX ==========
  if (course.display_mode === 'netflix') {
    // Encontra o índice do módulo atual e próximo módulo
    const netflixModuleIndex = course.modules?.findIndex(m => m.id === selectedModuleId) ?? -1
    const netflixNextModule = netflixModuleIndex >= 0 ? course.modules?.[netflixModuleIndex + 1] : null

    // Exibe grid de módulos ou aulas do módulo selecionado
    if (selectedModuleId && selectedModule) {
      // Dentro de um módulo - mostra player e lista de aulas
      return (
        <div className="flex flex-col h-full">
          {/* Header com Breadcrumb e Tabs */}
          <header className="h-12 flex items-center bg-zinc-900 border-b border-zinc-800 flex-shrink-0">
            {/* Breadcrumb e Autoplay */}
            <div className="flex-1 px-4 flex items-center justify-between min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <button 
                  onClick={backToModules}
                  className="p-1 hover:bg-zinc-800 rounded transition-colors flex-shrink-0"
                >
                  <ArrowLeft className="w-5 h-5 text-zinc-400" />
                </button>
                <div className="flex items-center gap-2 min-w-0 text-sm">
                  <span className="text-white font-medium truncate max-w-[200px]">{course.title}</span>
                  <span className="text-zinc-600 flex-shrink-0">/</span>
                  <span className="text-zinc-400 truncate max-w-[180px]">{selectedModule.title}</span>
                  {currentLesson && (
                    <>
                      <span className="text-zinc-600 flex-shrink-0">–</span>
                      <span className="text-zinc-300 truncate max-w-[250px]">{currentLesson.title}</span>
                    </>
                  )}
                </div>
              </div>
              {currentLessonId && (
                <button
                  onClick={() => !isLessonCompleted(currentLessonId) && completeLessonMutation.mutate(currentLessonId)}
                  disabled={completeLessonMutation.isPending || isLessonCompleted(currentLessonId)}
                  className={cn(
                    "flex items-center gap-2 flex-shrink-0",
                    isLessonCompleted(currentLessonId) ? "cursor-default" : "cursor-pointer hover:opacity-80"
                  )}
                >
                  <span className={cn(
                    "text-sm transition-colors",
                    isLessonCompleted(currentLessonId) ? "text-green-500" : "text-zinc-400"
                  )}>
                    Aula concluída
                  </span>
                  <div className={cn(
                    "w-10 h-5 rounded-full relative transition-colors",
                    isLessonCompleted(currentLessonId) ? "bg-green-500" : "bg-zinc-700"
                  )}>
                    <span className={cn(
                      "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                      isLessonCompleted(currentLessonId) ? "right-0.5" : "left-0.5"
                    )} />
                  </div>
                </button>
              )}
            </div>

            {/* Tabs de Navegação (no header) */}
            <div className={cn(
              "h-full flex items-center border-l border-zinc-800 bg-zinc-950 flex-shrink-0 transition-all duration-300",
              sidebarCollapsed ? "w-12 justify-center" : "w-80 justify-around"
            )}>
              {sidebarCollapsed ? (
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="p-2 hover:bg-zinc-800 rounded transition-colors"
                  title="Expandir sidebar"
                >
                  <Menu className="w-5 h-5 text-zinc-400" />
                </button>
              ) : (
                <>
                  <button
                    onClick={() => setActiveTab('content')}
                    className={cn(
                      'flex-1 h-full flex items-center justify-center transition-colors border-b-2',
                      activeTab === 'content' ? 'text-primary border-primary' : 'text-zinc-500 hover:text-zinc-300 border-transparent'
                    )}
                  >
                    <PlayCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveTab('materials')}
                    className={cn(
                      'flex-1 h-full flex items-center justify-center transition-colors border-b-2',
                      activeTab === 'materials' ? 'text-primary border-primary' : 'text-zinc-500 hover:text-zinc-300 border-transparent'
                    )}
                  >
                    <Download className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveTab('transcript')}
                    className={cn(
                      'flex-1 h-full flex items-center justify-center transition-colors border-b-2',
                      activeTab === 'transcript' ? 'text-primary border-primary' : 'text-zinc-500 hover:text-zinc-300 border-transparent'
                    )}
                  >
                    <FileText className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveTab('comments')}
                    className={cn(
                      'flex-1 h-full flex items-center justify-center transition-colors border-b-2',
                      activeTab === 'comments' ? 'text-primary border-primary' : 'text-zinc-500 hover:text-zinc-300 border-transparent'
                    )}
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </header>

          <div className="flex flex-row-reverse flex-1 min-h-0">
            {/* Sidebar - Lista de Aulas do Módulo */}
            <aside className={cn(
              "border-l border-zinc-800 flex flex-col bg-zinc-950 flex-shrink-0 transition-all duration-300",
              sidebarCollapsed ? "w-0 overflow-hidden border-l-0" : "w-80"
            )}>
              {/* Conteúdo das Tabs */}
              {activeTab === 'content' && (
                <>
                  {/* Header Conteúdo */}
                  <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                    <h2 className="font-semibold text-white">Conteúdo</h2>
                    <button 
                      onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                      className="p-1 hover:bg-zinc-800 rounded transition-colors"
                    >
                      <Menu className="w-5 h-5 text-zinc-400" />
                    </button>
                  </div>

                  {/* Lista de Todos os Módulos (Accordion) */}
                  <div className="flex-1 overflow-y-auto min-h-0">
                    {course.modules?.map((module, moduleIndex) => {
                      const isModuleExpanded = expandedModules.has(module.id)
                      const moduleLessonsCount = module.lessons?.length || 0
                      const moduleCompletedCount = module.lessons?.filter(l => isLessonCompleted(l.id)).length || 0

                      return (
                        <div key={module.id} className="border-b border-zinc-800">
                          {/* Header do Módulo (clicável para expandir/colapsar) */}
                          <button
                            onClick={() => toggleModule(module.id)}
                            className="w-full p-4 flex items-center gap-3 hover:bg-zinc-900 transition-colors text-left"
                          >
                            <div className="flex-shrink-0">
                              {isModuleExpanded ? (
                                <ChevronDown className="w-4 h-4 text-zinc-400" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-zinc-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium text-white text-sm">{module.title}</h3>
                              <p className="text-xs text-zinc-500 mt-1">
                                {moduleCompletedCount}/{moduleLessonsCount} aulas • {formatDuration(getModuleDuration(module.lessons || []))}
                              </p>
                            </div>
                          </button>

                          {/* Lista de Aulas (quando expandido) */}
                          {isModuleExpanded && (
                            <div className="pb-2">
                              {module.lessons?.map((lesson) => {
                                const isCompleted = isLessonCompleted(lesson.id)
                                const isActive = currentLessonId === lesson.id

                                return (
                                  <button
                                    key={lesson.id}
                                    onClick={() => {
                                      setCurrentLessonId(lesson.id)
                                      setSelectedModuleId(module.id)
                                    }}
                                    className={cn(
                                      'w-full flex items-center gap-3 pl-11 pr-4 py-2.5 text-left transition-colors hover:bg-zinc-900',
                                      isActive && 'bg-primary/10'
                                    )}
                                  >
                                    <div className="flex-shrink-0">
                                      {isCompleted ? (
                                        <CheckCircle className="w-4 h-4 text-primary" />
                                      ) : isActive ? (
                                        <Play className="w-4 h-4 text-primary fill-primary" />
                                      ) : (
                                        <Play className="w-4 h-4 text-zinc-600" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={cn(
                                        'text-sm',
                                        isActive ? 'text-white' : isCompleted ? 'text-zinc-400' : 'text-zinc-300'
                                      )}>
                                        {lesson.title}
                                      </p>
                                    </div>
                                    <span className="text-xs text-zinc-500 flex-shrink-0">
                                      {formatDuration(lesson.duration_minutes)}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Tab Materiais */}
              {activeTab === 'materials' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-zinc-800">
                    <h2 className="font-semibold text-white">Materiais</h2>
                    <p className="text-xs text-zinc-500 mt-1">Arquivos complementares da aula</p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {loadingMaterials ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : materials.length > 0 ? (
                      <div className="p-2 space-y-2">
                        {materials.map((material) => (
                          <a
                            key={material.id}
                            href={material.file_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-800 transition-colors"
                          >
                            <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                              {material.file_type === 'link' ? (
                                <LinkIcon className="w-5 h-5 text-primary" />
                              ) : (
                                <FileText className="w-5 h-5 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">{material.title}</p>
                              {material.description && (
                                <p className="text-xs text-zinc-500 truncate">{material.description}</p>
                              )}
                            </div>
                            {material.is_downloadable && (
                              <Download className="w-4 h-4 text-zinc-400" />
                            )}
                          </a>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-6">
                        <Download className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-center">Nenhum material disponível</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Transcrição */}
              {activeTab === 'transcript' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-zinc-800">
                    <h2 className="font-semibold text-white">Transcrição</h2>
                    <p className="text-xs text-zinc-500 mt-1">Texto da aula</p>
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {loadingTranscript ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : transcript ? (
                      <div className="p-4">
                        <div className="prose prose-sm prose-invert max-w-none">
                          <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                            {transcript.content}
                          </p>
                        </div>
                        {transcript.is_auto_generated && (
                          <p className="text-xs text-zinc-500 mt-4 italic">
                            * Transcrição gerada automaticamente
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-6">
                        <FileText className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-center">Transcrição não disponível</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Comentários */}
              {activeTab === 'comments' && (
                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="p-4 border-b border-zinc-800">
                    <h2 className="font-semibold text-white">Comentários</h2>
                    <p className="text-xs text-zinc-500 mt-1">{commentsData?.pagination?.total || 0} comentários</p>
                  </div>
                  
                  {/* Formulário de novo comentário */}
                  <div className="p-4 border-b border-zinc-800">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="Escreva um comentário..."
                        className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && newComment.trim()) {
                            addCommentMutation.mutate(newComment)
                          }
                        }}
                      />
                      <button
                        onClick={() => newComment.trim() && addCommentMutation.mutate(newComment)}
                        disabled={!newComment.trim() || addCommentMutation.isPending}
                        className="p-2 bg-primary rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
                      >
                        {addCommentMutation.isPending ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Lista de comentários */}
                  <div className="flex-1 overflow-y-auto">
                    {loadingComments ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                      </div>
                    ) : commentsData?.data && commentsData.data.length > 0 ? (
                      <div className="p-2 space-y-3">
                        {commentsData.data.map((comment) => (
                          <div key={comment.id} className={cn(
                            "p-3 rounded-lg",
                            comment.is_pinned ? "bg-primary/10 border border-primary/20" : "bg-zinc-900/50"
                          )}>
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                                {comment.user.avatar_url ? (
                                  <img src={comment.user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                                ) : (
                                  <span className="text-xs font-medium">{comment.user.name[0]}</span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-sm">{comment.user.name}</span>
                                  {comment.is_highlighted && (
                                    <Badge variant="outline" className="text-xs">Instrutor</Badge>
                                  )}
                                  {comment.is_pinned && (
                                    <Badge variant="outline" className="text-xs text-primary border-primary">Fixado</Badge>
                                  )}
                                </div>
                                <p className="text-sm text-zinc-300 mt-1">{comment.content}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <button
                                    onClick={() => likeMutation.mutate(comment.id)}
                                    className="flex items-center gap-1 text-xs text-zinc-500 hover:text-primary transition-colors"
                                  >
                                    <ThumbsUp className="w-3 h-3" />
                                    {comment.likes_count > 0 && comment.likes_count}
                                  </button>
                                  <span className="text-xs text-zinc-600">
                                    {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-6">
                        <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
                        <p className="text-center">Nenhum comentário ainda</p>
                        <p className="text-xs mt-1">Seja o primeiro a comentar!</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </aside>

            {/* Player */}
            <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
            {currentLesson ? (
              <>
                <div className="flex-1 bg-black min-h-0">
                  <VideoPlayer 
                    url={currentLesson.video_url || ''} 
                    title={currentLesson.title} 
                  />
                </div>

                {/* Info da Aula */}
                <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex-shrink-0 overflow-y-auto max-h-[40vh]">
                  <div className="flex items-start justify-between gap-8">
                    {/* Lado Esquerdo - Descrição */}
                    <div className="flex-1 min-w-0">
                      {currentLesson.description && (
                        <p className="text-sm text-zinc-400 whitespace-pre-wrap">
                          {linkifyText(currentLesson.description)}
                        </p>
                      )}
                      
                      {/* Banner Promocional */}
                      {currentLesson.banner_url && (
                        <div className="mt-4">
                          {currentLesson.banner_link ? (
                            <a
                              href={currentLesson.banner_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                            >
                              <img
                                src={currentLesson.banner_url}
                                alt="Banner promocional"
                                className="w-full h-auto object-cover"
                              />
                            </a>
                          ) : (
                            <div className="rounded-lg overflow-hidden">
                              <img
                                src={currentLesson.banner_url}
                                alt="Banner"
                                className="w-full h-auto object-cover"
                              />
                            </div>
                          )}
                        </div>
                      )}

                      {/* Anúncios Globais */}
                      {globalAnnouncements.length > 0 && (
                        <div className="mt-4 space-y-4">
                          {globalAnnouncements.map((announcement) => (
                            <div key={announcement.id} className="rounded-lg overflow-hidden bg-zinc-900/50 border border-zinc-800 relative">
                              <Badge variant="secondary" className="absolute top-3 left-3 z-10 bg-zinc-800/90 text-zinc-300 text-xs">
                                {announcement.badge_text || 'Anúncio'}
                              </Badge>
                              {announcement.link ? (
                                <a
                                  href={announcement.link}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="block hover:opacity-90 transition-opacity"
                                >
                                  {announcement.image_url && (
                                    <img
                                      src={announcement.image_url}
                                      alt={announcement.title || 'Anúncio'}
                                      className="w-full h-auto object-cover"
                                    />
                                  )}
                                  {(announcement.title || announcement.description) && (
                                    <div className="p-4">
                                      {announcement.title && (
                                        <h4 className="font-semibold text-white">{announcement.title}</h4>
                                      )}
                                      {announcement.description && (
                                        <p className="text-sm text-zinc-400 mt-1">{announcement.description}</p>
                                      )}
                                    </div>
                                  )}
                                </a>
                              ) : (
                                <div>
                                  {announcement.image_url && (
                                    <img
                                      src={announcement.image_url}
                                      alt={announcement.title || 'Anúncio'}
                                      className="w-full h-auto object-cover"
                                    />
                                  )}
                                  {(announcement.title || announcement.description) && (
                                    <div className="p-4">
                                      {announcement.title && (
                                        <h4 className="font-semibold text-white">{announcement.title}</h4>
                                      )}
                                      {announcement.description && (
                                        <p className="text-sm text-zinc-400 mt-1">{announcement.description}</p>
                                      )}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Avaliação inline */}
                      <div className="mt-6 flex items-center gap-3">
                        <span className="text-sm text-zinc-500">Avalie esta aula:</span>
                        <div className="flex gap-0.5">
                          {[1, 2, 3, 4, 5].map((star) => {
                            const currentRating = lessonRatings[currentLesson.id] || 0
                            const isActive = star <= currentRating
                            return (
                              <button
                                key={star}
                                onClick={() => rateLesson(currentLesson.id, star)}
                                className="p-0.5 hover:scale-110 transition-transform"
                              >
                                <Star className={cn(
                                  "w-5 h-5 transition-colors",
                                  isActive ? "text-yellow-500 fill-yellow-500" : "text-zinc-600 hover:text-yellow-500"
                                )} />
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-zinc-500">
                <div className="text-center">
                  <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>Selecione uma aula para começar</p>
                </div>
              </div>
            )}
          </main>
          </div>
        </div>
      )
    }

    // Grid de módulos (página inicial do modo Netflix)
    return (
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur-sm border-b border-zinc-800">
          <div className="px-6 py-4">
            <Link href="/dashboard" className="flex items-center gap-2 text-zinc-400 hover:text-white mb-3 w-fit">
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Voltar ao dashboard</span>
            </Link>
            <div className="flex items-start gap-4">
              {(course.small_thumbnail_url || course.thumbnail_url) && (
                <img 
                  src={course.small_thumbnail_url || course.thumbnail_url} 
                  alt={course.title}
                  className="w-12 h-12 object-cover rounded-lg"
                />
              )}
              <div className="flex-1">
                <h1 className="text-xl font-bold">{course.title}</h1>
                <div className="flex items-center gap-4 mt-2">
                  <div className="flex items-center gap-2">
                    <Progress value={progressPercentage} className="h-2 w-32" />
                    <span className="text-sm text-primary">{progressPercentage}%</span>
                  </div>
                  <span className="text-sm text-zinc-500">
                    {completedLessons}/{totalLessons} aulas
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de Módulos */}
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Módulos</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-4">
            {course.modules?.map((module, index) => {
              const moduleLessons = module.lessons?.length || 0
              const moduleCompletedLessons = module.lessons?.filter(l => isLessonCompleted(l.id)).length || 0
              const moduleProgress = moduleLessons > 0 ? Math.round((moduleCompletedLessons / moduleLessons) * 100) : 0

              return (
                <button
                  key={module.id}
                  onClick={() => selectModule(module.id)}
                  className="group relative bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 hover:border-primary/50 transition-all hover:scale-[1.02] text-left"
                >
                  {/* Thumbnail - formato 9:16 (poster) */}
                  <div className="aspect-[9/16] bg-zinc-800 relative overflow-hidden">
                    {module.thumbnail_url ? (
                      <img 
                        src={module.thumbnail_url} 
                        alt={module.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary/30 to-zinc-900 p-4">
                        <span className="text-5xl font-bold text-zinc-600 mb-2">{index + 1}</span>
                        <p className="text-xs text-zinc-500 text-center line-clamp-3">{module.title}</p>
                      </div>
                    )}
                    {/* Overlay com play */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                        <PlayCircle className="w-7 h-7 text-white" />
                      </div>
                    </div>
                    {/* Progress bar */}
                    {moduleProgress > 0 && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
                        <div 
                          className="h-full bg-primary transition-all"
                          style={{ width: `${moduleProgress}%` }}
                        />
                      </div>
                    )}
                    {/* Info overlay na parte inferior */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent p-3 pt-8">
                      <p className="text-[10px] text-primary mb-0.5">Módulo {index + 1}</p>
                      <h3 className="font-medium text-xs line-clamp-2 text-white">
                        {module.title}
                      </h3>
                      <p className="text-[10px] text-zinc-400 mt-1">
                        {moduleCompletedLessons}/{moduleLessons} aulas
                      </p>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  // ========== MODO DEFAULT ==========
  // Encontra o módulo atual baseado na aula selecionada
  const currentModule = course.modules?.find(m => 
    m.lessons?.some(l => l.id === currentLessonId)
  )
  const currentModuleIndex = course.modules?.findIndex(m => m.id === currentModule?.id) ?? -1
  const nextModule = currentModuleIndex >= 0 ? course.modules?.[currentModuleIndex + 1] : null

  return (
    <div className="flex flex-col h-full">
      {/* Header com Breadcrumb e Tabs */}
      <header className="h-12 flex items-center bg-zinc-900 border-b border-zinc-800 flex-shrink-0">
        {/* Breadcrumb e Autoplay */}
        <div className="flex-1 px-4 flex items-center justify-between min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <Link 
              href="/my-courses"
              className="p-1 hover:bg-zinc-800 rounded transition-colors flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </Link>
            <div className="flex items-center gap-2 min-w-0 text-sm">
              <span className="text-white font-medium truncate max-w-[200px]">{course.title}</span>
              {currentModule && (
                <>
                  <span className="text-zinc-600 flex-shrink-0">/</span>
                  <span className="text-zinc-400 truncate max-w-[180px]">{currentModule.title}</span>
                </>
              )}
              {currentLesson && (
                <>
                  <span className="text-zinc-600 flex-shrink-0">–</span>
                  <span className="text-zinc-300 truncate max-w-[250px]">{currentLesson.title}</span>
                </>
              )}
            </div>
          </div>
          {currentLessonId && (
            <button
              onClick={() => !isLessonCompleted(currentLessonId) && completeLessonMutation.mutate(currentLessonId)}
              disabled={completeLessonMutation.isPending || isLessonCompleted(currentLessonId)}
              className={cn(
                "flex items-center gap-2 flex-shrink-0",
                isLessonCompleted(currentLessonId) ? "cursor-default" : "cursor-pointer hover:opacity-80"
              )}
            >
              <span className={cn(
                "text-sm transition-colors",
                isLessonCompleted(currentLessonId) ? "text-green-500" : "text-zinc-400"
              )}>
                Aula concluída
              </span>
              <div className={cn(
                "w-10 h-5 rounded-full relative transition-colors",
                isLessonCompleted(currentLessonId) ? "bg-green-500" : "bg-zinc-700"
              )}>
                <span className={cn(
                  "absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all",
                  isLessonCompleted(currentLessonId) ? "right-0.5" : "left-0.5"
                )} />
              </div>
            </button>
          )}
        </div>

        {/* Tabs de Navegação (no header) */}
        <div className={cn(
          "h-full flex items-center border-l border-zinc-800 bg-zinc-950 flex-shrink-0 transition-all duration-300",
          sidebarCollapsed ? "w-12 justify-center" : "w-80 justify-around"
        )}>
          {sidebarCollapsed ? (
            <button
              onClick={() => setSidebarCollapsed(false)}
              className="p-2 hover:bg-zinc-800 rounded transition-colors"
              title="Expandir sidebar"
            >
              <Menu className="w-5 h-5 text-zinc-400" />
            </button>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('content')}
                className={cn(
                  'flex-1 h-full flex items-center justify-center transition-colors border-b-2',
                  activeTab === 'content' ? 'text-primary border-primary' : 'text-zinc-500 hover:text-zinc-300 border-transparent'
                )}
              >
                <PlayCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={cn(
                  'flex-1 h-full flex items-center justify-center transition-colors border-b-2',
                  activeTab === 'materials' ? 'text-primary border-primary' : 'text-zinc-500 hover:text-zinc-300 border-transparent'
                )}
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTab('transcript')}
                className={cn(
                  'flex-1 h-full flex items-center justify-center transition-colors border-b-2',
                  activeTab === 'transcript' ? 'text-primary border-primary' : 'text-zinc-500 hover:text-zinc-300 border-transparent'
                )}
              >
                <FileText className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveTab('comments')}
                className={cn(
                  'flex-1 h-full flex items-center justify-center transition-colors border-b-2',
                  activeTab === 'comments' ? 'text-primary border-primary' : 'text-zinc-500 hover:text-zinc-300 border-transparent'
                )}
              >
                <MessageCircle className="w-5 h-5" />
              </button>
            </>
          )}
        </div>
      </header>

      <div className="flex flex-row-reverse flex-1 min-h-0">
        {/* Sidebar - Lista de Aulas */}
        <aside className={cn(
          "border-l border-zinc-800 flex flex-col bg-zinc-950 flex-shrink-0 transition-all duration-300",
          sidebarCollapsed ? "w-0 overflow-hidden border-l-0" : "w-80"
        )}>
          {/* Conteúdo das Tabs */}
          {activeTab === 'content' && (
            <>
              {/* Header Conteúdo */}
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <h2 className="font-semibold text-white">Conteúdo</h2>
                <button 
                  onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
                  className="p-1 hover:bg-zinc-800 rounded transition-colors"
                >
                  <Menu className="w-5 h-5 text-zinc-400" />
                </button>
              </div>

              {/* Lista de Todos os Módulos (Accordion) */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {course.modules?.map((module) => {
                  const isModuleExpanded = expandedModules.has(module.id)
                  const moduleLessonsCount = module.lessons?.length || 0
                  const moduleCompletedCount = module.lessons?.filter(l => isLessonCompleted(l.id)).length || 0

                  return (
                    <div key={module.id} className="border-b border-zinc-800">
                      {/* Header do Módulo (clicável para expandir/colapsar) */}
                      <button
                        onClick={() => toggleModule(module.id)}
                        className="w-full p-4 flex items-center gap-3 hover:bg-zinc-900 transition-colors text-left"
                      >
                        <div className="flex-shrink-0">
                          {isModuleExpanded ? (
                            <ChevronDown className="w-4 h-4 text-zinc-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-zinc-400" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-white text-sm">{module.title}</h3>
                          <p className="text-xs text-zinc-500 mt-1">
                            {moduleCompletedCount}/{moduleLessonsCount} aulas • {formatDuration(getModuleDuration(module.lessons || []))}
                          </p>
                        </div>
                      </button>

                      {/* Lista de Aulas (quando expandido) */}
                      {isModuleExpanded && (
                        <div className="pb-2">
                          {module.lessons?.map((lesson) => {
                            const isCompleted = isLessonCompleted(lesson.id)
                            const isActive = currentLessonId === lesson.id

                            return (
                              <button
                                key={lesson.id}
                                onClick={() => selectLesson(lesson, module.id)}
                                className={cn(
                                  'w-full flex items-center gap-3 pl-11 pr-4 py-2.5 text-left transition-colors hover:bg-zinc-900',
                                  isActive && 'bg-primary/10'
                                )}
                              >
                                <div className="flex-shrink-0">
                                  {isCompleted ? (
                                    <CheckCircle className="w-4 h-4 text-primary" />
                                  ) : isActive ? (
                                    <Play className="w-4 h-4 text-primary fill-primary" />
                                  ) : (
                                    <Play className="w-4 h-4 text-zinc-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={cn(
                                    'text-sm',
                                    isActive ? 'text-white' : isCompleted ? 'text-zinc-400' : 'text-zinc-300'
                                  )}>
                                    {lesson.title}
                                  </p>
                                </div>
                                <span className="text-xs text-zinc-500 flex-shrink-0">
                                  {formatDuration(lesson.duration_minutes)}
                                </span>
                              </button>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* Tab Materiais */}
          {activeTab === 'materials' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-zinc-800">
                <h2 className="font-semibold text-white">Materiais</h2>
                <p className="text-xs text-zinc-500 mt-1">Arquivos complementares da aula</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingMaterials ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : materials.length > 0 ? (
                  <div className="p-2 space-y-2">
                    {materials.map((material) => (
                      <a
                        key={material.id}
                        href={material.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900/50 hover:bg-zinc-800 transition-colors"
                      >
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                          {material.file_type === 'link' ? (
                            <LinkIcon className="w-5 h-5 text-primary" />
                          ) : (
                            <FileText className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{material.title}</p>
                          {material.description && (
                            <p className="text-xs text-zinc-500 truncate">{material.description}</p>
                          )}
                        </div>
                        {material.is_downloadable && (
                          <Download className="w-4 h-4 text-zinc-400" />
                        )}
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-6">
                    <Download className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-center">Nenhum material disponível</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Transcrição */}
          {activeTab === 'transcript' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-zinc-800">
                <h2 className="font-semibold text-white">Transcrição</h2>
                <p className="text-xs text-zinc-500 mt-1">Texto da aula</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {loadingTranscript ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : transcript ? (
                  <div className="p-4">
                    <div className="prose prose-sm prose-invert max-w-none">
                      <p className="text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                        {transcript.content}
                      </p>
                    </div>
                    {transcript.is_auto_generated && (
                      <p className="text-xs text-zinc-500 mt-4 italic">
                        * Transcrição gerada automaticamente
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-6">
                    <FileText className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-center">Transcrição não disponível</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab Comentários */}
          {activeTab === 'comments' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-b border-zinc-800">
                <h2 className="font-semibold text-white">Comentários</h2>
                <p className="text-xs text-zinc-500 mt-1">{commentsData?.pagination?.total || 0} comentários</p>
              </div>
              
              {/* Formulário de novo comentário */}
              <div className="p-4 border-b border-zinc-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escreva um comentário..."
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newComment.trim()) {
                        addCommentMutation.mutate(newComment)
                      }
                    }}
                  />
                  <button
                    onClick={() => newComment.trim() && addCommentMutation.mutate(newComment)}
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    className="p-2 bg-primary rounded-lg hover:bg-primary/80 transition-colors disabled:opacity-50"
                  >
                    {addCommentMutation.isPending ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Lista de comentários */}
              <div className="flex-1 overflow-y-auto">
                {loadingComments ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  </div>
                ) : commentsData?.data && commentsData.data.length > 0 ? (
                  <div className="p-2 space-y-3">
                    {commentsData.data.map((comment) => (
                      <div key={comment.id} className={cn(
                        "p-3 rounded-lg",
                        comment.is_pinned ? "bg-primary/10 border border-primary/20" : "bg-zinc-900/50"
                      )}>
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center flex-shrink-0">
                            {comment.user.avatar_url ? (
                              <img src={comment.user.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                            ) : (
                              <span className="text-xs font-medium">{comment.user.name[0]}</span>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-sm">{comment.user.name}</span>
                              {comment.is_highlighted && (
                                <Badge variant="outline" className="text-xs">Instrutor</Badge>
                              )}
                              {comment.is_pinned && (
                                <Badge variant="outline" className="text-xs text-primary border-primary">Fixado</Badge>
                              )}
                            </div>
                            <p className="text-sm text-zinc-300 mt-1">{comment.content}</p>
                            <div className="flex items-center gap-4 mt-2">
                              <button
                                onClick={() => likeMutation.mutate(comment.id)}
                                className="flex items-center gap-1 text-xs text-zinc-500 hover:text-primary transition-colors"
                              >
                                <ThumbsUp className="w-3 h-3" />
                                {comment.likes_count > 0 && comment.likes_count}
                              </button>
                              <span className="text-xs text-zinc-600">
                                {new Date(comment.created_at).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 p-6">
                    <MessageCircle className="w-12 h-12 mb-4 opacity-50" />
                    <p className="text-center">Nenhum comentário ainda</p>
                    <p className="text-xs mt-1">Seja o primeiro a comentar!</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </aside>

      {/* Conteúdo Principal - Player */}
      <main className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {currentLesson ? (
          <>
            {/* Player de Vídeo */}
            <div className="flex-1 bg-black min-h-0">
              <VideoPlayer 
                url={currentLesson.video_url || ''} 
                title={currentLesson.title} 
              />
            </div>

            {/* Info da Aula */}
            <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex-shrink-0 overflow-y-auto max-h-[40vh]">
              <div className="flex items-start justify-between gap-8">
                {/* Lado Esquerdo - Descrição */}
                <div className="flex-1 min-w-0">
                  {currentLesson.description && (
                    <p className="text-sm text-zinc-400 whitespace-pre-wrap">
                      {linkifyText(currentLesson.description)}
                    </p>
                  )}
                  
                  {/* Banner Promocional */}
                  {currentLesson.banner_url && (
                    <div className="mt-4">
                      {currentLesson.banner_link ? (
                        <a
                          href={currentLesson.banner_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block rounded-lg overflow-hidden hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={currentLesson.banner_url}
                            alt="Banner promocional"
                            className="w-full h-auto object-cover"
                          />
                        </a>
                      ) : (
                        <div className="rounded-lg overflow-hidden">
                          <img
                            src={currentLesson.banner_url}
                            alt="Banner"
                            className="w-full h-auto object-cover"
                          />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Anúncios Globais */}
                  {globalAnnouncements.length > 0 && (
                    <div className="mt-4 space-y-4">
                      {globalAnnouncements.map((announcement) => (
                        <div key={announcement.id} className="rounded-lg overflow-hidden bg-zinc-900/50 border border-zinc-800 relative">
                          <Badge variant="secondary" className="absolute top-3 left-3 z-10 bg-zinc-800/90 text-zinc-300 text-xs">
                            {announcement.badge_text || 'Anúncio'}
                          </Badge>
                          {announcement.link ? (
                            <a
                              href={announcement.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block hover:opacity-90 transition-opacity"
                            >
                              {announcement.image_url && (
                                <img
                                  src={announcement.image_url}
                                  alt={announcement.title || 'Anúncio'}
                                  className="w-full h-auto object-cover"
                                />
                              )}
                              {(announcement.title || announcement.description) && (
                                <div className="p-4">
                                  {announcement.title && (
                                    <h4 className="font-semibold text-white">{announcement.title}</h4>
                                  )}
                                  {announcement.description && (
                                    <p className="text-sm text-zinc-400 mt-1">{announcement.description}</p>
                                  )}
                                </div>
                              )}
                            </a>
                          ) : (
                            <div>
                              {announcement.image_url && (
                                <img
                                  src={announcement.image_url}
                                  alt={announcement.title || 'Anúncio'}
                                  className="w-full h-auto object-cover"
                                />
                              )}
                              {(announcement.title || announcement.description) && (
                                <div className="p-4">
                                  {announcement.title && (
                                    <h4 className="font-semibold text-white">{announcement.title}</h4>
                                  )}
                                  {announcement.description && (
                                    <p className="text-sm text-zinc-400 mt-1">{announcement.description}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Avaliação inline */}
                  <div className="mt-6 flex items-center gap-3">
                    <span className="text-sm text-zinc-500">Avalie esta aula:</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const currentRating = lessonRatings[currentLesson.id] || 0
                        const isActive = star <= currentRating
                        return (
                          <button
                            key={star}
                            onClick={() => rateLesson(currentLesson.id, star)}
                            className="p-0.5 hover:scale-110 transition-transform"
                          >
                            <Star className={cn(
                              "w-5 h-5 transition-colors",
                              isActive ? "text-yellow-500 fill-yellow-500" : "text-zinc-600 hover:text-yellow-500"
                            )} />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-zinc-500">
            <div className="text-center">
              <Play className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p>Selecione uma aula para começar</p>
            </div>
          </div>
        )}
      </main>
      </div>
    </div>
  )
}
