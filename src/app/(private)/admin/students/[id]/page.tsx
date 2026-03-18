'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Clock,
  BookOpen,
  Award,
  UserX,
  RotateCcw,
  Trash2,
  MoreVertical,
  FolderOpen,
  FileText,
  FileSpreadsheet,
  File,
  ExternalLink,
  Package,
  Plus,
  Loader2,
  KeyRound,
  Copy,
  Check,
  Sparkles,
  Eye,
  EyeOff,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useToast } from '@/components/ui/use-toast'
import { useState } from 'react'
import { useAuthStore } from '@/features/auth/stores/auth.store'

const fileTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pdf: { icon: <FileText className="w-4 h-4" />, color: 'text-red-500', label: 'PDF' },
  doc: { icon: <FileText className="w-4 h-4" />, color: 'text-blue-500', label: 'Word' },
  xls: { icon: <FileSpreadsheet className="w-4 h-4" />, color: 'text-green-500', label: 'Excel' },
  csv: { icon: <FileSpreadsheet className="w-4 h-4" />, color: 'text-green-400', label: 'CSV' },
  link: { icon: <ExternalLink className="w-4 h-4" />, color: 'text-cyan-500', label: 'Link' },
  other: { icon: <File className="w-4 h-4" />, color: 'text-zinc-500', label: 'Arquivo' },
}

