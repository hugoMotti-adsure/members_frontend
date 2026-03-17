'use client'

import { motion } from 'framer-motion'
import { Flame, Eye, CheckCircle, Clock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { useCourseLessonHeatmap } from '../hooks/use-analytics'
import { cn } from '@/lib/utils'

interface LessonHeatmapProps {
  courseId: string
}

const heatColors = {
  hot: 'bg-emerald-500 hover:bg-emerald-600',
  warm: 'bg-amber-500 hover:bg-amber-600',
  cold: 'bg-orange-500 hover:bg-orange-600',
  freezing: 'bg-red-500 hover:bg-red-600',
}

const heatLabels = {
  hot: 'Alta conclusão (75%+)',
  warm: 'Boa conclusão (50-75%)',
  cold: 'Baixa conclusão (25-50%)',
  freezing: 'Muito baixa (<25%)',
}

function formatSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return `${hours}h ${remainingMinutes}m`
}

export function LessonHeatmap({ courseId }: LessonHeatmapProps) {
  const { data: heatmapData, isLoading } = useCourseLessonHeatmap(courseId)

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            Mapa de Calor das Aulas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((j) => (
                    <div key={j} className="h-12 w-12 bg-muted animate-pulse rounded" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!heatmapData) return null

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            Mapa de Calor das Aulas
          </CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Legenda:</span>
            {Object.entries(heatColors).map(([level, color]) => (
              <TooltipProvider key={level}>
                <Tooltip>
                  <TooltipTrigger>
                    <div className={cn('w-4 h-4 rounded', color.split(' ')[0])} />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{heatLabels[level as keyof typeof heatLabels]}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {heatmapData.total_enrollments} alunos matriculados
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <TooltipProvider>
          {heatmapData.modules.map((module, moduleIndex) => (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: moduleIndex * 0.1 }}
              className="space-y-2"
            >
              <h4 className="text-sm font-medium text-muted-foreground">
                Módulo {moduleIndex + 1}: {module.title}
              </h4>
              <div className="flex flex-wrap gap-2">
                {module.lessons.map((lesson, lessonIndex) => (
                  <Tooltip key={lesson.id}>
                    <TooltipTrigger asChild>
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: moduleIndex * 0.1 + lessonIndex * 0.05 }}
                        className={cn(
                          'w-12 h-12 rounded-lg flex items-center justify-center text-white font-medium cursor-pointer transition-all',
                          heatColors[lesson.heat_level]
                        )}
                      >
                        {lessonIndex + 1}
                      </motion.div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[280px]">
                      <div className="space-y-2">
                        <p className="font-medium">{lesson.title}</p>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-1">
                            <Eye className="h-3 w-3" />
                            <span>{lesson.views} views</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>{lesson.completions} conclusões</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Flame className="h-3 w-3" />
                            <span>{lesson.completion_rate}% taxa</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{formatSeconds(lesson.avg_watched_seconds)} média</span>
                          </div>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </motion.div>
          ))}
        </TooltipProvider>

        {heatmapData.modules.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <Flame className="h-12 w-12 mx-auto mb-2 opacity-20" />
            <p>Nenhum módulo publicado neste curso</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
