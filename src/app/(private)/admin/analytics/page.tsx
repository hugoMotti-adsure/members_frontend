'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useQueryClient } from '@tanstack/react-query'
import {
  RealtimeStatsCards,
  ActiveSessionsList,
  LiveActivityFeed,
  WorldMap,
  AnalyticsCharts,
  CourseSelector,
  CourseFunnel,
  LessonHeatmap,
  CourseComparison,
  CourseRealtimeStats,
  CourseAnalyticsCharts,
} from '@/features/analytics'
import { useCoursesForSelector } from '@/features/analytics/hooks/use-analytics'

export default function AnalyticsPage() {
  const queryClient = useQueryClient()
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null)
  const { data: courses } = useCoursesForSelector()

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['analytics'] })
  }

  const selectedCourse = courses?.find(c => c.id === selectedCourseId)

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-primary" />
            Analytics em Tempo Real
          </h1>
          <p className="text-muted-foreground mt-1">
            {selectedCourse 
              ? `Métricas do curso: ${selectedCourse.title}`
              : 'Monitore a atividade dos seus alunos em tempo real'
            }
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          className="gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </Button>
      </motion.div>

      {/* Course Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <CourseSelector 
          selectedCourseId={selectedCourseId} 
          onSelectCourse={setSelectedCourseId} 
        />
      </motion.div>

      {/* Conteúdo baseado na seleção */}
      {selectedCourseId === null ? (
        // Visão Geral (comportamento original + comparativo)
        <>
          {/* Realtime Stats Cards */}
          <RealtimeStatsCards />

          {/* Course Comparison */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <CourseComparison />
          </motion.div>

          {/* World Map */}
          <WorldMap />

          {/* Active Sessions & Live Feed */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ActiveSessionsList />
            <LiveActivityFeed />
          </div>

          {/* Charts */}
          <AnalyticsCharts />
        </>
      ) : (
        // Visão por Curso
        <>
          {/* Course Realtime Stats */}
          <CourseRealtimeStats courseId={selectedCourseId} />

          {/* Funnel & Heatmap */}
          <div className="grid gap-6 lg:grid-cols-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <CourseFunnel courseId={selectedCourseId} />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <LessonHeatmap courseId={selectedCourseId} />
            </motion.div>
          </div>

          {/* Course Charts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <CourseAnalyticsCharts courseId={selectedCourseId} />
          </motion.div>

          {/* World Map for this course */}
          <WorldMap />

          {/* Active Sessions & Live Feed for this course */}
          <div className="grid gap-6 lg:grid-cols-2">
            <ActiveSessionsList />
            <LiveActivityFeed />
          </div>
        </>
      )}
    </div>
  )
}
