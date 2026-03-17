'use client'

import { motion } from 'framer-motion'
import { Users, PlayCircle, Target, Trophy, TrendingDown } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCourseFunnel } from '../hooks/use-analytics'

interface CourseFunnelProps {
  courseId: string
}

export function CourseFunnel({ courseId }: CourseFunnelProps) {
  const { data: funnel, isLoading } = useCourseFunnel(courseId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-primary" />
            Funil de Conversão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!funnel) return null

  const stages = [
    {
      label: 'Matriculados',
      value: funnel.total_enrollments,
      icon: Users,
      color: 'bg-blue-500',
      width: '100%',
    },
    {
      label: 'Iniciaram',
      value: funnel.started,
      rate: funnel.funnel_rates.enrollment_to_start,
      icon: PlayCircle,
      color: 'bg-violet-500',
      width: `${Math.max(funnel.funnel_rates.enrollment_to_start, 10)}%`,
    },
    {
      label: '50% Concluído',
      value: funnel.halfway,
      rate: funnel.funnel_rates.start_to_halfway,
      icon: Target,
      color: 'bg-amber-500',
      width: funnel.total_enrollments > 0 
        ? `${Math.max((funnel.halfway / funnel.total_enrollments) * 100, 10)}%`
        : '10%',
    },
    {
      label: 'Concluíram',
      value: funnel.completed,
      rate: funnel.funnel_rates.overall_completion,
      icon: Trophy,
      color: 'bg-emerald-500',
      width: funnel.total_enrollments > 0 
        ? `${Math.max((funnel.completed / funnel.total_enrollments) * 100, 10)}%`
        : '10%',
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingDown className="h-5 w-5 text-primary" />
          Funil de Conversão
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {stages.map((stage, index) => (
          <motion.div
            key={stage.label}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            <div
              className={`${stage.color} rounded-lg p-4 transition-all`}
              style={{ width: stage.width }}
            >
              <div className="flex items-center justify-between text-white">
                <div className="flex items-center gap-2">
                  <stage.icon className="h-5 w-5" />
                  <span className="font-medium">{stage.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-bold">{stage.value}</span>
                  {stage.rate !== undefined && (
                    <span className="text-sm opacity-80">({stage.rate}%)</span>
                  )}
                </div>
              </div>
            </div>
            
            {/* Seta de conexão */}
            {index < stages.length - 1 && (
              <div className="flex items-center justify-center py-1">
                <div className="w-0.5 h-4 bg-muted-foreground/20" />
              </div>
            )}
          </motion.div>
        ))}

        {/* Resumo */}
        <div className="mt-6 pt-4 border-t border-border">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Taxa de Conclusão</p>
              <p className="text-3xl font-bold text-primary">
                {funnel.funnel_rates.overall_completion}%
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total de Aulas</p>
              <p className="text-3xl font-bold">
                {funnel.total_lessons}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
