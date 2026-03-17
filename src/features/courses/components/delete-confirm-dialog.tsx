'use client'

import { useMutation } from '@tanstack/react-query'
import { Loader2, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

interface DeleteConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  type: 'module' | 'lesson'
  id: string
  title: string
  onSuccess: () => void
}

export function DeleteConfirmDialog({ 
  open, 
  onOpenChange, 
  type, 
  id, 
  title, 
  onSuccess 
}: DeleteConfirmDialogProps) {
  const { toast } = useToast()

  const mutation = useMutation({
    mutationFn: () => api.delete(`/${type === 'module' ? 'modules' : 'lessons'}/${id}`),
    onSuccess: () => {
      toast({ title: `${type === 'module' ? 'Módulo' : 'Aula'} excluído(a) com sucesso!` })
      onOpenChange(false)
      onSuccess()
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500/10 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <DialogTitle>Excluir {type === 'module' ? 'Módulo' : 'Aula'}</DialogTitle>
          </div>
          <DialogDescription className="pt-2">
            Tem certeza que deseja excluir <strong>"{title}"</strong>?
            {type === 'module' && (
              <span className="block mt-2 text-red-400">
                ⚠️ Todas as aulas deste módulo também serão excluídas.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Excluindo...
              </>
            ) : (
              'Excluir'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
