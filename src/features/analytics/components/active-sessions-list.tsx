'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { 
  Monitor, 
  Smartphone, 
  Tablet, 
  PlayCircle,
  Globe,
  Clock
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useActiveSessions } from '../hooks/use-analytics'
import type { ActiveSession } from '../types'

const deviceIcons = {
  desktop: Monitor,
  mobile: Smartphone,
  tablet: Tablet,
}

function SessionItem({ session }: { session: ActiveSession }) {
  const DeviceIcon = deviceIcons[session.device_type as keyof typeof deviceIcons] || Monitor
  const isWatching = !!session.current_lesson_id

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="flex items-start gap-3 p-3 rounded-lg bg-card hover:bg-accent/50 transition-colors border border-border/50"
    >
      <div className="relative">
        <Avatar className="h-10 w-10">
          <AvatarImage src={session.user.avatar_url} alt={session.user.name} />
          <AvatarFallback>
            {session.user.name?.charAt(0).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 ring-2 ring-background">
          <span className="animate-pulse h-2 w-2 rounded-full bg-white" />
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{session.user.name}</p>
          {isWatching && (
            <Badge variant="secondary" className="bg-blue-500/10 text-blue-500 text-xs">
              <PlayCircle className="h-3 w-3 mr-1" />
              Assistindo
            </Badge>
          )}
        </div>

        {isWatching && session.current_lesson && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {session.current_lesson.title}
            {session.current_lesson.modules?.courses && (
              <span className="opacity-70"> • {session.current_lesson.modules.courses.title}</span>
            )}
          </p>
        )}

        {!isWatching && session.current_page && (
          <p className="text-xs text-muted-foreground mt-1 truncate">
            {session.current_page}
          </p>
        )}

        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <DeviceIcon className="h-3 w-3" />
            <span>{session.browser || 'Navegador'}</span>
          </div>
          {session.city && (
            <div className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              <span>{session.city}, {session.country_code}</span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>
              {formatDistanceToNow(new Date(session.last_activity_at), {
                addSuffix: true,
                locale: ptBR,
              })}
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

export function ActiveSessionsList() {
  const { data: sessions, isLoading } = useActiveSessions()

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          Usuários Online
          {sessions && sessions.length > 0 && (
            <Badge variant="secondary" className="ml-auto">
              {sessions.length}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[400px] px-4 pb-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50 animate-pulse">
                  <div className="h-10 w-10 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 bg-muted rounded" />
                    <div className="h-3 w-48 bg-muted rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : sessions && sessions.length > 0 ? (
            <AnimatePresence mode="popLayout">
              <div className="space-y-2">
                {sessions.map((session) => (
                  <SessionItem key={session.id} session={session} />
                ))}
              </div>
            </AnimatePresence>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
              <Monitor className="h-12 w-12 mb-3 opacity-50" />
              <p className="text-sm">Nenhum usuário online</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
