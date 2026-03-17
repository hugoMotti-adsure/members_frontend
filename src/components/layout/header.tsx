'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LogOut, User, Settings, Bell, Eye, X, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { useViewModeStore, initViewModeFromSession } from '@/features/auth/stores/view-mode.store'

export function Header() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout } = useAuthStore()
  const { isStudentView, setStudentView } = useViewModeStore()
  
  const isAdmin = user?.role === 'owner' || user?.role === 'admin' || user?.role === 'super_admin'

  // Inicializa o modo de visualização a partir do sessionStorage ou URL
  useEffect(() => {
    const previewParam = searchParams.get('preview')
    if (previewParam === 'student') {
      setStudentView(true)
      // Remove o parâmetro da URL mantendo o estado
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

  // Abre nova aba com visão de aluno
  const handleOpenStudentView = () => {
    const url = new URL(window.location.origin + '/dashboard')
    url.searchParams.set('preview', 'student')
    window.open(url.toString(), '_blank')
  }

  // Fecha a aba de preview
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
            {/* Glow effect */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 rounded-full blur opacity-60 group-hover:opacity-100 transition duration-300" />
            
            {/* Badge principal */}
            <div className="relative flex items-center gap-2.5 px-4 py-2 bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/10 border border-amber-500/20 backdrop-blur-sm rounded-full text-sm font-medium">
              {/* Ícone com pulse */}
              <div className="relative">
                <Eye className="h-4 w-4 text-amber-400" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
              </div>
              
              {/* Texto com gradiente */}
              <span className="bg-gradient-to-r from-amber-300 via-orange-300 to-amber-300 bg-clip-text text-transparent font-semibold">
                Preview: Visão do Aluno
              </span>
              
              {/* Botão fechar */}
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
        {/* Notifications - esconde no modo preview */}
        {!isStudentView && (
          <Button variant="ghost" size="icon" className="relative">
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
          </Button>
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
