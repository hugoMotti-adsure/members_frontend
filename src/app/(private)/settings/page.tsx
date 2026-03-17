'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  User,
  Building2,
  Palette,
  Lock,
  Save,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  Globe,
  Image as ImageIcon,
  Mail,
  XCircle,
  Copy,
  RefreshCw,
  Shield,
  AlertTriangle,
  Trash2,
} from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useToast } from '@/components/ui/use-toast'
import { AvatarUpload } from '@/components/ui/avatar-upload'
import { LogoUploadGroup } from '@/components/ui/logo-upload-group'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { cn } from '@/lib/utils'

// Types para domínio unificado (email + URL)
interface DnsRecord {
  type: string
  name: string
  value: string
  purpose?: 'email' | 'url'
  description?: string
}

interface DomainStatus {
  domain: string | null
  subdomain: string
  has_domain: boolean
  // Email
  email_verified: boolean
  email_verified_at: string | null
  from_name: string | null
  from_address: string | null
  // URL
  custom_domain: string | null
  url_verified: boolean
  // DNS
  dns_records: DnsRecord[] | null
  // Status geral
  fully_verified: boolean
}

// Types para domínio customizado (apenas URL)
interface CustomDomainStatus {
  custom_domain: string | null
  verified: boolean
  verified_at: string | null
  has_custom_domain: boolean
  dns_instructions: {
    type: string
    name: string
    value: string
    description: string
  } | null
}

// Schema do perfil
const profileSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  avatar_url: z.string().optional(),
})

type ProfileForm = z.infer<typeof profileSchema>

// Schema da senha
const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'A senha deve ter no mínimo 6 caracteres'),
  newPassword: z.string().min(6, 'A nova senha deve ter no mínimo 6 caracteres'),
  confirmPassword: z.string().min(6, 'Confirme a nova senha'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
})

type PasswordForm = z.infer<typeof passwordSchema>

