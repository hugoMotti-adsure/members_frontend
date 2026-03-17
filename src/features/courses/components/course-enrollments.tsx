'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, UserX, Search, Eye, EyeOff } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

interface CourseEnrollmentsProps {
  courseId: string
}

export function CourseEnrollments({ courseId }: CourseEnrollmentsProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [hideEmails, setHideEmails] = useState(false)

  // Função para mascarar email
  const maskEmail = (email: string) => {
    if (!email) return ''
    const [localPart, domain] = email.split('@')
    if (!domain) return email
    const visibleChars = Math.min(2, localPart.length)
    const masked = localPart.slice(0, visibleChars) + '****'
    return `${masked}@${domain}`
  }

  // Busca matrículas do curso
  const { data: enrollments, isLoading } = useQuery({
    queryKey: ['enrollments', courseId],
    queryFn: () => api.get(`/enrollments/course/${courseId}`).then((res) => res.data),
  })

  // Busca alunos para adicionar
  const { data: students } = useQuery({
    queryKey: ['students-to-enroll'],
    queryFn: () => api.get('/users/students?limit=100').then((res) => res.data),
    enabled: addDialogOpen,
  })

  // Mutation para matricular
  const enrollMutation = useMutation({
    mutationFn: (userId: string) =>
      api.post('/enrollments', { user_id: userId, course_id: courseId }),
    onSuccess: () => {
      toast({ title: 'Aluno matriculado com sucesso!' })
      queryClient.invalidateQueries({ queryKey: ['enrollments', courseId] })
      setAddDialogOpen(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao matricular',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  // Mutation para cancelar matrícula
  const cancelMutation = useMutation({
    mutationFn: (enrollmentId: string) =>
      api.patch(`/enrollments/${enrollmentId}/cancel`),
    onSuccess: () => {
      toast({ title: 'Matrícula cancelada' })
      queryClient.invalidateQueries({ queryKey: ['enrollments', courseId] })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cancelar',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  // Filtra alunos já matriculados
  const enrolledUserIds = enrollments?.data?.map((e: any) => e.user_id) || []
  const availableStudents = students?.data?.filter(
    (s: any) =>
      !enrolledUserIds.includes(s.id) &&
      (s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Alunos Matriculados</h3>
          <p className="text-sm text-muted-foreground">
            {enrollments?.meta?.total || 0} alunos neste curso
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setHideEmails(!hideEmails)}
            title={hideEmails ? 'Mostrar emails' : 'Ocultar emails'}
          >
            {hideEmails ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </Button>
          <Button onClick={() => setAddDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Aluno
          </Button>
        </div>
      </div>

      {/* Lista de matriculados */}
      <div className="border rounded-lg divide-y">
        {isLoading ? (
          <div className="p-4 text-center text-muted-foreground">Carregando...</div>
        ) : enrollments?.data?.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-muted-foreground mb-4">Nenhum aluno matriculado ainda</p>
            <Button variant="outline" onClick={() => setAddDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Adicionar Primeiro Aluno
            </Button>
          </div>
        ) : (
          enrollments?.data?.map((enrollment: any) => (
            <div key={enrollment.id} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={enrollment.user?.avatar_url} />
                  <AvatarFallback>
                    {enrollment.user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{enrollment.user?.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {hideEmails ? maskEmail(enrollment.user?.email) : enrollment.user?.email}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={enrollment.status === 'active' ? 'default' : 'secondary'}>
                  {enrollment.status === 'active' ? 'Ativo' : 
                   enrollment.status === 'cancelled' ? 'Cancelado' : 'Expirado'}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {new Date(enrollment.enrolled_at).toLocaleDateString('pt-BR')}
                </span>
                {enrollment.status === 'active' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm('Deseja cancelar esta matrícula?')) {
                        cancelMutation.mutate(enrollment.id)
                      }
                    }}
                  >
                    <UserX className="w-4 h-4 text-red-400" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Dialog para adicionar aluno */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Adicionar Aluno ao Curso</DialogTitle>
            <DialogDescription>
              Selecione um aluno para matricular neste curso
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar aluno por nome ou email..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="max-h-[300px] overflow-y-auto space-y-2">
              {availableStudents?.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  {students?.data?.length === 0
                    ? 'Nenhum aluno cadastrado'
                    : searchTerm
                    ? 'Nenhum aluno encontrado'
                    : 'Todos os alunos já estão matriculados'}
                </p>
              ) : (
                availableStudents?.map((student: any) => (
                  <div
                    key={student.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => enrollMutation.mutate(student.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={student.avatar_url} />
                        <AvatarFallback>
                          {student.name?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{student.name}</p>
                        <p className="text-sm text-muted-foreground">{student.email}</p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      disabled={enrollMutation.isPending}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Matricular
                    </Button>
                  </div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
