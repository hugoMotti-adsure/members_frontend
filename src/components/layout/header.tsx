'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogOut, User, Settings, Bell, Eye, X, ExternalLink, Megaphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useViewModeStore, initViewModeFromSession } from '@/features/auth/stores/view-mode.store'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

interface Announcement {
  id: string
  title: string
  content: string
  type: string
  is_active: boolean
  created_at: string
}

const ANNOUNCEMENT_TYPE_LABEL: Record<string, string> = {
  info: 'Informação',
  warning: 'Aviso',
  success: 'Novidade',
  error: 'Urgente',
}

const ANNOUNCEMENT_TYPE_COLOR: Record<string, string> = {
  info: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  warning: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
}

function formatTimeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Agora'
  if (mins < 60) return `${mins}min atrás`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h atrás`
  const days = Math.floor(hours / 24)
  return `${days}d atrás`
}

export function Header() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout } = useAuthStore()
  const { isStudentView, setStudentView } = useViewModeStore()
  const [notifOpen, setNotifOpen] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())

  const isAdmin = user?.role === 'owner' || user?.role === 'admin' || user?.role === 'super_admin'

  // Carrega anúncios ativos
  const { data: announcements } = useQuery<Announcement[]>({
    queryKey: ['announcements-active'],
    queryFn: () =>
      api.get('/announcements/active').then((res) =>
        Array.isArray(res.data) ? res.data : [],
      ),
    refetchInterval: 60000, // revalida a cada 1 minuto
    staleTime: 30000,
  })

  // Contagem de não lidos (ainda não marcados como lidos nesta sessão)
  const unreadCount = (announcements ?? []).filter((a) => !readIds.has(a.id)).length

  const handleOpenNotif = (open: boolean) => {
    setNotifOpen(open)
    // Marca todos como lidos ao abrir
    if (open && announcements) {
      setReadIds(new Set(announcements.map((a) => a.id)))
    }
  }

  // Inicializa o modo de visualização a partir do sessionStorage ou URL
  useEffect(() => {
    const previewParam = searchParams.get('preview')
    if (previewParam === 'student') {
      setStudentView(true)
      const url = new URL(window.location.href)
      url.searchParams.delete('preview')
      window.history.replaceState({}, '', url.pathname)
    } else {
      initViewModeFromSession()
    }
  }, [searchParams, setStudentView])

  const handleLogout = async () => {
    await logout()
    router.push('/login')
  }

  const handleOpenStudentView = () => {
    const url = new URL(window.location.origin + '/dashboard')
    url.searchParams.set('preview', 'student')
    window.open(url.toString(), '_blank')
  }

  const handleClosePreview = () => {
    setStudentView(false)
    window.close()
  }

  return (
    <header className="h-16 border-b border-border bg-card px-6 flex items-center justify-between">
      <div className="flex items-center gap-4">
        {/* Banner de modo visualização de aluno */}
        {isStudentView && (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-300" />
            <div className="relative flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 backdrop-blur-sm rounded-full text-sm font-medium">
              <div className="relative">
                <Eye className="h-4 w-4 text-amber-400" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              </div>
              <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-300 bg-clip-text text-transparent font-semibold">
                Preview: Visão do Aluno
              </span>
              <button
                onClick={handleClosePreview}
                className="ml-1 p-1 rounded-full hover:bg-amber-500/20 text-amber-400 hover:text-amber-300 transition-all duration-200 hover:rotate-90"
                title="Fechar preview"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4">
        {/* Sino de notificações — esconde no modo preview */}
        {!isStudentView && (
          <DropdownMenu open={notifOpen} onOpenChange={handleOpenNotif}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-80 p-0 overflow-hidden" sideOffset={8}>
              {/* Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">Notificações</span>
                {(announcements ?? []).length > 0 && (
                  <Badge variant="secondary" className="text-xs px-1.5 py-0 ml-1">
                    {(announcements ?? []).length}
                  </Badge>
                )}
              </div>

              {/* Lista */}
              <div className="max-h-[360px] overflow-y-auto">
                {(announcements ?? []).length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-center px-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mb-3">
                      <Megaphone className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium">Nenhuma notificação</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Anúncios e avisos aparecerão aqui
                    </p>
                  </div>
                ) : (
                  <ul className="divide-y divide-border">
                    {(announcements ?? []).map((announcement) => (
                      <li key={announcement.id} className="px-4 py-3 hover:bg-muted/40 transition-colors cursor-default">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <span className="font-medium text-sm leading-tight">
                            {announcement.title}
                          </span>
                          <span
                            className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                              ANNOUNCEMENT_TYPE_COLOR[announcement.type] ?? 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {ANNOUNCEMENT_TYPE_LABEL[announcement.type] ?? announcement.type}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                          {announcement.content}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60">
                          {formatTimeAgo(announcement.created_at)}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Footer — só para admins */}
              {isAdmin && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="justify-center text-xs text-primary focus:text-primary"
                    onClick={() => router.push('/admin/announcements')}
                  >
                    Gerenciar anúncios
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.avatar_url} alt={user?.name} />
                <AvatarFallback>{user?.name?.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <div className="flex items-center justify-start gap-2 p-2">
              <div className="flex flex-col space-y-1 leading-none">
                <p className="font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <User className="mr-2 h-4 w-4" />
              Meu Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              <Settings className="mr-2 h-4 w-4" />
              Configurações
            </DropdownMenuItem>
            {isAdmin && !isStudentView && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleOpenStudentView}>
                  <Eye className="mr-2 h-4 w-4" />
                  Visualizar como aluno
                  <ExternalLink className="ml-auto h-3 w-3 text-muted-foreground" />
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