// Schema do tenant (sem custom_domain - agora é gerenciado na seção de domínio)
const tenantSchema = z.object({
  name: z.string().min(2, 'O nome deve ter no mínimo 2 caracteres'),
  slug: z
    .string()
    .min(3, 'O slug deve ter no mínimo 3 caracteres')
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens'),
  logo_url: z.string().optional(),
  logo_horizontal_url: z.string().optional(),
  logo_icon_url: z.string().optional(),
  primary_color: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Use o formato hexadecimal (#RRGGBB)')
    .optional()
    .or(z.literal('')),
})

type TenantForm = z.infer<typeof tenantSchema>

// Cores predefinidas
const PRESET_COLORS = [
  { name: 'Violeta', value: '#8B5CF6' },
  { name: 'Azul', value: '#3B82F6' },
  { name: 'Esmeralda', value: '#10B981' },
  { name: 'Rosa', value: '#EC4899' },
  { name: 'Laranja', value: '#F97316' },
  { name: 'Vermelho', value: '#EF4444' },
  { name: 'Ciano', value: '#06B6D4' },
  { name: 'Âmbar', value: '#F59E0B' },
]

export default function SettingsPage() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const { user, updateUser } = useAuthStore()
  const isOwner = user?.role === 'owner' || user?.role === 'super_admin'
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [logoValues, setLogoValues] = useState({
    logo_url: null as string | null,
    logo_horizontal_url: null as string | null,
    logo_icon_url: null as string | null,
  })
  
  // Estados para domínio unificado
  const [newDomain, setNewDomain] = useState('')
  const [subdomain, setSubdomain] = useState('app')
  const [fromName, setFromName] = useState('')
  const [fromAddress, setFromAddress] = useState('')
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  
  // Estados para domínio customizado simples (apenas URL)
  const [customDomainInput, setCustomDomainInput] = useState('')

  // Busca dados do tenant
  const { data: tenant, isLoading: tenantLoading } = useQuery({
    queryKey: ['tenant'],
    queryFn: async () => {
      const res = await api.get('/tenants/current')
      return res.data
    },
    enabled: isOwner,
  })

  // Busca status do domínio unificado
  const { data: domainStatus, isLoading: domainLoading } = useQuery<DomainStatus>({
    queryKey: ['domain-status'],
    queryFn: async () => {
      const { data } = await api.get('/domains')
      return data
    },
    enabled: isOwner,
  })

  // Busca status do domínio customizado (apenas URL)
  const { data: customDomainStatus, isLoading: customDomainLoading } = useQuery<CustomDomainStatus>({
    queryKey: ['custom-domain-status'],
    queryFn: async () => {
      const { data } = await api.get('/domains/custom')
      return data
    },
    enabled: isOwner,
  })

  // Registrar domínio unificado
  const registerDomainMutation = useMutation({
    mutationFn: async (params: { domain: string; subdomain: string }) => {
      const { data } = await api.post('/domains', params)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-status'] })
      setNewDomain('')
      setSubdomain('app')
      toast({ title: 'Domínio registrado! Configure os registros DNS.' })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao registrar domínio',
        description: error.response?.data?.message || 'Verifique se o domínio é válido.',
        variant: 'destructive',
      })
    },
  })

  // Verificar tudo (email + URL)
  const verifyAllMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/domains/verify-all')
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['domain-status'] })
      if (data.fully_verified) {
        toast({ title: 'Tudo verificado com sucesso!' })
      } else {
        const messages = []
        if (!data.email?.verified) messages.push('Email: DNS não propagado')
        if (!data.url?.verified) messages.push('URL: ' + (data.url?.message || 'não acessível'))
        toast({
          title: 'Verificação parcial',
          description: messages.join('. '),
          variant: 'destructive',
        })
      }
    },
  })

  // Configurar remetente
  const setFromMutation = useMutation({
    mutationFn: async (params: { from_name: string; from_address: string }) => {
      const { data } = await api.post('/domains/from', params)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-status'] })
      toast({ title: 'Remetente configurado!' })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao configurar remetente',
        description: error.response?.data?.message || 'Tente novamente.',
        variant: 'destructive',
      })
    },
  })

  // Remover domínio
  const removeDomainMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete('/domains')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['domain-status'] })
      toast({ title: 'Domínio removido!' })
    },
  })

  // Configurar domínio customizado (apenas URL)
  const setCustomDomainMutation = useMutation({
    mutationFn: async (domain: string) => {
      const { data } = await api.post('/domains/custom', { domain })
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-domain-status'] })
      setCustomDomainInput('')
      toast({ title: 'Domínio configurado! Configure o CNAME no seu provedor DNS.' })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao configurar domínio',
        description: error.response?.data?.message || 'Verifique se o domínio é válido.',
        variant: 'destructive',
      })
    },
  })

  // Verificar domínio customizado
  const verifyCustomDomainMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/domains/custom/verify')
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['custom-domain-status'] })
      if (data.verified) {
        toast({ title: 'Domínio verificado com sucesso!' })
      } else {
        toast({
          title: 'CNAME não encontrado',
          description: data.message || 'Verifique se configurou o DNS corretamente.',
          variant: 'destructive',
        })
      }
    },
  })

  // Remover domínio customizado
  const removeCustomDomainMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.delete('/domains/custom')
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['custom-domain-status'] })
      toast({ title: 'Domínio removido!' })
    },
  })

  // Form do perfil
  const profileForm = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      avatar_url: '',
    },
  })

  // Form da senha
  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  })

  // Form do tenant
  const tenantForm = useForm<TenantForm>({
    resolver: zodResolver(tenantSchema),
    defaultValues: {
      name: '',
      slug: '',
      logo_url: '',
      logo_horizontal_url: '',
      logo_icon_url: '',
      primary_color: '',
    },
  })

  // Carrega dados do usuário
  useEffect(() => {
    if (user) {
      profileForm.reset({
        name: user.name,
        avatar_url: user.avatar_url || '',
      })
      setAvatarUrl(user.avatar_url || null)
    }
  }, [user, profileForm])

  // Carrega dados do tenant
  useEffect(() => {
    if (tenant) {
      tenantForm.reset({
        name: tenant.name,
        slug: tenant.slug,
        logo_url: tenant.logo_url || '',
        logo_horizontal_url: tenant.logo_horizontal_url || '',
        logo_icon_url: tenant.logo_icon_url || '',
        primary_color: tenant.primary_color || '',
      })
      setLogoValues({
        logo_url: tenant.logo_url || null,
        logo_horizontal_url: tenant.logo_horizontal_url || null,
        logo_icon_url: tenant.logo_icon_url || null,
      })
    }
  }, [tenant, tenantForm])

  // Mutation do perfil
  const profileMutation = useMutation({
    mutationFn: async (data: ProfileForm) => {
      // Remove campos vazios para não causar erro de validação
      const cleanData: Record<string, any> = {}
      if (data.name) cleanData.name = data.name
      if (data.avatar_url) cleanData.avatar_url = data.avatar_url
      
      await api.patch(`/users/${user?.id}`, cleanData)
      return data
    },
    onSuccess: (data) => {
      updateUser(data)
      toast({ title: 'Perfil atualizado com sucesso!' })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar perfil',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  // Mutation da senha
  const passwordMutation = useMutation({
    mutationFn: async (data: PasswordForm) => {
      await api.post('/auth/change-password', {
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
      })
    },
    onSuccess: () => {
      toast({ title: 'Senha alterada com sucesso!' })
      passwordForm.reset()
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao alterar senha',
        description: error.response?.data?.message || 'Senha atual incorreta',
        variant: 'destructive',
      })
    },
  })

  // Mutation do tenant
  const tenantMutation = useMutation({
    mutationFn: async (data: TenantForm) => {
      // Remove campos vazios para não causar erro de validação
      const cleanData: Record<string, any> = {}
      if (data.name) cleanData.name = data.name
      if (data.slug) cleanData.slug = data.slug
      if (data.logo_url) cleanData.logo_url = data.logo_url
      if (data.logo_horizontal_url) cleanData.logo_horizontal_url = data.logo_horizontal_url
      if (data.logo_icon_url) cleanData.logo_icon_url = data.logo_icon_url
      if (data.primary_color) cleanData.primary_color = data.primary_color
      
      await api.patch('/tenants/current', cleanData)
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenant'] })
      updateUser({ tenant: { ...user?.tenant, ...data } as any })
      toast({ title: 'Configurações da escola atualizadas!' })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar configurações',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  // Handlers de submit
  const onProfileSubmit = (data: ProfileForm) => {
    profileMutation.mutate(data)
  }

  const onPasswordSubmit = (data: PasswordForm) => {
    passwordMutation.mutate(data)
  }

  const onTenantSubmit = (data: TenantForm) => {
    tenantMutation.mutate(data)
  }

  // Handlers de upload
  const handleAvatarChange = (url: string | null) => {
    setAvatarUrl(url)
    profileForm.setValue('avatar_url', url || '', { shouldDirty: true })
  }

  const handleLogoChange = (values: typeof logoValues) => {
    setLogoValues(values)
    tenantForm.setValue('logo_url', values.logo_url || '', { shouldDirty: true })
    tenantForm.setValue('logo_horizontal_url', values.logo_horizontal_url || '', { shouldDirty: true })
    tenantForm.setValue('logo_icon_url', values.logo_icon_url || '', { shouldDirty: true })
  }

  const selectedColor = tenantForm.watch('primary_color')

  // Handler de copiar DNS
  const handleCopyRecord = (value: string, index: number) => {
    navigator.clipboard.writeText(value)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Parseia os registros DNS se necessário
  let dnsRecords: DnsRecord[] = []
  if (domainStatus?.dns_records) {
    if (Array.isArray(domainStatus.dns_records)) {
      dnsRecords = domainStatus.dns_records
    } else if (typeof domainStatus.dns_records === 'object') {
      const records = domainStatus.dns_records as any
      if (records.dkim) dnsRecords.push({ type: 'CNAME', name: 'DKIM', value: records.dkim })
      if (records.spf) dnsRecords.push({ type: 'TXT', name: 'SPF', value: records.spf })
      if (records.dmarc) dnsRecords.push({ type: 'TXT', name: 'DMARC', value: records.dmarc })
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Configurações</h1>
        <p className="text-muted-foreground mt-1">
          Gerencie suas informações pessoais e preferências
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className={cn("w-full grid", isOwner ? "grid-cols-4" : "grid-cols-2")}>
          <TabsTrigger value="profile" className="gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Perfil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Segurança</span>
          </TabsTrigger>
          {isOwner && (
            <>
              <TabsTrigger value="school" className="gap-2">
                <Building2 className="w-4 h-4" />
                <span className="hidden sm:inline">Escola</span>
              </TabsTrigger>
              <TabsTrigger value="domain" className="gap-2">
                <Globe className="w-4 h-4" />
                <span className="hidden sm:inline">Domínio</span>
              </TabsTrigger>
            </>
          )}
        </TabsList>

        {/* Tab: Perfil */}
        <TabsContent value="profile">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Meu Perfil</CardTitle>
                  <CardDescription>Informações pessoais e foto de perfil</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Avatar */}
                  <div className="space-y-2">
                    <Label>Foto de Perfil</Label>
                    <AvatarUpload
                      value={avatarUrl}
                      onChange={handleAvatarChange}
                    />
                  </div>

                  {/* Campos */}
                  <div className="md:col-span-2 space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome Completo</Label>
                      <Input
                        id="name"
                        {...profileForm.register('name')}
                        className="bg-zinc-800/50 border-zinc-700"
                      />
                      {profileForm.formState.errors.name && (
                        <p className="text-sm text-red-400">
                          {profileForm.formState.errors.name.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        value={user?.email || ''}
                        disabled
                        className="bg-zinc-800/30 border-zinc-700 text-zinc-500"
                      />
                      <p className="text-xs text-zinc-500">O email não pode ser alterado</p>
                    </div>

                    <div className="space-y-2">
                      <Label>Função</Label>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'px-3 py-1 rounded-full text-sm font-medium',
                          user?.role === 'owner' && 'bg-primary/20 text-primary',
                          user?.role === 'admin' && 'bg-blue-500/20 text-blue-400',
                          user?.role === 'instructor' && 'bg-green-500/20 text-green-400',
                          user?.role === 'student' && 'bg-zinc-500/20 text-zinc-400',
                          user?.role === 'super_admin' && 'bg-amber-500/20 text-amber-400',
                        )}>
                          {user?.role === 'owner' && 'Proprietário'}
                          {user?.role === 'admin' && 'Administrador'}
                          {user?.role === 'instructor' && 'Instrutor'}
                          {user?.role === 'student' && 'Aluno'}
                          {user?.role === 'super_admin' && 'Super Admin'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-800">
                  <Button
                    type="submit"
                    disabled={profileMutation.isPending || !profileForm.formState.isDirty}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {profileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Salvando...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Perfil
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Segurança */}
        <TabsContent value="security">
          <Card className="border-zinc-800 bg-zinc-900/50">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Lock className="w-5 h-5 text-amber-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Segurança</CardTitle>
                  <CardDescription>Altere sua senha de acesso</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentPassword">Senha Atual</Label>
                    <div className="relative">
                      <Input
                        id="currentPassword"
                        type={showCurrentPassword ? 'text' : 'password'}
                        {...passwordForm.register('currentPassword')}
                        className="bg-zinc-800/50 border-zinc-700 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.currentPassword && (
                      <p className="text-sm text-red-400">
                        {passwordForm.formState.errors.currentPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        {...passwordForm.register('newPassword')}
                        className="bg-zinc-800/50 border-zinc-700 pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {passwordForm.formState.errors.newPassword && (
                      <p className="text-sm text-red-400">
                        {passwordForm.formState.errors.newPassword.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      {...passwordForm.register('confirmPassword')}
                      className="bg-zinc-800/50 border-zinc-700"
                    />
                    {passwordForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-400">
                        {passwordForm.formState.errors.confirmPassword.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-zinc-800">
                  <Button
                    type="submit"
                    disabled={passwordMutation.isPending}
                    variant="outline"
                    className="border-amber-500/50 text-amber-500 hover:bg-amber-500/10"
                  >
                    {passwordMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Alterando...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Alterar Senha
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Escola (apenas para owners) */}
        {isOwner && (
          <TabsContent value="school">
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Configurações da Escola</CardTitle>
                    <CardDescription>Personalize a aparência e informações da sua área de membros</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {tenantLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                  </div>
                ) : (
                  <form onSubmit={tenantForm.handleSubmit(onTenantSubmit)} className="space-y-6">
                    {/* Informações Básicas */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="tenant-name">Nome da Escola</Label>
                        <Input
                          id="tenant-name"
                          {...tenantForm.register('name')}
                          className="bg-zinc-800/50 border-zinc-700"
                        />
                        {tenantForm.formState.errors.name && (
                          <p className="text-sm text-red-400">
                            {tenantForm.formState.errors.name.message}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="tenant-slug">Subdomínio da Escola</Label>
                        <div className="flex gap-2 items-center">
                          <Input
                            id="tenant-slug"
                            {...tenantForm.register('slug')}
                            className="w-32 bg-zinc-800/50 border-zinc-700"
                          />
                          <span className="text-sm text-zinc-400">.trivapp.com.br</span>
                        </div>
                        <p className="text-xs text-zinc-500">
                          URL: https://{tenantForm.watch('slug') || 'slug'}.trivapp.com.br
                        </p>
                        {tenantForm.formState.errors.slug && (
                          <p className="text-sm text-red-400">
                            {tenantForm.formState.errors.slug.message}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Logos da Escola */}
                    <div className="space-y-4 pt-4 border-t border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                          <ImageIcon className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <Label className="text-base">Logos da Escola</Label>
                          <p className="text-sm text-zinc-500">Configure os diferentes formatos de logo</p>
                        </div>
                      </div>
                      
                      <LogoUploadGroup
                        values={logoValues}
                        onChange={handleLogoChange}
                        disabled={tenantMutation.isPending}
                      />
                    </div>

                    {/* Cor Principal */}
                    <div className="space-y-3 pt-4 border-t border-zinc-800">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                          <Palette className="w-4 h-4 text-pink-500" />
                        </div>
                        <div>
                          <Label className="text-base">Cor Principal</Label>
                          <p className="text-sm text-zinc-500">Escolha a cor do tema da sua escola</p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-3">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color.value}
                            type="button"
                            onClick={() => tenantForm.setValue('primary_color', color.value, { shouldDirty: true })}
                            className={cn(
                              'w-12 h-12 rounded-xl transition-all relative',
                              selectedColor === color.value && 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900'
                            )}
                            style={{ backgroundColor: color.value }}
                            title={color.name}
                          >
                            {selectedColor === color.value && (
                              <CheckCircle2 className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                            )}
                          </button>
                        ))}
                        
                        {/* Input de cor customizada */}
                        <div className="flex items-center gap-2">
                          <Input
                            {...tenantForm.register('primary_color')}
                            placeholder="#8B5CF6"
                            className="w-28 bg-zinc-800/50 border-zinc-700 text-center"
                          />
                          {selectedColor && selectedColor.match(/^#[0-9A-Fa-f]{6}$/) && (
                            <div
                              className="w-10 h-10 rounded-lg border border-zinc-700"
                              style={{ backgroundColor: selectedColor }}
                            />
                          )}
                        </div>
                      </div>
                      {tenantForm.formState.errors.primary_color && (
                        <p className="text-sm text-red-400">
                          {tenantForm.formState.errors.primary_color.message}
                        </p>
                      )}
                    </div>

                    <div className="flex justify-end pt-4 border-t border-zinc-800">
                      <Button
                        type="submit"
                        disabled={tenantMutation.isPending || !tenantForm.formState.isDirty}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {tenantMutation.isPending ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Salvando...
                          </>
                        ) : (
                          <>
                            <Save className="w-4 h-4 mr-2" />
                            Salvar Configurações
                          </>
                        )}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab: Domínio (apenas para owners) */}
        {isOwner && (
          <TabsContent value="domain">
            {/* Domínio Customizado Simples (apenas URL) */}
            <Card className="border-zinc-800 bg-zinc-900/50 mb-6">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Domínio Customizado</CardTitle>
                    <CardDescription>Use seu próprio domínio para acessar sua escola</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {customDomainLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                  </div>
                ) : customDomainStatus?.has_custom_domain ? (
                  <div className="space-y-4">
                    {/* Domínio configurado */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-blue-400" />
                        <div>
                          <p className="font-medium">{customDomainStatus.custom_domain}</p>
                          <p className="text-sm text-zinc-400">
                            {customDomainStatus.verified ? 'Verificado e ativo' : 'Aguardando verificação DNS'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {customDomainStatus.verified ? (
                          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
                            <CheckCircle2 className="h-3 w-3 mr-1" /> Verificado
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                            <AlertTriangle className="h-3 w-3 mr-1" /> Pendente
                          </Badge>
                        )}
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => removeCustomDomainMutation.mutate()}
                          disabled={removeCustomDomainMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Instruções de DNS */}
                    {!customDomainStatus.verified && customDomainStatus.dns_instructions && (
                      <div className="space-y-3">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <Shield className="h-4 w-4 text-zinc-400" />
                          Configure este registro no seu DNS
                        </h4>

                        <div className="p-4 rounded-lg bg-zinc-800/30 border border-zinc-700/50 space-y-3">
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-zinc-500 text-xs">Tipo</span>
                              <p className="font-medium">{customDomainStatus.dns_instructions.type}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500 text-xs">Nome/Host</span>
                              <p className="font-medium">{customDomainStatus.dns_instructions.name}</p>
                            </div>
                            <div>
                              <span className="text-zinc-500 text-xs">Valor/Destino</span>
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-blue-400">{customDomainStatus.dns_instructions.value}</p>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    navigator.clipboard.writeText(customDomainStatus.dns_instructions!.value)
                                    toast({ title: 'Copiado!' })
                                  }}
                                  className="h-6 px-2"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                          <p className="text-xs text-zinc-500">
                            {customDomainStatus.dns_instructions.description}
                          </p>
                        </div>

                        <Button
                          onClick={() => verifyCustomDomainMutation.mutate()}
                          disabled={verifyCustomDomainMutation.isPending}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          {verifyCustomDomainMutation.isPending ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Verificar DNS
                        </Button>
                      </div>
                    )}

                    {customDomainStatus.verified && (
                      <Alert className="border-emerald-500/30 bg-emerald-500/10">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <AlertTitle className="text-emerald-400">Domínio ativo!</AlertTitle>
                        <AlertDescription className="text-emerald-300/70">
                          Sua escola pode ser acessada em{' '}
                          <a 
                            href={`https://${customDomainStatus.custom_domain}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="underline"
                          >
                            https://{customDomainStatus.custom_domain}
                          </a>
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                ) : (
                  /* Configurar novo domínio customizado */
                  <div className="space-y-4">
                    <Alert className="border-zinc-700 bg-zinc-800/50">
                      <Globe className="h-4 w-4 text-blue-400" />
                      <AlertTitle>Como funciona</AlertTitle>
                      <AlertDescription className="text-zinc-400">
                        1. Crie um subdomínio no seu provedor (ex: membros.seusite.com.br)<br />
                        2. Configure um registro CNAME apontando para <strong className="text-blue-400">app.trivapp.com.br</strong><br />
                        3. Volte aqui e verifique para ativar
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                      <Label htmlFor="customDomain">Seu domínio</Label>
                      <Input
                        id="customDomain"
                        placeholder="membros.seusite.com.br"
                        value={customDomainInput}
                        onChange={(e) => setCustomDomainInput(e.target.value.toLowerCase())}
                        className="bg-zinc-800/50 border-zinc-700"
                      />
                      <p className="text-xs text-zinc-500">
                        Sugestões: membros.seusite.com.br, cursos.seusite.com.br, escola.seusite.com.br
                      </p>
                    </div>

                    <Button
                      onClick={() => setCustomDomainMutation.mutate(customDomainInput)}
                      disabled={!customDomainInput || setCustomDomainMutation.isPending}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {setCustomDomainMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Configurar Domínio
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Domínio para Email (BullQ) - Seção separada */}
            <Card className="border-zinc-800 bg-zinc-900/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-violet-500/20 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Domínio de Email</CardTitle>
                    <CardDescription>Envie emails com seu próprio domínio (opcional)</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {domainLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-zinc-500" />
                  </div>
                ) : domainStatus?.has_domain ? (
                  <div className="space-y-6">
                    {/* Status do domínio */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-800/50 border border-zinc-700">
                      <div className="flex items-center gap-3">
                        <Globe className="h-5 w-5 text-zinc-400" />
                        <div>
                          <p className="font-medium">{domainStatus.domain}</p>
                          {domainStatus.custom_domain && (
                            <p className="text-sm text-zinc-400">URL: {domainStatus.custom_domain}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                          onClick={() => removeDomainMutation.mutate()}
                          disabled={removeDomainMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Status Email e URL */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-400 flex items-center gap-2">
                            <Mail className="h-4 w-4" /> Email
                          </span>
                          {domainStatus.email_verified ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> OK
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Pendente
                            </Badge>
                          )}
                        </div>
                        {domainStatus.from_address && (
                          <p className="text-xs text-zinc-500">{domainStatus.from_address}</p>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-zinc-400 flex items-center gap-2">
                            <Globe className="h-4 w-4" /> URL
                          </span>
                          {domainStatus.url_verified ? (
                            <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs">
                              <CheckCircle2 className="h-3 w-3 mr-1" /> OK
                            </Badge>
                          ) : (
                            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs">
                              <AlertTriangle className="h-3 w-3 mr-1" /> Pendente
                            </Badge>
                          )}
                        </div>
                        {domainStatus.custom_domain && (
                          <p className="text-xs text-zinc-500">{domainStatus.custom_domain}</p>
                        )}
                      </div>
                    </div>

                    {/* Registros DNS */}
                    {(!domainStatus.email_verified || !domainStatus.url_verified) && dnsRecords.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-medium flex items-center gap-2">
                            <Shield className="h-4 w-4 text-zinc-400" />
                            Configure estes registros DNS
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => verifyAllMutation.mutate()}
                            disabled={verifyAllMutation.isPending}
                            className="border-zinc-700"
                          >
                            {verifyAllMutation.isPending ? (
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4 mr-2" />
                            )}
                            Verificar Tudo
                          </Button>
                        </div>

                        <div className="space-y-2">
                          {dnsRecords.map((record, idx) => (
                            <div 
                              key={idx}
                              className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50 space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-xs">
                                    {record.type}
                                  </Badge>
                                  <span className="text-sm font-medium text-zinc-300">
                                    {record.name}
                                  </span>
                                  {record.purpose && (
                                    <Badge className={cn(
                                      "text-xs",
                                      record.purpose === 'url' 
                                        ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                        : "bg-pink-500/20 text-pink-400 border-pink-500/30"
                                    )}>
                                      {record.purpose === 'url' ? 'URL' : 'Email'}
                                    </Badge>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleCopyRecord(record.value, idx)}
                                  className="text-xs"
                                >
                                  {copiedIndex === idx ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 mr-1 text-emerald-400" />
                                  ) : (
                                    <Copy className="h-3.5 w-3.5 mr-1" />
                                  )}
                                  {copiedIndex === idx ? 'Copiado!' : 'Copiar'}
                                </Button>
                              </div>
                              <code className="block text-xs bg-zinc-900 p-2 rounded font-mono text-zinc-400 break-all">
                                {record.value}
                              </code>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Configurar Remetente - só aparece quando email está verificado */}
                    {domainStatus.email_verified && (
                      <div className="space-y-4 pt-4 border-t border-zinc-800">
                        <h4 className="text-sm font-medium">Remetente de Email</h4>
                        
                        {domainStatus.from_address ? (
                          <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                            <p className="text-sm text-emerald-300">
                              <span className="font-medium">{domainStatus.from_name || 'Sem nome'}</span>
                              {' '}
                              <span className="text-emerald-400">&lt;{domainStatus.from_address}&gt;</span>
                            </p>
                            <p className="text-xs text-emerald-400/60 mt-1">
                              Emails serão enviados com este remetente
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label htmlFor="fromName">Nome do Remetente</Label>
                                <Input
                                  id="fromName"
                                  placeholder="Ex: Minha Escola"
                                  value={fromName}
                                  onChange={(e) => setFromName(e.target.value)}
                                  className="bg-zinc-800/50 border-zinc-700"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="fromAddress">Email do Remetente</Label>
                                <Input
                                  id="fromAddress"
                                  placeholder={`contato@${domainStatus.domain}`}
                                  value={fromAddress}
                                  onChange={(e) => setFromAddress(e.target.value)}
                                  className="bg-zinc-800/50 border-zinc-700"
                                />
                                <p className="text-xs text-muted-foreground">
                                  Deve usar o domínio @{domainStatus.domain}
                                </p>
                              </div>
                            </div>
                            <Button
                              onClick={() => setFromMutation.mutate({ 
                                from_name: fromName, 
                                from_address: fromAddress 
                              })}
                              disabled={!fromAddress || setFromMutation.isPending}
                              className="bg-pink-600 hover:bg-pink-700"
                            >
                              {setFromMutation.isPending && (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              )}
                              Salvar Remetente
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  /* Configurar novo domínio */
                  <div className="space-y-4">
                    <Alert className="border-zinc-700 bg-zinc-800/50">
                      <AlertTriangle className="h-4 w-4 text-amber-400" />
                      <AlertTitle>Nenhum domínio configurado</AlertTitle>
                      <AlertDescription className="text-zinc-400">
                        Configure um domínio personalizado para usar sua própria URL e enviar emails com sua marca.
                      </AlertDescription>
                    </Alert>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="domain">Domínio</Label>
                        <Input
                          id="domain"
                          placeholder="seudominio.com.br"
                          value={newDomain}
                          onChange={(e) => setNewDomain(e.target.value)}
                          className="bg-zinc-800/50 border-zinc-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subdomain">Subdomínio para URL</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="subdomain"
                            placeholder="app"
                            value={subdomain}
                            onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
                            className="bg-zinc-800/50 border-zinc-700 w-24"
                          />
                          <span className="text-zinc-500 text-sm">
                            .{newDomain || 'seudominio.com.br'}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Ex: app, escola, portal
                        </p>
                      </div>
                    </div>

                    {newDomain && (
                      <div className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/50">
                        <p className="text-sm text-zinc-400">Resultado:</p>
                        <p className="text-sm">
                          <span className="text-blue-400">URL:</span> {subdomain}.{newDomain}
                        </p>
                        <p className="text-sm">
                          <span className="text-pink-400">Email:</span> contato@{newDomain}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={() => registerDomainMutation.mutate({ domain: newDomain, subdomain })}
                      disabled={!newDomain || !subdomain || registerDomainMutation.isPending}
                      className="bg-gradient-to-r from-pink-600 to-violet-600 hover:from-pink-700 hover:to-violet-700"
                    >
                      {registerDomainMutation.isPending && (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      )}
                      Configurar Domínio
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
