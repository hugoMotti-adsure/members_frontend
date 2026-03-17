'use client'

import { useState, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Search, MoreVertical, Eye, Mail, UserX, Trash2, Plus, Upload, KeyRound, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { CreateStudentDialog } from '@/features/students/components/create-student-dialog'
import { ImportStudentsDialog } from '@/features/students/components/import-students-dialog'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'

export default function StudentsPage() {
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const [importOpen, setImportOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [studentToDelete, setStudentToDelete] = useState<any>(null)
  const [resendingAccess, setResendingAccess] = useState<string | null>(null)

  const { toast } = useToast()
  const queryClient = useQueryClient()

  // Debounce da busca para evitar requisições excessivas
  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value)
    setPage(1) // Volta para página 1 ao buscar
  }, 300)

  useEffect(() => {
    debouncedSetSearch(search)
  }, [search, debouncedSetSearch])

  const { data, isLoading } = useQuery({
    queryKey: ['students', page, debouncedSearch],
    queryFn: () => {
      const params = new URLSearchParams({
        page: String(page),
        limit: '20',
      })
      if (debouncedSearch) {
        params.append('search', debouncedSearch)
      }
      return api.get(`/users/students?${params.toString()}`).then((res) => res.data)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (studentId: string) => api.delete(`/users/${studentId}`),
    onSuccess: () => {
      toast({
        title: 'Aluno deletado',
        description: 'O aluno foi removido permanentemente.',
      })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      setDeleteDialogOpen(false)
      setStudentToDelete(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao deletar',
        description: error.response?.data?.message || 'Não foi possível deletar o aluno.',
        variant: 'destructive',
      })
    },
  })

  const handleResendAccess = async (student: any) => {
    setResendingAccess(student.id)
    try {
      const response = await api.post(`/users/${student.id}/resend-access`)
      toast({
        title: 'Acesso reenviado!',
        description: `Uma nova senha foi gerada e enviada para ${response.data.email}`,
      })
    } catch (error: any) {
      toast({
        title: 'Erro ao reenviar acesso',
        description: error.response?.data?.message || 'Não foi possível reenviar o acesso.',
        variant: 'destructive',
      })
    } finally {
      setResendingAccess(null)
    }
  }

  const handleDeleteClick = (student: any) => {
    setStudentToDelete(student)
    setDeleteDialogOpen(true)
  }

  const confirmDelete = () => {
    if (studentToDelete) {
      deleteMutation.mutate(studentToDelete.id)
    }
  }

  const students = data?.data || []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Alunos</h1>
          <p className="text-muted-foreground">Gerencie os alunos da sua escola</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            Importar CSV
          </Button>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Aluno
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar aluno..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Cadastro</TableHead>
              <TableHead>Último Acesso</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <div className="h-12 bg-muted animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  {debouncedSearch ? `Nenhum aluno encontrado para "${debouncedSearch}"` : 'Nenhum aluno encontrado'}
                </TableCell>
              </TableRow>
            ) : (
              students.map((student: any) => (
                <TableRow key={student.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={student.avatar_url} />
                        <AvatarFallback>
                          {student.name.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{student.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.email}
                  </TableCell>
                  <TableCell>
                    <Badge variant={student.is_active ? 'default' : 'secondary'}>
                      {student.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(student.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {student.last_login_at
                      ? new Date(student.last_login_at).toLocaleDateString('pt-BR')
                      : 'Nunca'}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/students/${student.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleResendAccess(student)}
                          disabled={resendingAccess === student.id}
                        >
                          {resendingAccess === student.id ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <KeyRound className="h-4 w-4 mr-2" />
                          )}
                          Reenviar Acesso
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-yellow-600">
                          <UserX className="h-4 w-4 mr-2" />
                          Desativar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteClick(student)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {data?.meta && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Mostrando {students.length} de {data.meta.total} alunos
            {debouncedSearch && ` (filtrado por "${debouncedSearch}")`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
            >
              Anterior
            </Button>
            <span className="text-sm">
              Página {page} de {data.meta.total_pages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => p + 1)}
              disabled={page >= data.meta.total_pages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}

      <CreateStudentDialog open={createOpen} onOpenChange={setCreateOpen} />
      <ImportStudentsDialog open={importOpen} onOpenChange={setImportOpen} />

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar aluno?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <strong>permanente</strong> e não pode ser desfeita.
              O aluno <strong>{studentToDelete?.name}</strong> será removido junto com todas as suas matrículas e progresso nos cursos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
