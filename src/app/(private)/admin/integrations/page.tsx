'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Plus, Trash2, Copy, Check, Webhook, Package, BookOpen,
  RefreshCw, CheckCircle2, XCircle, AlertTriangle, Clock, Activity,
} from 'lucide-react'
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

interface WebhookLog {
  id: string
  platform: string
  event: string
  customer_email: string | null
  customer_name: string | null
  product_id: string | null
  product_name: string | null
  user_id: string | null
  processed_at: string | null
  error_message: string | null
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
  { id: 'zouti', name: 'Zouti', color: 'bg-violet-500' },
]

const EVENT_LABELS: Record<string, string> = {
  purchase_approved: 'Compra aprovada',
  purchase_refunded: 'Reembolso',
  purchase_canceled: 'Cancelamento',
  purchase_chargeback: 'Chargeback',
  purchase_pending: 'Aguardando pagamento',
  subscription_active: 'Assinatura ativa',
  subscription_canceled: 'Assinatura cancelada',
  subscription_expired: 'Assinatura expirada',
  unknown: 'Evento desconhecido',
}

function getLogStatus(log: WebhookLog): 'success' | 'no_mapping' | 'error' | 'pending' {
  if (log.error_message) return 'error'
  if (log.event === 'unknown') return 'error'
  if (log.processed_at && log.user_id) return 'success'
  if (log.processed_at && !log.user_id) return 'no_mapping'
  return 'pending'
}

const STATUS_CONFIG = {
  success: {
    icon: CheckCircle2,
    label: 'Processado',
    className: 'text-green-500',
    badge: 'bg-green-500/10 text-green-500 border-green-500/20',
  },
  no_mapping: {
    icon: AlertTriangle,
    label: 'Sem mapeamento',
    className: 'text-amber-500',
    badge: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  },
  error: {
    icon: XCircle,
    label: 'Erro',
    className: 'text-destructive',
    badge: 'bg-destructive/10 text-destructive border-destructive/20',
  },
  pending: {
    icon: Clock,
    label: 'Pendente',
    className: 'text-muted-foreground',
    badge: 'bg-muted text-muted-foreground',
  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function IntegrationsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { toast } = useToast()
  const { user } = useAuthStore()

  const tenantId = typeof window !== 'undefined' ? localStorage.getItem('tenant_id') : null

  const { data: mappings, isLoading } = useQuery<ProductMapping[]>({
    queryKey: ['product-mappings'],
    queryFn: () => api.get('/webhooks/mappings').then((res) => Array.isArray(res.data) ? res.data : []),
  })

  const { data: webhookLogs, isLoading: isLoadingLogs, refetch: refetchLogs } = useQuery<WebhookLog[]>({
    queryKey: ['webhook-logs'],
    queryFn: () => api.get('/webhooks/logs').then((res) => Array.isArray(res.data) ? res.data : []),
    refetchInterval: 30000, // auto-refresh a cada 30s
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

  // Contadores para o resumo
  const logSummary = (webhookLogs ?? []).reduce(
    (acc, log) => {
      const status = getLogStatus(log)
      acc[status] = (acc[status] ?? 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

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

      {/* Monitor de Eventos */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Monitor de Eventos
              </CardTitle>
              <CardDescription>
                Histórico dos últimos webhooks recebidos — atualiza automaticamente a cada 30s
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchLogs()}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* Resumo de contadores */}
          {(webhookLogs ?? []).length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {([
                { key: 'success', label: 'Processados', icon: CheckCircle2, color: 'text-green-500' },
                { key: 'no_mapping', label: 'Sem mapeamento', icon: AlertTriangle, color: 'text-amber-500' },
                { key: 'error', label: 'Com erro', icon: XCircle, color: 'text-destructive' },
                { key: 'pending', label: 'Pendentes', icon: Clock, color: 'text-muted-foreground' },
              ] as const).map(({ key, label, icon: Icon, color }) => (
                <div key={key} className="flex items-center gap-3 rounded-lg border bg-muted/20 p-3">
                  <Icon className={`h-5 w-5 shrink-0 ${color}`} />
                  <div>
                    <p className="text-xl font-bold leading-none">{logSummary[key] ?? 0}</p>
                    <p className="text-xs text-muted-foreground mt-1">{label}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Tabela de logs */}
          {isLoadingLogs ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : (webhookLogs ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center mb-3">
                <Activity className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium">Nenhum evento recebido ainda</p>
              <p className="text-sm text-muted-foreground mt-1">
                Configure a URL do webhook na sua plataforma de vendas e os eventos aparecerão aqui.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Plataforma</TableHead>
                  <TableHead>Evento</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Recebido em</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(webhookLogs ?? []).map((log) => {
                  const status = getLogStatus(log)
                  const cfg = STATUS_CONFIG[status]
                  const StatusIcon = cfg.icon
                  return (
                    <TableRow key={log.id}>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${cfg.badge}`}>
                          <StatusIcon className="h-3.5 w-3.5" />
                          {cfg.label}
                        </span>
                      </TableCell>
                      <TableCell>{getPlatformBadge(log.platform)}</TableCell>
                      <TableCell className="text-sm">
                        {EVENT_LABELS[log.event] ?? log.event}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.customer_email ? (
                          <div>
                            <p className="font-medium leading-tight">{log.customer_name || '—'}</p>
                            <p className="text-xs text-muted-foreground">{log.customer_email}</p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {log.product_name ? (
                          <div>
                            <p className="leading-tight line-clamp-1">{log.product_name}</p>
                            {log.product_id && (
                              <p className="text-xs font-mono text-muted-foreground truncate max-w-[160px]">
                                {log.product_id}
                              </p>
                            )}
                          </div>
                        ) : log.product_id ? (
                          <span className="text-xs font-mono text-muted-foreground">{log.product_id}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(log.created_at)}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
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
              <strong className="text-foreground">Teste</strong> - Faça uma compra de teste e acompanhe o status no Monitor de Eventos acima
            </li>
          </ol>
        </CardContent>
      </Card>

      <CreateMappingDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  )
}
