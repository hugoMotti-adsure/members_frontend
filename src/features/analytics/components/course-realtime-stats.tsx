'use client'

import { motion } from 'framer-motion'
import { 
  Users, 
  PlayCircle, 
  Eye, 
  CheckCircle, 
  Download,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { useCourseRealtimeStats } from '../hooks/use-analytics'

interface CourseRealtimeStatsProps {
  courseId: string
}

export function CourseRealtimeStats({ courseId }: CourseRealtimeStatsProps) {
  const { data: stats, isLoading } = useCourseRealtimeStats(courseId)

  const cards = [
    {
      title: 'Usuários Online',
      value: stats?.users_online || 0,
      icon: Users,
      color: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20',
      pulse: true,
    },
    {
      title: 'Assistindo Aulas',
      value: stats?.watching_lessons || 0,
      icon: PlayCircle,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
    },
    {
      title: 'Views (última hora)',
      value: stats?.page_views_last_hour || 0,
      icon: Eye,
      color: 'text-violet-500',
      bgColor: 'bg-violet-500/10',
      borderColor: 'border-violet-500/20',
    },
    {
      title: 'Aulas Concluídas (24h)',
      value: stats?.lessons_completed_today || 0,
      icon: CheckCircle,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
    },
    {
      title: 'Downloads (24h)',
      value: stats?.downloads_today || 0,
      icon: Download,
      color: 'text-amber-500',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20',
    },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className={`border ${card.borderColor} overflow-hidden`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-lg ${card.bgColor}`}>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </div>
                {card.pulse && stats?.users_online && stats.users_online > 0 && (
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                  </span>
                )}
              </div>
              <div className="mt-3">
                <p className="text-xs text-muted-foreground font-medium">
                  {card.title}
                </p>
                <p className="text-2xl font-bold mt-1">
                  {isLoading ? (
                    <span className="inline-block w-12 h-7 bg-muted animate-pulse rounded" />
                  ) : (
                    card.value.toLocaleString()
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  )
}
