'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Eye,
  PlayCircle,
  CheckCircle,
  Download,
  LogIn,
  LogOut,
  Award,
  UserPlus,
  Search,
  MessageCircle,
  FileText,
  Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useLiveEvents } from '../hooks/use-analytics'
import { EVENT_LABELS, EVENT_COLORS, type EventType, type LiveEvent } from '../types'

const eventIcons: Record<EventType, any> = {
  page_view: Eye,
  lesson_start: PlayCircle,
  lesson_progress: PlayCircle,
  lesson_complete: CheckCircle,
  material_download: Download,
  material_view: FileText,
  login: LogIn,
  logout: LogOut,
  enrollment: UserPlus,
  certificate_generated: Award,
  search: Search,
  comment_added: MessageCircle,
}

function EventItem({ event }: { event: LiveEvent }) {
  const Icon = eventIcons[event.event_type] || Activity
  const colorClass = EVENT_COLORS[event.event_type] || 'bg-gray-500'

  const getEventDescription = () => {
    switch (event.event_type) {
      case 'lesson_start':
      case 'lesson_progress':
      case 'lesson_complete':
        return event.lesson?.title || 'Aula'
      case 'material_download':
      case 'material_view':
        return event.material?.title || 'Material'
      case 'enrollment':
        return event.course?.title || 'Curso'
      case 'search':
        return event.event_data?.query || 'Pesquisa'
      default:
        return event.course?.title || event.lesson?.title || ''
    }
  }

  const description = getEventDescription()

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="flex items-start gap-3 py-3 border-b border-border/50 last:border-0"
    >
      <Avatar className="h-8 w-8">
        <AvatarImage src={event.user.avatar_url} alt={event.user.name} />
        <AvatarFallback className="text-xs">
          {event.user.name?.charAt(0).toUpperCase() || 'U'}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium truncate">{event.user.name}</p>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs text-white ${colorClass}`}>
            <Icon className="h-3 w-3" />
            {EVENT_LABELS[event.event_type]}
          </span>
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {description}
          </p>
        )}
      </div>

      <div className="text-xs text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(new Date(event.created_at), {
          addSuffix: true,
          locale: ptBR,
        })}
      </div>
    </motion.div>
  )
}

export function LiveActivityFeed() {
  const { data: events, isLoading } = useLiveEvents(30, 3000)

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Activity className="h-5 w-5 text-blue-500" />
          Atividade em Tempo Real
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4 pb-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-start gap-3 py-3 animate-pulse">
                  <div className="h-8 w-8 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-40 bg-muted rounded" />
                    <div className="h-3 w-24 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : events && events.length > 0 ? (
            <AnimatePresence mode="popLayout">
              {events.map((event) => (
                <EventItem key={event.id} event={event} />
              ))}
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
              <Activity className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">Nenhuma atividade recente</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
