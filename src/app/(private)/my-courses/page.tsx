'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { 
  BookOpen, 
  Clock, 
  Award,
  Play,
  Loader2,
  GraduationCap
} from 'lucide-react'
import { api } from '@/lib/api'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'

interface Enrollment {
  id: string
  status: string
  enrolled_at: string
  expires_at: string | null
  course: {
    id: string
    title: string
    slug: string
    thumbnail_url: string | null
    total_modules: number
    total_duration_minutes: number
  }
  progress: {
    total_lessons: number
    completed_lessons: number
    percentage: number
  }
  has_certificate: boolean
  certificate_available: boolean
}

export default function MyCoursesPage() {
  const { data: enrollments = [], isLoading } = useQuery<Enrollment[]>({
    queryKey: ['my-courses'],
    queryFn: () => api.get('/enrollments/my-courses').then(res => res.data),
  })

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meus Cursos</h1>
        <p className="text-muted-foreground">
          Continue de onde parou ou comece um novo curso
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : enrollments.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <GraduationCap className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum curso ainda</h3>
          <p className="text-muted-foreground mb-4">
            Você ainda não está matriculado em nenhum curso.
          </p>
          <Button asChild>
            <Link href="/dashboard">Ir para o Dashboard</Link>
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => (
            <Link key={enrollment.id} href={`/course/${enrollment.course.slug}`}>
              <Card className="overflow-hidden group hover:border-primary/50 transition-colors cursor-pointer h-full flex flex-col">
                <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5">
                  {enrollment.course.thumbnail_url ? (
                    <img
                      src={enrollment.course.thumbnail_url}
                      alt={enrollment.course.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="w-12 h-12 text-muted-foreground/50" />
                    </div>
                  )}
                  {enrollment.progress.percentage === 100 && (
                    <div className="absolute top-2 right-2">
                      <Badge className="bg-green-500">
                        <Award className="w-3 h-3 mr-1" />
                        Concluído
                      </Badge>
                    </div>
                  )}
                </div>
                
                <CardHeader className="pb-2 flex-1">
                  <h3 className="font-semibold text-lg line-clamp-2">
                    {enrollment.course.title}
                  </h3>
                </CardHeader>

                <CardContent className="pb-2">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                    <div className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {enrollment.course.total_modules} módulos
                    </div>
                    {enrollment.course.total_duration_minutes > 0 && (
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {formatDuration(enrollment.course.total_duration_minutes)}
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">{enrollment.progress.percentage}%</span>
                    </div>
                    <Progress value={enrollment.progress.percentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {enrollment.progress.completed_lessons} de {enrollment.progress.total_lessons} aulas concluídas
                    </p>
                  </div>
                </CardContent>

                <CardFooter className="pt-2">
                  <Button className="w-full group-hover:bg-primary" variant="outline">
                    <Play className="w-4 h-4 mr-2" />
                    {enrollment.progress.percentage === 0 
                      ? 'Começar' 
                      : enrollment.progress.percentage === 100 
                        ? 'Revisar' 
                        : 'Continuar'}
                  </Button>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
