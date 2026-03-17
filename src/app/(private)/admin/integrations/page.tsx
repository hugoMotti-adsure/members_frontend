'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Copy, Check, Webhook, Package, BookOpen, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { CreateMappingDialog } from '@/features/integrations/components/create-mapping-dialog'
import { useAuthStore } from '@/features/auth/stores/auth.store'

interface ProductMapping {
  id: string
  platform: string
  external_product_id: string
  product_name: string | null
  course_id: string | null
  offer_id: string | null
  course: { id: string; title: string } | null
  offer: { id: string; name: string; access_days: number | null } | null
  created_at: string
}

interface Platform {
  id: string
  name: string
  color: string
}

const PLATFORMS: Platform[] = [
  { id: 'hotmart', name: 'Hotmart', color: 'bg-orange-500' },
  { id: 'kiwify', name: 'Kiwify', color: 'bg-green-500' },
  { id: 'greenn', name: 'Greenn', color: 'bg-emerald-500' },
  { id: 'eduzz', name: 'Eduzz', color: 'bg-blue-500' },
  { id: 'braip', name: 'Braip', color: 'bg-purple-500' },
  { id: 'monetizze', name: 'Monetizze', color: 'bg-cyan-500' },
  { id: 'perfectpay', name: 'PerfectPay', color: 'bg-red-500' },
]

export default function IntegrationsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuthStore()

  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null

  const { data: mappings, isLoading } = useQuery<ProductMapping[]>({
    queryKey: ['product-mappings'],
    queryFn: () => api.get('/webhooks/mappings').then((res) => res.data),
  })

  const deleteMutation = useMutation({
    mutationFn: (mappingId: string) => api.delete(`/webhooks/mappings/${mappingId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-mappings'] })
      toast({ title: 'Mapeamento excluído com sucesso' })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao excluir mapeamento',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const getWebhookUrl = (platform: string) => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api'
    return `${baseUrl}/webhooks/${platform}/${tenantId}`
  }

  const copyToClipboard = async (platform: string) => {
    const url = getWebhookUrl(platform)
    await navigator.clipboard.writeText(url)
    setCopiedUrl(platform)
    toast({ title: 'URL copiada!' })
    setTimeout(() => setCopiedUrl(null), 2000)
  }

  const getPlatformBadge = (platformId: string) => {
    const platform = PLATFORMS.find((p) => p.id === platformId)
    return platform ? (
      <Badge className={`${platform.color} text-white`}>
        {platform.name}
      </Badge>
    ) : (
      <Badge variant="secondary">{platformId}</Badge>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integrações</h1>
          <p className="text-muted-foreground">
            Configure webhooks para receber vendas automaticamente
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Mapeamento
        </Button>
      </div>

      {/* URLs de Webhook */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Webhook className="h-5 w-5" />
            URLs de Webhook
          </CardTitle>
          <CardDescription>
            Configure estas URLs na sua plataforma de vendas para receber os webhooks automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {PLATFORMS.map((platform) => (
              <div
                key={platform.id}
                className="flex items-center justify-between p-3 border rounded-lg bg-muted/30"
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${platform.color}`} />
                  <span className="font-medium text-sm">{platform.name}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(platform.id)}
                  className="h-8 px-2"
                >
                  {copiedUrl === platform.id ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-4">
            Clique no botão de copiar para copiar a URL do webhook da plataforma desejada
          </p>
        </CardContent>
      </Card>

      {/* Mapeamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Mapeamentos de Produtos</CardTitle>
          <CardDescription>
            Vincule produtos das plataformas de vendas às suas entregas ou cursos
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : mappings?.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Nenhum mapeamento configurado</h3>
              <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                Crie mapeamentos para vincular produtos das plataformas de vendas aos cursos ou entregas.
              </p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Mapeamento
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>ID do Produto</TableHead>
                  <TableHead>Nome do Produto</TableHead>
                  <TableHead>Vinculado a</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mappings?.map((mapping) => (
                  <TableRow key={mapping.id}>
                    <TableCell>{getPlatformBadge(mapping.platform)}</TableCell>
                    <TableCell className="font-mono text-sm">
                      {mapping.external_product_id}
                    </TableCell>
                    <TableCell>
                      {mapping.product_name || (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {mapping.offer ? (
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span>{mapping.offer.name}</span>
                          {mapping.offer.access_days && (
                            <Badge variant="outline" className="text-xs">
                              {mapping.offer.access_days} dias
                            </Badge>
                          )}
                        </div>
                      ) : mapping.course ? (
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-muted-foreground" />
                          <span>{mapping.course.title}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">Não configurado</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => {
                          if (confirm('Tem certeza que deseja excluir este mapeamento?')) {
                            deleteMutation.mutate(mapping.id)
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Documentação */}
      <Card>
        <CardHeader>
          <CardTitle>Como configurar</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm dark:prose-invert max-w-none">
          <ol className="list-decimal list-inside space-y-2 text-muted-foreground">
            <li>
              <strong className="text-foreground">Crie uma Entrega</strong> - Vá em "Entregas" e crie um agrupamento de cursos
            </li>
            <li>
              <strong className="text-foreground">Configure o Webhook</strong> - Copie a URL da plataforma e cole nas configurações de webhook do seu produto
            </li>
            <li>
              <strong className="text-foreground">Crie o Mapeamento</strong> - Vincule o ID do produto da plataforma à entrega criada
            </li>
            <li>
              <strong className="text-foreground">Teste</strong> - Faça uma compra de teste para verificar se o aluno é criado automaticamente
            </li>
          </ol>
        </CardContent>
      </Card>

      <CreateMappingDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  )
}
