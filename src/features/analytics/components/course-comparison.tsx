'use client'

import { motion } from 'framer-motion'
import { 
  BarChart3, 
  Users, 
  CheckCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  BookOpen,
  Activity 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { useCoursesComparison } from '../hooks/use-analytics'
import { cn } from '@/lib/utils'

const trendIcons = {
  up: TrendingUp,
  down: TrendingDown,
  stable: Minus,
}

const trendColors = {
  up: 'text-emerald-500',
  down: 'text-red-500',
  stable: 'text-muted-foreground',
}

export function CourseComparison() {
  const { data: courses, isLoading } = useCoursesComparison()

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Comparativo de Cursos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!courses || courses.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Comparativo de Cursos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum curso encontrado</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Ordenar por matrículas totais
  const sortedCourses = [...courses].sort((a, b) => b.total_enrollments - a.total_enrollments)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-primary" />
          Comparativo de Cursos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedCourses.map((course, index) => {
          const TrendIcon = trendIcons[course.trend]
          
          return (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="p-4 rounded-lg border border-border bg-card/50 hover:bg-card transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="shrink-0">
                  {course.thumbnail_url ? (
                    <img
                      src={course.thumbnail_url}
                      alt={course.title}
                      className="w-16 h-10 rounded object-cover"
                    />
                  ) : (
                    <div className="w-16 h-10 rounded bg-muted flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium truncate">{course.title}</h4>
                    {!course.is_published && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                        Draft
                      </Badge>
                    )}
                    {course.active_now > 0 && (
                      <Badge variant="default" className="text-[10px] px-1.5 py-0 bg-emerald-500">
                        <Activity className="h-3 w-3 mr-1" />
                        {course.active_now} online
                      </Badge>
                    )}
                  </div>

                  {/* Progress bar */}
                  <div className="flex items-center gap-2 mb-2">
                    <Progress value={course.completion_rate} className="h-2 flex-1" />
                    <span className="text-xs text-muted-foreground w-12 text-right">
                      {course.completion_rate}%
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {course.total_enrollments} matrículas
                    </span>
                    <span className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      {course.completed} concluídos
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3 w-3" />
                      {course.total_lessons} aulas
                    </span>
                    <span className={cn('flex items-center gap-1', trendColors[course.trend])}>
                      <TrendIcon className="h-3 w-3" />
                      {course.recent_enrollments} (7d)
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* Resumo geral */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-xs text-muted-foreground">Total Cursos</p>
              <p className="text-xl font-bold">{courses.length}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Matrículas</p>
              <p className="text-xl font-bold">
                {courses.reduce((acc, c) => acc + c.total_enrollments, 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Concluídos</p>
              <p className="text-xl font-bold">
                {courses.reduce((acc, c) => acc + c.completed, 0)}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Online Agora</p>
              <p className="text-xl font-bold text-emerald-500">
                {courses.reduce((acc, c) => acc + c.active_now, 0)}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
