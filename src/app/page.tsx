'use client'

import Link from 'next/link'
import { ArrowRight, Award, BarChart3, BookOpen, Users } from 'lucide-react'
import { useTenant } from '@/lib/tenant-context'
import { TenantLoading } from '@/components/tenant-loading'
import { TenantNotFound } from '@/components/tenant-not-found'

const features = [
  {
    icon: BookOpen,
    title: 'Cursos organizados',
    description: 'Acesse trilhas, modulos e aulas em um ambiente simples de navegar.',
  },
  {
    icon: Users,
    title: 'Experiencia do aluno',
    description: 'Entre com sua conta, acompanhe o progresso e retome de onde parou.',
  },
  {
    icon: BarChart3,
    title: 'Aulas e materiais',
    description: 'Consuma videos, materiais extras e anuncios sem sair da plataforma.',
  },
  {
    icon: Award,
    title: 'Certificados e progresso',
    description: 'Visualize sua evolucao e conclua cursos com acompanhamento continuo.',
  },
]

export default function HomePage() {
  const { tenant, isLoading, error, isSubdomain } = useTenant()

  if (isSubdomain && isLoading) {
    return <TenantLoading />
  }

  if (isSubdomain && error) {
    return <TenantNotFound />
  }

  const isTenantLanding = isSubdomain && Boolean(tenant)
  const logoUrl = tenant?.logo_horizontal_url || tenant?.logo_url
  const brandName = tenant?.name || 'Members'
  const badgeLabel = isTenantLanding
    ? `Ambiente oficial de ${brandName}`
    : 'Plataforma de cursos completa'
  const title = isTenantLanding ? `Bem-vindo a ${brandName}` : 'Crie sua area de membros em minutos'
  const highlightedTitle = isTenantLanding ? 'para aprender no seu ritmo' : 'com uma experiencia premium'
  const description = isTenantLanding
    ? 'Antes de entrar, confira a pagina inicial da sua escola e siga para a area de membros quando quiser continuar.'
    : 'Hospede seus cursos, gerencie alunos e acompanhe o progresso de cada pessoa em uma plataforma moderna e facil de usar.'
  const primaryCta = isTenantLanding ? 'Entrar na plataforma' : 'Ja tenho uma conta'
  const secondaryCta = isTenantLanding ? 'Criar conta' : 'Comecar gratis'

  return (
    <div className="min-h-screen gradient-bg">
      <header className="border-b border-border/50">
        <div className="container mx-auto flex items-center justify-between gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={brandName}
                className="h-10 max-w-[180px] w-auto object-contain"
              />
            ) : (
              <>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                  <BookOpen className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="text-xl font-bold">{brandName}</span>
              </>
            )}
          </div>

          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Entrar
            </Link>
            <Link
              href="/register"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
            >
              {secondaryCta}
            </Link>
          </nav>
        </div>
      </header>

      <main>
        <section className="container mx-auto px-4 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm text-primary">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              {badgeLabel}
            </div>

            <h1 className="mb-6 text-5xl font-bold leading-tight md:text-6xl">
              {title}{' '}
              <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                {highlightedTitle}
              </span>
            </h1>

            <p className="mb-8 text-xl text-muted-foreground">{description}</p>

            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 font-medium text-primary-foreground transition-colors hover:bg-primary/90"
              >
                {primaryCta}
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href={isTenantLanding ? '/register' : '/login'}
                className="rounded-xl bg-secondary px-8 py-4 font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
              >
                {isTenantLanding ? 'Quero me cadastrar' : 'Conhecer a plataforma'}
              </Link>
            </div>
          </div>
        </section>

        <section className="container mx-auto px-4 py-24">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold">
              {isTenantLanding ? 'Tudo pronto para voce acessar' : 'Tudo que voce precisa'}
            </h2>
            <p className="text-muted-foreground">
              {isTenantLanding
                ? 'A plataforma ja entrega o fluxo principal para alunos, cursos e acompanhamento.'
                : 'Recursos poderosos para criar, vender e gerenciar seus cursos.'}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="gradient-border rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} {brandName}. Todos os direitos reservados.
        </div>
      </footer>
    </div>
  )
}
