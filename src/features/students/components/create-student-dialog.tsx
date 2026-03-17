'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useToast } from '@/components/ui/use-toast'

const schema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  email: z.string().email('Email inválido'),
})

type FormData = z.infer<typeof schema>

interface CreateStudentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateStudentDialog({ open, onOpenChange }: CreateStudentDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const router = useRouter()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const mutation = useMutation({
    mutationFn: (data: FormData) => api.post('/users/students', data),
    onSuccess: (response) => {
      toast({ title: 'Aluno cadastrado com sucesso!' })
      queryClient.invalidateQueries({ queryKey: ['students'] })
      reset()
      onOpenChange(false)
      
      // Redireciona para a página de detalhes do aluno
      const studentId = response.data?.user?.id
      if (studentId) {
        router.push(`/admin/students/${studentId}`)
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao cadastrar aluno',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const onSubmit = (data: FormData) => mutation.mutate(data)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Cadastrar Aluno</DialogTitle>
          <DialogDescription>
            Adicione um novo aluno à sua escola. Após atribuir as entregas, use "Reenviar Acesso" para enviar as credenciais.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome Completo *</Label>
            <Input
              id="name"
              placeholder="Ex: Maria Silva"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              placeholder="aluno@email.com"
              {...register('email')}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <p className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
            Após cadastrar, atribua as entregas ao aluno e clique em "Reenviar Acesso" para enviar o email com as credenciais.
          </p>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Cadastrando...
                </>
              ) : (
                'Cadastrar Aluno'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
