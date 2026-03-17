'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BookOpen, Loader2, Mail, Lock } from 'lucide-react'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/components/ui/use-toast'
import { useTenant } from '@/lib/tenant-context'
import { TenantNotFound } from '@/components/tenant-not-found'
import { TenantLoading } from '@/components/tenant-loading'

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
})

type LoginForm = z.infer<typeof loginSchema>

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const login = useAuthStore((state) => state.login)
  const { tenant, isLoading: tenantLoading, error, isSubdomain } = useTenant()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password, tenant?.id)
      router.push('/dashboard')
    } catch (error: any) {
      toast({
        title: 'Erro ao fazer login',
        description: error.message || 'Verifique suas credenciais',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  // Se está em um subdomínio e ainda carregando
  if (tenantLoading) {
    return <TenantLoading />
  }

  // Se está em um subdomínio mas o tenant não foi encontrado
  if (isSubdomain && error) {
    return <TenantNotFound />
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          {(tenant?.logo_horizontal_url || tenant?.logo_url) ? (
            <div className="flex justify-center">
              <img 
                src={tenant.logo_horizontal_url || tenant.logo_url} 
                alt={tenant.name} 
                className="h-12 max-w-[200px] w-auto object-contain"
              />
            </div>
          ) : (
            <Link href="/" className="inline-flex items-center gap-2 justify-center">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-2xl">{tenant?.name || 'Members'}</span>
            </Link>
          )}
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-2xl p-8 gradient-border">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold">Bem-vindo de volta</h1>
            <p className="text-muted-foreground mt-2">
              Entre com suas credenciais para continuar
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  className="pl-10"
                  {...register('email')}
                />
              </div>
              {errors.email && (
                <p className="text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  className="pl-10"
                  {...register('password')}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Entrando...
                </>
              ) : (
                'Entrar'
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Não tem uma conta? </span>
            <Link href="/register" className="text-primary hover:underline">
              Criar conta
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
