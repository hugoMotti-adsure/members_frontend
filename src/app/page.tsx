'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, BookOpen, Users, Award, BarChart3 } from 'lucide-react'
import { useTenant } from '@/lib/tenant-context'
import { TenantLoading } from '@/components/tenant-loading'
import { TenantNotFound } from '@/components/tenant-not-found'

export default function HomePage() {
  const router = useRouter()
  const { tenant, isLoading, error, isSubdomain } = useTenant()

  useEffect(() => {
    // Se está em um subdomínio de tenant, redireciona para login
    if (isSubdomain && tenant) {
      router.replace('/login')
    }
  }, [isSubdomain, tenant, router])

  // Se está carregando em um subdomínio
  if (isSubdomain && isLoading) {
    return <TenantLoading />
  }

  // Se está em um subdomínio mas o tenant não foi encontrado
  if (isSubdomain && error) {
    return <TenantNotFound />
  }

  // Se está em um subdomínio e tem tenant, mostra loading enquanto redireciona
  if (isSubdomain && tenant) {
    return <TenantLoading />
  }

  // Se é o domínio principal, mostra a landing page
  return (
    <div className="min-h-screen gradient-bg">
      {/* Header */}
      <header className="border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Members</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link
              href="/login"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Começar grátis
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-24 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm mb-6">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Plataforma de cursos completa
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
            Crie sua{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-400">
              área de membros
            </span>{' '}
            em minutos
          </h1>
          <p className="text-xl text-muted-foreground mb-8">
            Hospede seus cursos, gerencie alunos e acompanhe o progresso de cada um.
            Tudo em uma plataforma moderna e fácil de usar.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              disabled
              className="px-8 py-4 bg-muted text-muted-foreground rounded-xl font-medium cursor-not-allowed opacity-50 flex items-center justify-center gap-2"
              title="Em breve"
            >
              Criar minha escola
              <ArrowRight className="w-5 h-5" />
            </button>
            <Link
              href="/login"
              className="px-8 py-4 bg-secondary text-secondary-foreground rounded-xl font-medium hover:bg-secondary/80 transition-colors"
            >
              Já tenho uma conta
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Tudo que você precisa</h2>
          <p className="text-muted-foreground">
            Recursos poderosos para criar e gerenciar seus cursos
          </p>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            {
              icon: BookOpen,
              title: 'Cursos Ilimitados',
              description: 'Crie quantos cursos quiser, com módulos e aulas organizados',
            },
            {
              icon: Users,
              title: 'Gestão de Alunos',
              description: 'Acompanhe cada aluno, suas matrículas e progresso',
            },
            {
              icon: BarChart3,
              title: 'Analytics Completo',
              description: 'Relatórios detalhados de engajamento e conclusão',
            },
            {
              icon: Award,
              title: 'Certificados',
              description: 'Emita certificados automáticos ao concluir cursos',
            },
          ].map((feature, index) => (
            <div
              key={index}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors gradient-border"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-muted-foreground text-sm">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground text-sm">
          © {new Date().getFullYear()} Members. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}