export default function StudentDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [addOfferDialogOpen, setAddOfferDialogOpen] = useState(false)
  const [addMaterialDialogOpen, setAddMaterialDialogOpen] = useState(false)
  const [selectedOfferId, setSelectedOfferId] = useState<string>('')
  const [selectedMaterialOfferId, setSelectedMaterialOfferId] = useState<string>('')
  const [removeEnrollmentDialogOpen, setRemoveEnrollmentDialogOpen] = useState(false)
  const [selectedEnrollment, setSelectedEnrollment] = useState<any>(null)
  const [removeOfferDialogOpen, setRemoveOfferDialogOpen] = useState(false)
  const [selectedOffer, setSelectedOffer] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [changePasswordDialogOpen, setChangePasswordDialogOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [passwordCopied, setPasswordCopied] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [sendEmailDialogOpen, setSendEmailDialogOpen] = useState(false)
  const [emailSubject, setEmailSubject] = useState('')
  const [emailMessage, setEmailMessage] = useState('')

  const copyEmail = async () => {
    if (student?.email) {
      await navigator.clipboard.writeText(student.email)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const generateStrongPassword = () => {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz'
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    const numbers = '0123456789'
    const symbols = '!@#$%&*'
    const allChars = lowercase + uppercase + numbers + symbols
    
    let password = ''
    // Garantir pelo menos um de cada tipo
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
    password += numbers[Math.floor(Math.random() * numbers.length)]
    password += symbols[Math.floor(Math.random() * symbols.length)]
    
    // Preencher o resto
    for (let i = 0; i < 8; i++) {
      password += allChars[Math.floor(Math.random() * allChars.length)]
    }
    
    // Embaralhar
    password = password.split('').sort(() => Math.random() - 0.5).join('')
    setNewPassword(password)
  }

  const copyPassword = async () => {
    if (newPassword) {
      await navigator.clipboard.writeText(newPassword)
      setPasswordCopied(true)
      setTimeout(() => setPasswordCopied(false), 2000)
    }
  }

  // Busca dados do aluno
  const { data: student, isLoading: isLoadingStudent } = useQuery({
    queryKey: ['student', id],
    queryFn: () => api.get(`/users/${id}`).then((res) => res.data),
    enabled: !!id,
  })

  // Busca matrículas do aluno
  const { data: enrollments, isLoading: isLoadingEnrollments } = useQuery({
    queryKey: ['student-enrollments', id],
    queryFn: () => api.get(`/enrollments/user/${id}`).then((res) => res.data),
    enabled: !!id,
  })

  // Busca materiais disponíveis para o aluno
  const { data: materials, isLoading: isLoadingMaterials } = useQuery({
    queryKey: ['student-materials', id],
    queryFn: () => api.get(`/global-materials/user/${id}`).then((res) => res.data),
    enabled: !!id,
  })

  // Busca entregas do aluno
  const { data: offers, isLoading: isLoadingOffers } = useQuery({
    queryKey: ['student-offers', id],
    queryFn: () => api.get(`/offers/user/${id}`).then((res) => res.data),
    enabled: !!id,
  })

  // Busca todas as entregas disponíveis
  const { data: allOffers } = useQuery({
    queryKey: ['offers'],
    queryFn: () => api.get('/offers').then((res) => res.data),
    enabled: addOfferDialogOpen || addMaterialDialogOpen,
  })

  // Entregas que o aluno ainda não tem
  const availableOffers = allOffers?.filter(
    (offer: any) => !offers?.some((o: any) => o.id === offer.id)
  ) || []

  // Entregas com materiais que o aluno ainda não tem
  const offersWithMaterials = allOffers?.filter(
    (offer: any) => (offer.materials_count > 0 || offer.materials?.length > 0) && 
    !offers?.some((o: any) => o.id === offer.id)
  ) || []

  const getFileConfig = (fileType: string) => {
    return fileTypeConfig[fileType] || fileTypeConfig.other
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const mb = bytes / (1024 * 1024)
    if (mb >= 1) return `${mb.toFixed(1)} MB`
    const kb = bytes / 1024
    return `${kb.toFixed(0)} KB`
  }

  const deactivateMutation = useMutation({
    mutationFn: () => api.patch(`/users/${id}/deactivate`),
    onSuccess: () => {
      toast({ title: 'Aluno desativado com sucesso' })
      queryClient.invalidateQueries({ queryKey: ['student', id] })
    },
    onError: () => {
      toast({ title: 'Erro ao desativar aluno', variant: 'destructive' })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/users/${id}`),
    onSuccess: () => {
      toast({ title: 'Aluno deletado com sucesso' })
      router.push('/admin/students')
    },
    onError: () => {
      toast({ title: 'Erro ao deletar aluno', variant: 'destructive' })
    },
  })

  const resendAccessMutation = useMutation({
    mutationFn: () => api.post(`/users/${id}/resend-access`),
    onSuccess: () => {
      toast({ 
        title: 'Acesso reenviado com sucesso',
        description: 'Uma nova senha foi gerada e enviada por email.',
      })
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao reenviar acesso',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive' 
      })
    },
  })

  const sendEmailMutation = useMutation({
    mutationFn: ({ subject, message }: { subject: string; message: string }) =>
      api.post(`/users/${id}/send-email`, { subject, message }),
    onSuccess: () => {
      toast({ title: 'Email enviado com sucesso' })
      setSendEmailDialogOpen(false)
      setEmailSubject('')
      setEmailMessage('')
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar email',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const changePasswordMutation = useMutation({
    mutationFn: (password: string) => api.patch(`/users/${id}/password`, { password }),
    onSuccess: () => {
      toast({ 
        title: 'Senha alterada com sucesso',
        description: 'A nova senha já está ativa.',
      })
      setChangePasswordDialogOpen(false)
      setNewPassword('')
    },
    onError: (error: any) => {
      toast({ 
        title: 'Erro ao alterar senha',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive' 
      })
    },
  })

  // Mutation para adicionar entrega ao aluno
  const addOfferMutation = useMutation({
    mutationFn: (offerId: string) => api.post('/enrollments/offer', {
      user_id: id,
      offer_id: offerId,
    }),
    onSuccess: () => {
      toast({ title: 'Entrega adicionada com sucesso' })
      queryClient.invalidateQueries({ queryKey: ['student-offers', id] })
      queryClient.invalidateQueries({ queryKey: ['student-enrollments', id] })
      queryClient.invalidateQueries({ queryKey: ['student-materials', id] })
      setAddOfferDialogOpen(false)
      setSelectedOfferId('')
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar entrega',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  // Mutation para remover matrícula do aluno
  const removeEnrollmentMutation = useMutation({
    mutationFn: (enrollmentId: string) => api.delete(`/enrollments/${enrollmentId}`),
    onSuccess: () => {
      toast({ title: 'Acesso ao curso removido com sucesso' })
      queryClient.invalidateQueries({ queryKey: ['student-enrollments', id] })
      setRemoveEnrollmentDialogOpen(false)
      setSelectedEnrollment(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover acesso',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  // Mutation para remover entrega do aluno
  const removeOfferMutation = useMutation({
    mutationFn: (offerId: string) => api.delete(`/enrollments/offer/${id}/${offerId}`),
    onSuccess: () => {
      toast({ title: 'Entrega removida com sucesso' })
      queryClient.invalidateQueries({ queryKey: ['student-offers', id] })
      queryClient.invalidateQueries({ queryKey: ['student-enrollments', id] })
      queryClient.invalidateQueries({ queryKey: ['student-materials', id] })
      setRemoveOfferDialogOpen(false)
      setSelectedOffer(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover entrega',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  if (isLoadingStudent) {
    return <StudentDetailsSkeleton />
  }

  if (!student) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <h2 className="text-xl font-semibold">Aluno não encontrado</h2>
        <p className="text-muted-foreground mt-2">
          O aluno que você está procurando não existe ou foi removido.
        </p>
        <Button asChild className="mt-4">
          <Link href="/admin/students">Voltar para lista</Link>
        </Button>
      </div>
    )
  }

  const totalCourses = enrollments?.length || 0
  const completedCourses = enrollments?.filter(
    (e: any) => e.progress?.percentage === 100
  ).length || 0
  const averageProgress = totalCourses > 0
    ? Math.round(
        enrollments.reduce(
          (acc: number, e: any) => acc + (e.progress?.percentage || 0),
          0
        ) / totalCourses
      )
    : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/students">
              <ArrowLeft className="h-5 w-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Detalhes do Aluno</h1>
            <p className="text-muted-foreground">
              Visualize informações e progresso do aluno
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <MoreVertical className="h-4 w-4 mr-2" />
              Ações
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSendEmailDialogOpen(true)}>
              <Mail className="h-4 w-4 mr-2" />
              Enviar Email
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => resendAccessMutation.mutate()}
              disabled={resendAccessMutation.isPending}
            >
              <KeyRound className="h-4 w-4 mr-2" />
              {resendAccessMutation.isPending ? 'Reenviando...' : 'Reenviar Acesso'}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setChangePasswordDialogOpen(true)}>
              <KeyRound className="h-4 w-4 mr-2" />
              Alterar Senha
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-yellow-600"
              onClick={() => deactivateMutation.mutate()}
              disabled={!student.is_active}
            >
              <UserX className="h-4 w-4 mr-2" />
              {student.is_active ? 'Desativar' : 'Já desativado'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Deletar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Card de Perfil */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24">
                <AvatarImage src={student.avatar_url} />
                <AvatarFallback className="text-2xl">
                  {student.name?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h2 className="mt-4 text-xl font-semibold">{student.name}</h2>
              <Badge
                variant={student.is_active ? 'default' : 'secondary'}
                className="mt-2"
              >
                {student.is_active ? 'Ativo' : 'Inativo'}
              </Badge>
            </div>

            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3 text-sm group">
                <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-muted-foreground truncate">{student.email}</span>
                <button
                  onClick={copyEmail}
                  className="p-1 rounded hover:bg-muted transition-colors flex-shrink-0"
                  title="Copiar email"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-green-500" />
                  ) : (
                    <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </button>
              </div>
              {student.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-muted-foreground">{student.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Cadastrado em{' '}
                  {new Date(student.created_at).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  Último acesso:{' '}
                  {student.last_login_at
                    ? new Date(student.last_login_at).toLocaleDateString('pt-BR')
                    : 'Nunca'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Cards de Estatísticas e Cursos */}
        <div className="md:col-span-2 space-y-6">
          {/* Estatísticas */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                    <BookOpen className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Matrículas</p>
                    <p className="text-2xl font-bold">{totalCourses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                    <Award className="h-5 w-5 text-green-600 dark:text-green-300" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Concluídos</p>
                    <p className="text-2xl font-bold">{completedCourses}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                    <RotateCcw className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Progresso Médio
                    </p>
                    <p className="text-2xl font-bold">{averageProgress}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de Cursos */}
          <Card>
            <CardHeader>
              <CardTitle>Cursos Matriculados</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingEnrollments ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-20" />
                  ))}
                </div>
              ) : enrollments?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma matrícula encontrada</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {enrollments?.map((enrollment: any) => (
                    <div
                      key={enrollment.id}
                      className="flex items-center gap-4 p-4 rounded-lg border group hover:border-destructive/50 transition-colors"
                    >
                      <div className="h-16 w-24 rounded-md bg-muted overflow-hidden flex-shrink-0">
                        {enrollment.course?.thumbnail_url ? (
                          <img
                            src={enrollment.course.thumbnail_url}
                            alt={enrollment.course.title}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center">
                            <BookOpen className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {enrollment.course?.title || 'Curso não encontrado'}
                        </h4>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress
                            value={enrollment.progress?.percentage || 0}
                            className="h-2 flex-1"
                          />
                          <span className="text-sm text-muted-foreground whitespace-nowrap">
                            {enrollment.progress?.percentage || 0}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {enrollment.progress?.completed_lessons || 0} de{' '}
                          {enrollment.progress?.total_lessons || 0} aulas
                        </p>
                      </div>
                      <Badge
                        variant={
                          enrollment.status === 'active'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {enrollment.status === 'active'
                          ? 'Ativo'
                          : enrollment.status === 'completed'
                          ? 'Concluído'
                          : 'Inativo'}
                      </Badge>
                      <button
                        onClick={() => {
                          setSelectedEnrollment(enrollment)
                          setRemoveEnrollmentDialogOpen(true)
                        }}
                        className="p-2 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all"
                        title="Remover acesso ao curso"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de Entregas */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Entregas
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setAddOfferDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Entrega
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              {isLoadingOffers ? (
                <div className="space-y-3">
                  {[...Array(2)].map((_, i) => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : !offers || offers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhuma entrega encontrada</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {offers.map((offer: any) => (
                    <div
                      key={offer.id}
                      className="flex items-center gap-4 p-4 rounded-lg border group hover:border-destructive/50 transition-colors"
                    >
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">{offer.name}</h4>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span>{offer.courses_count} curso{offer.courses_count !== 1 ? 's' : ''}</span>
                          <span>•</span>
                          <span>{offer.materials_count} material{offer.materials_count !== 1 ? 'is' : ''}</span>
                          {offer.expires_at && (
                            <>
                              <span>•</span>
                              <span>
                                Expira em {new Date(offer.expires_at).toLocaleDateString('pt-BR')}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <Badge
                        variant={
                          offer.enrollment_status === 'active'
                            ? 'default'
                            : 'secondary'
                        }
                      >
                        {offer.enrollment_status === 'active'
                          ? 'Ativo'
                          : offer.enrollment_status === 'expired'
                          ? 'Expirado'
                          : 'Inativo'}
                      </Badge>
                      <button
                        onClick={() => {
                          setSelectedOffer(offer)
                          setRemoveOfferDialogOpen(true)
                        }}
                        className="p-2 rounded-md opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-destructive transition-all"
                        title="Remover entrega"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Lista de Materiais */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Materiais Disponíveis
              </CardTitle>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setAddMaterialDialogOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Liberar Materiais via Entrega
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </CardHeader>
            <CardContent>
              {isLoadingMaterials ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={i} className="h-14" />
                  ))}
                </div>
              ) : !materials || materials.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FolderOpen className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum material disponível</p>
                  <p className="text-xs mt-1">
                    Os materiais são liberados através das entregas
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {materials.map((material: any) => {
                    const config = getFileConfig(material.file_type)
                    return (
                      <div
                        key={material.id}
                        className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className={`flex-shrink-0 p-2 rounded-lg bg-muted ${config.color}`}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">
                            {material.title}
                          </h4>
                          <p className="text-xs text-muted-foreground">
                            {config.label}
                            {material.file_size && ` • ${formatFileSize(material.file_size)}`}
                          </p>
                        </div>
                        <a
                          href={material.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-muted rounded-md transition-colors"
                        >
                          <ExternalLink className="h-4 w-4 text-muted-foreground" />
                        </a>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogo de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar aluno?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <strong>permanente</strong> e não pode ser desfeita. O
              aluno <strong>{student.name}</strong> será removido junto com
              todas as suas matrículas e progresso nos cursos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? 'Deletando...' : 'Deletar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para Adicionar Entrega */}
      <Dialog open={addOfferDialogOpen} onOpenChange={setAddOfferDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Entrega</DialogTitle>
            <DialogDescription>
              Selecione uma entrega para liberar ao aluno. Isso dará acesso a todos os cursos e materiais da entrega.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="offer">Entrega</Label>
            <Select value={selectedOfferId} onValueChange={setSelectedOfferId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione uma entrega" />
              </SelectTrigger>
              <SelectContent>
                {availableOffers.length === 0 ? (
                  <SelectItem value="_empty" disabled>
                    Nenhuma entrega disponível
                  </SelectItem>
                ) : (
                  availableOffers.map((offer: any) => (
                    <SelectItem key={offer.id} value={offer.id}>
                      {offer.name} ({offer.courses_count || offer.courses?.length || 0} cursos, {offer.materials_count || offer.materials?.length || 0} materiais)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOfferDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => addOfferMutation.mutate(selectedOfferId)}
              disabled={!selectedOfferId || addOfferMutation.isPending}
            >
              {addOfferMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo para Liberar Materiais via Entrega */}
      <Dialog open={addMaterialDialogOpen} onOpenChange={setAddMaterialDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Liberar Materiais</DialogTitle>
            <DialogDescription>
              Os materiais são liberados através das entregas. Selecione uma entrega que contenha os materiais desejados.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="material-offer">Entrega com Materiais</Label>
            <Select value={selectedMaterialOfferId} onValueChange={setSelectedMaterialOfferId}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione uma entrega" />
              </SelectTrigger>
              <SelectContent>
                {offersWithMaterials.length === 0 ? (
                  <SelectItem value="_empty" disabled>
                    Nenhuma entrega com materiais disponível
                  </SelectItem>
                ) : (
                  offersWithMaterials.map((offer: any) => (
                    <SelectItem key={offer.id} value={offer.id}>
                      {offer.name} ({offer.materials_count || offer.materials?.length || 0} materiais)
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              Isso também liberará os cursos incluídos na entrega.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddMaterialDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                addOfferMutation.mutate(selectedMaterialOfferId)
                setAddMaterialDialogOpen(false)
                setSelectedMaterialOfferId('')
              }}
              disabled={!selectedMaterialOfferId || addOfferMutation.isPending}
            >
              {addOfferMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Liberar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação para Remover Acesso ao Curso */}
      <AlertDialog open={removeEnrollmentDialogOpen} onOpenChange={setRemoveEnrollmentDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover acesso ao curso?</AlertDialogTitle>
            <AlertDialogDescription>
              O aluno <strong>{student.name}</strong> perderá o acesso ao curso{' '}
              <strong>{selectedEnrollment?.course?.title}</strong>. 
              Todo o progresso será mantido, mas ele não poderá mais acessar o conteúdo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedEnrollment(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeEnrollmentMutation.mutate(selectedEnrollment?.id)}
              disabled={removeEnrollmentMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeEnrollmentMutation.isPending ? 'Removendo...' : 'Remover Acesso'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo para Alterar Senha */}
      <Dialog open={changePasswordDialogOpen} onOpenChange={(open) => {
        setChangePasswordDialogOpen(open)
        if (!open) {
          setNewPassword('')
          setShowPassword(false)
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha</DialogTitle>
            <DialogDescription>
              Digite uma nova senha para o aluno <strong>{student.name}</strong> ou gere uma senha forte automaticamente.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">Nova Senha</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Digite a nova senha"
                    className="pr-20"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1.5 rounded hover:bg-muted transition-colors"
                      title={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                    {newPassword && (
                      <button
                        type="button"
                        onClick={copyPassword}
                        className="p-1.5 rounded hover:bg-muted transition-colors"
                        title="Copiar senha"
                      >
                        {passwordCopied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateStrongPassword}
                  className="shrink-0"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Gerar Forte
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                A senha deve ter pelo menos 6 caracteres.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChangePasswordDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => changePasswordMutation.mutate(newPassword)}
              disabled={!newPassword || newPassword.length < 6 || changePasswordMutation.isPending}
            >
              {changePasswordMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Diálogo de Confirmação para Remover Entrega */}
      <AlertDialog open={removeOfferDialogOpen} onOpenChange={setRemoveOfferDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover entrega?</AlertDialogTitle>
            <AlertDialogDescription>
              O aluno <strong>{student.name}</strong> perderá o acesso à entrega{' '}
              <strong>{selectedOffer?.name}</strong> e todos os cursos/materiais vinculados a ela.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSelectedOffer(null)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => removeOfferMutation.mutate(selectedOffer?.id)}
              disabled={removeOfferMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {removeOfferMutation.isPending ? 'Removendo...' : 'Remover Entrega'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog — Enviar Email */}
      <Dialog open={sendEmailDialogOpen} onOpenChange={setSendEmailDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enviar Email</DialogTitle>
            <DialogDescription>
              Envie um email personalizado para {student?.name}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1">
              <Label htmlFor="email-subject">Assunto</Label>
              <Input
                id="email-subject"
                placeholder="Digite o assunto do email"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="email-message">Mensagem</Label>
              <textarea
                id="email-message"
                className="w-full min-h-[140px] rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
                placeholder="Digite a mensagem do email..."
                value={emailMessage}
                onChange={(e) => setEmailMessage(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSendEmailDialogOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => sendEmailMutation.mutate({ subject: emailSubject, message: emailMessage })}
              disabled={sendEmailMutation.isPending || !emailSubject.trim() || !emailMessage.trim()}
            >
              {sendEmailMutation.isPending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Enviando...</>
              ) : (
                <><Mail className="h-4 w-4 mr-2" />Enviar Email</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function StudentDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-10 rounded" />
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col items-center">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-6 w-32 mt-4" />
              <Skeleton className="h-5 w-16 mt-2" />
            </div>
            <div className="mt-6 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
        <div className="md:col-span-2 space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <Skeleton className="h-12 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-40" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-20" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
