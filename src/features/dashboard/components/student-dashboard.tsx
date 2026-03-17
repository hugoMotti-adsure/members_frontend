'use client'

import { useQuery } from '@tanstack/react-query'
import { BookOpen, Play, Award, Clock, CheckCircle, ChevronRight, Layers, Trophy } from 'lucide-react'
import Link from 'next/link'
import { api } from '@/lib/api'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useViewModeStore } from '@/features/auth/stores/view-mode.store'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

// Formata duração em minutos para texto legível
function formatDuration(minutes: number): string {
  if (!minutes || minutes === 0) return ''
  if (minutes < 60) return `${minutes}min`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

export function StudentDashboard() {
  const { user } = useAuthStore()
  const { isStudentView } = useViewModeStore()

  // No modo preview, busca todos os cursos publicados
  // No modo normal, busca apenas os cursos matriculados
  const { data: myCourses, isLoading: loadingCourses } = useQuery({
    queryKey: isStudentView ? ['preview-courses'] : ['my-courses'],
    queryFn: async () => {
      if (isStudentView) {
        // No preview, busca todos os cursos publicados e simula como se fossem matrículas
        const res = await api.get('/courses', { params: { status: 'published' } })
        // Transforma para o mesmo formato de enrollment
        return res.data.map((course: any) => ({
          id: course.id,
          course: course,
          progress: { percentage: 0, completed_lessons: 0 },
          has_certificate: false,
          certificate_available: false,
        }))
      }
      return api.get('/enrollments/my-courses').then((res) => res.data)
    },
  })

  // Busca certificados do aluno (não no preview)
  const { data: myCertificates } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: () => api.get('/certificates/my').then((res) => res.data),
    enabled: !isStudentView, // Desabilita no modo preview
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Olá, {user?.name?.split(' ')[0]}! 👋</h1>
        <p className="text-muted-foreground">Continue de onde parou</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Meus Cursos
            </CardTitle>
            <BookOpen className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myCourses?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Em Andamento
            </CardTitle>
            <Play className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {myCourses?.filter((c: any) => (c.progress?.percentage || 0) < 100).length || 0}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Certificados
            </CardTitle>
            <Award className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myCertificates?.length || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* My Courses */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Meus Cursos</h2>
          <Link href="/my-courses">
            <Button variant="ghost" size="sm">
              Ver todos
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>

        {loadingCourses ? (
          <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-lg overflow-hidden bg-zinc-900">
                <div className="aspect-[4/3] bg-zinc-800" />
                <div className="p-2.5">
                  <div className="h-3.5 bg-zinc-800 rounded w-full mb-2" />
                  <div className="h-2.5 bg-zinc-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : myCourses?.length === 0 ? (
          <Card className="p-8 text-center">
            <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum curso encontrado</h3>
            <p className="text-muted-foreground mb-4">
              Você ainda não está matriculado em nenhum curso.
            </p>
            <Link href="/courses">
              <Button>Explorar Cursos</Button>
            </Link>
          </Card>
        ) : (
          <div className="grid gap-2.5 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {myCourses?.slice(0, 12).map((enrollment: any) => {
              const percentage = enrollment.progress?.percentage || 0
              const isCompleted = percentage === 100
              const hasCertificate = enrollment.has_certificate
              const certificateAvailable = enrollment.certificate_available && !hasCertificate
              
              return (
                <Link key={enrollment.id} href={`/course/${enrollment.course?.slug}`}>
                  <div className="group relative rounded-lg overflow-hidden bg-zinc-900/50 border border-zinc-800/50 hover:border-zinc-700 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-black/20">
                    {/* Thumbnail */}
                    <div className="relative aspect-[4/3] bg-gradient-to-br from-zinc-800 to-zinc-900 overflow-hidden">
                      {enrollment.course?.thumbnail_url ? (
                        <img
                          src={enrollment.course.thumbnail_url}
                          alt={enrollment.course.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 via-zinc-850 to-zinc-900">
                          <BookOpen className="w-8 h-8 text-zinc-700" />
                        </div>
                      )}
                      
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                      
                      {/* Badges no topo */}
                      <div className="absolute top-1.5 left-1.5 right-1.5 flex items-start justify-between">
                        {/* Certificado disponível */}
                        {certificateAvailable && (
                          <span className="flex items-center gap-0.5 bg-amber-500 text-black text-[9px] font-semibold px-1.5 py-0.5 rounded">
                            <Trophy className="w-2.5 h-2.5" />
                            Certificado
                          </span>
                        )}
                        {hasCertificate && (
                          <span className="flex items-center gap-0.5 bg-emerald-500 text-black text-[9px] font-semibold px-1.5 py-0.5 rounded">
                            <Award className="w-2.5 h-2.5" />
                            Certificado
                          </span>
                        )}
                        {isCompleted && !hasCertificate && !certificateAvailable && (
                          <span className="flex items-center gap-0.5 bg-emerald-500 text-black text-[9px] font-semibold px-1.5 py-0.5 rounded">
                            <CheckCircle className="w-2.5 h-2.5" />
                            Concluído
                          </span>
                        )}
                      </div>
                      
                      {/* Progresso circular no canto inferior direito */}
                      <div className="absolute bottom-1.5 right-1.5">
                        <div className="relative w-8 h-8">
                          <svg className="w-8 h-8 -rotate-90" viewBox="0 0 36 36">
                            <circle
                              cx="18"
                              cy="18"
                              r="14"
                              fill="none"
                              stroke="rgba(0,0,0,0.5)"
                              strokeWidth="3"
                            />
                            <circle
                              cx="18"
                              cy="18"
                              r="14"
                              fill="none"
                              stroke={isCompleted ? '#10b981' : '#ec4899'}
                              strokeWidth="3"
                              strokeDasharray={`${percentage * 0.88} 88`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-white">
                            {percentage}%
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Content */}
                    <div className="p-2.5">
                      <h3 className="font-medium text-xs line-clamp-2 leading-tight text-zinc-100 group-hover:text-white transition-colors min-h-[2rem]">
                        {enrollment.course?.title}
                      </h3>
                      
                      {/* Meta info */}
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-zinc-500">
                        {enrollment.course?.total_modules > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Layers className="w-2.5 h-2.5" />
                            {enrollment.course.total_modules} {enrollment.course.total_modules === 1 ? 'módulo' : 'módulos'}
                          </span>
                        )}
                        {enrollment.course?.total_duration_minutes > 0 && (
                          <span className="flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatDuration(enrollment.course.total_duration_minutes)}
                          </span>
                        )}
                      </div>
                      
                      {/* Progress bar minimalista */}
                      <div className="mt-2 h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all ${isCompleted ? 'bg-emerald-500' : 'bg-primary'}`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Certificates */}
      {myCertificates?.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Meus Certificados</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {myCertificates?.map((cert: any) => (
              <Card key={cert.id} className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-500/10 rounded-lg">
                    <Award className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium truncate">{cert.course?.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Emitido em {new Date(cert.issued_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
