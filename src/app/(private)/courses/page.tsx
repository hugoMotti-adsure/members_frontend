'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, MoreVertical, Edit, Trash2, Users, BookOpen, GraduationCap } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/components/ui/use-toast'
import { CreateCourseDialog } from '@/features/courses/components/create-course-dialog'
import { AdminGuard } from '@/components/auth/admin-guard'

function CoursesPageContent() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const queryClient = useQueryClient()
  const { toast } = useToast()

  const { data: courses, isLoading } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses').then((res) => res.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (courseId: string) => api.delete(`/courses/${courseId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['courses'] })
      toast({ title: 'Curso excluído com sucesso' })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir curso',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  return (
    <div className="space-y-5">
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Cursos</h1>
          <p className="text-sm text-muted-foreground">Gerencie seus cursos</p>
        </div>
        <Button size="sm" onClick={() => setIsCreateOpen(true)} className="h-8 px-3 text-xs">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          Novo Curso
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-2 grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="animate-pulse rounded-md border bg-card overflow-hidden">
              <div className="aspect-[16/9] bg-muted" />
              <div className="p-2 space-y-1.5">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-2.5 bg-muted rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : courses?.length === 0 ? (
        <div className="rounded-md border bg-card/50 p-6 text-center">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-2">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-sm font-medium mb-1">Nenhum curso ainda</h3>
          <p className="text-xs text-muted-foreground mb-3">
            Crie seu primeiro curso para começar
          </p>
          <Button size="sm" onClick={() => setIsCreateOpen(true)} className="h-7 px-2.5 text-[11px]">
            <Plus className="h-3 w-3 mr-1" />
            Criar Curso
          </Button>
        </div>
      ) : (
        <div className="grid gap-2 grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7">
          {courses?.map((course: any) => (
            <Link key={course.id} href={`/courses/${course.id}`} className="group">
              <div className="rounded-md border bg-card overflow-hidden transition-all duration-200 hover:border-primary/40 hover:shadow-sm hover:shadow-primary/5">
                {/* Thumbnail compacta */}
                <div className="relative aspect-[16/9] bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-zinc-600" />
                    </div>
                  )}
                  
                  {/* Status badge minimalista */}
                  <div className="absolute top-1 left-1">
                    <span className={`inline-flex items-center px-1 py-px rounded text-[8px] font-medium backdrop-blur-sm ${
                      course.is_published 
                        ? 'bg-emerald-500/20 text-emerald-400' 
                        : 'bg-zinc-500/20 text-zinc-400'
                    }`}>
                      {course.is_published ? 'Pub' : 'Draft'}
                    </span>
                  </div>

                  {/* Menu de ações */}
                  <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.preventDefault()}>
                        <button className="h-5 w-5 rounded bg-black/50 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition-colors">
                          <MoreVertical className="h-3 w-3 text-white" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem asChild className="text-[11px]">
                          <Link href={`/courses/${course.id}`}>
                            <Edit className="h-3 w-3 mr-1.5" />
                            Gerenciar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-[11px] text-destructive focus:text-destructive"
                          onClick={(e) => {
                            e.preventDefault()
                            if (confirm('Tem certeza que deseja excluir este curso?')) {
                              deleteMutation.mutate(course.id)
                            }
                          }}
                        >
                          <Trash2 className="h-3 w-3 mr-1.5" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Conteúdo compacto */}
                <div className="p-2">
                  <h3 className="font-medium text-xs line-clamp-1 group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-0.5">
                      <Users className="h-2.5 w-2.5" />
                      {course.enrollments?.[0]?.count || 0}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <BookOpen className="h-2.5 w-2.5" />
                      {course.modules?.[0]?.count || 0}
                    </span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateCourseDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  )
}

export default function CoursesPage() {
  return (
    <AdminGuard>
      <CoursesPageContent />
    </AdminGuard>
  )
}
