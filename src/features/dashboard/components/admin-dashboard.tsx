'use client'

import { useQuery } from '@tanstack/react-query'
import { BookOpen, Users, Award, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => api.get('/analytics/dashboard').then((res) => res.data),
  })

  const { data: recentActivity } = useQuery({
    queryKey: ['recent-activity'],
    queryFn: () => api.get('/analytics/recent-activity?limit=5').then((res) => res.data),
  })

  const { data: topStudents } = useQuery({
    queryKey: ['top-students'],
    queryFn: () => api.get('/analytics/top-students?limit=5').then((res) => res.data),
  })

  const statCards = [
    {
      title: 'Total de Alunos',
      value: stats?.total_students || 0,
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Cursos Publicados',
      value: stats?.published_courses || 0,
      icon: BookOpen,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Matrículas Ativas',
      value: stats?.active_enrollments || 0,
      icon: TrendingUp,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Certificados Emitidos',
      value: stats?.certificates_issued || 0,
      icon: Award,
      color: 'text-yellow-500',
      bgColor: 'bg-yellow-500/10',
    },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral da sua área de membros</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat, index) => (
          <Card key={index}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {isLoading ? '...' : stat.value.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Top Students */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-500" />
              Top Alunos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topStudents?.map((student: any, index: number) => (
                <div key={student.id} className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {student.completed_lessons} aulas concluídas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-green-500">
                      {student.completed_courses} cursos
                    </p>
                  </div>
                </div>
              ))}
              {(!topStudents || topStudents.length === 0) && (
                <p className="text-muted-foreground text-center py-4">
                  Nenhum aluno encontrado
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-500" />
              Atividade Recente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity?.map((activity: any) => (
                <div key={activity.id} className="flex items-start gap-4">
                  <div
                    className={`p-2 rounded-lg ${
                      activity.is_completed ? 'bg-green-500/10' : 'bg-blue-500/10'
                    }`}
                  >
                    {activity.is_completed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <Clock className="h-4 w-4 text-blue-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{activity.user?.name}</p>
                    <p className="text-sm text-muted-foreground truncate">
                      {activity.is_completed ? 'Concluiu' : 'Assistiu'}{' '}
                      {activity.lesson?.title}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(activity.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              ))}
              {(!recentActivity || recentActivity.length === 0) && (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma atividade recente
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
