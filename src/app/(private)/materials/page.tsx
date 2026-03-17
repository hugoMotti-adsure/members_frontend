'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Plus, 
  Trash2, 
  FileText, 
  Link as LinkIcon, 
  GripVertical,
  Upload,
  File,
  FileAudio,
  FileSpreadsheet,
  FileArchive,
  Image,
  X,
  Loader2,
  MoreVertical,
  Eye,
  EyeOff,
  Edit,
  ExternalLink
} from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/features/auth/stores/auth.store'
import { AdminGuard } from '@/components/auth/admin-guard'

interface GlobalMaterial {
  id: string
  title: string
  description?: string
  file_url: string
  file_type: string
  file_size?: number
  order_index: number
  is_downloadable: boolean
  is_published: boolean
  created_at: string
}

const fileTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  image: { icon: <Image className="w-5 h-5" />, color: 'text-pink-500', label: 'Imagem' },
  pdf: { icon: <FileText className="w-5 h-5" />, color: 'text-red-500', label: 'PDF' },
  doc: { icon: <FileText className="w-5 h-5" />, color: 'text-blue-500', label: 'Word' },
  xls: { icon: <FileSpreadsheet className="w-5 h-5" />, color: 'text-green-500', label: 'Excel' },
  csv: { icon: <FileSpreadsheet className="w-5 h-5" />, color: 'text-green-400', label: 'CSV' },
  ppt: { icon: <FileText className="w-5 h-5" />, color: 'text-orange-500', label: 'PowerPoint' },
  audio: { icon: <FileAudio className="w-5 h-5" />, color: 'text-purple-500', label: 'Áudio' },
  zip: { icon: <FileArchive className="w-5 h-5" />, color: 'text-yellow-500', label: 'ZIP' },
  link: { icon: <LinkIcon className="w-5 h-5" />, color: 'text-cyan-500', label: 'Link' },
  txt: { icon: <FileText className="w-5 h-5" />, color: 'text-zinc-400', label: 'Texto' },
  other: { icon: <File className="w-5 h-5" />, color: 'text-zinc-500', label: 'Arquivo' },
}

const acceptedFileTypes = [
  // Imagens
  '.jpg', '.jpeg', '.png', '.gif', '.webp',
  // Documentos
  '.pdf',
  '.doc', '.docx',
  '.xls', '.xlsx',
  '.ppt', '.pptx',
  '.csv',
  '.txt',
  // Áudio
  '.mp3', '.wav', '.ogg', '.aac', '.m4a',
  // Compactados
  '.zip', '.rar'
].join(',')

function MaterialsPageContent() {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const user = useAuthStore((state) => state.user)
  const tenantId = user?.tenant_id
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState<GlobalMaterial | null>(null)
  const [uploadType, setUploadType] = useState<'file' | 'link'>('file')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const [newMaterial, setNewMaterial] = useState({
    title: '',
    description: '',
    file_url: '',
    file_type: 'link',
    file_size: 0,
    is_downloadable: true,
    is_published: true,
  })
  const [editSelectedFile, setEditSelectedFile] = useState<File | null>(null)
  const [editUploadType, setEditUploadType] = useState<'file' | 'link'>('file')
  const [isEditUploading, setIsEditUploading] = useState(false)
  const [editUploadProgress, setEditUploadProgress] = useState(0)
  const editFileInputRef = useRef<HTMLInputElement>(null)

  // Busca materiais globais
  const { data: materials = [], isLoading } = useQuery<GlobalMaterial[]>({
    queryKey: ['global-materials', tenantId],
    queryFn: () => api.get(`/global-materials/tenant/${tenantId}?includeUnpublished=true`).then(res => res.data),
    enabled: !!tenantId,
  })

  // Mutation para adicionar material
  const addMutation = useMutation({
    mutationFn: (data: typeof newMaterial) => 
      api.post('/global-materials', {
        ...data,
        tenant_id: tenantId,
        created_by: user?.id,
      }),
    onSuccess: () => {
      toast({ title: 'Material adicionado com sucesso!' })
      queryClient.invalidateQueries({ queryKey: ['global-materials', tenantId] })
      resetForm()
      setShowAddDialog(false)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar material',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  // Mutation para atualizar material
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<GlobalMaterial> }) =>
      api.patch(`/global-materials/${id}`, data),
    onSuccess: () => {
      toast({ title: 'Material atualizado com sucesso!' })
      queryClient.invalidateQueries({ queryKey: ['global-materials', tenantId] })
      setEditingMaterial(null)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao atualizar material',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  // Mutation para remover material
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/global-materials/${id}`),
    onSuccess: () => {
      toast({ title: 'Material removido com sucesso!' })
      queryClient.invalidateQueries({ queryKey: ['global-materials', tenantId] })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover material',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const resetForm = () => {
    setSelectedFile(null)
    setUploadProgress(0)
    setUploadType('file')
    setNewMaterial({
      title: '',
      description: '',
      file_url: '',
      file_type: 'link',
      file_size: 0,
      is_downloadable: true,
      is_published: true,
    })
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validação de tamanho (50MB)
    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 50MB',
        variant: 'destructive',
      })
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setSelectedFile(file)
    const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '')
    setNewMaterial(prev => ({ ...prev, title: nameWithoutExt }))
  }

  const handleUploadFile = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)

    const fileToUpload = selectedFile
    const titleToUse = newMaterial.title || selectedFile.name

    try {
      const formData = new FormData()
      formData.append('file', fileToUpload)

      const response = await api.post('/upload/file?folder=global-materials', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.total
            ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
            : 0
          setUploadProgress(progress)
        },
      })

      await addMutation.mutateAsync({
        ...newMaterial,
        title: titleToUse,
        file_url: response.data.url,
        file_type: response.data.fileType,
        file_size: response.data.size,
      })

    } catch (error: any) {
      toast({
        title: 'Erro ao fazer upload',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleAddLink = () => {
    if (!newMaterial.title || !newMaterial.file_url) {
      toast({
        title: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      })
      return
    }
    addMutation.mutate(newMaterial)
  }

  const togglePublished = (material: GlobalMaterial) => {
    updateMutation.mutate({
      id: material.id,
      data: { is_published: !material.is_published },
    })
  }

  const handleEditFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 50 * 1024 * 1024) {
      toast({
        title: 'Arquivo muito grande',
        description: 'O tamanho máximo permitido é 50MB',
        variant: 'destructive',
      })
      if (editFileInputRef.current) {
        editFileInputRef.current.value = ''
      }
      return
    }

    setEditSelectedFile(file)
  }

  const handleEditSave = async () => {
    if (!editingMaterial) return

    // Se tem um novo arquivo selecionado, faz upload primeiro
    if (editSelectedFile) {
      setIsEditUploading(true)
      setEditUploadProgress(0)

      try {
        const formData = new FormData()
        formData.append('file', editSelectedFile)

        const response = await api.post('/upload/file?folder=global-materials', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          onUploadProgress: (progressEvent) => {
            const progress = progressEvent.total
              ? Math.round((progressEvent.loaded * 100) / progressEvent.total)
              : 0
            setEditUploadProgress(progress)
          },
        })

        await updateMutation.mutateAsync({
          id: editingMaterial.id,
          data: {
            title: editingMaterial.title,
            description: editingMaterial.description,
            file_url: response.data.url,
            file_type: response.data.fileType,
            file_size: response.data.size,
            is_downloadable: editingMaterial.is_downloadable,
            is_published: editingMaterial.is_published,
          },
        })

        setEditSelectedFile(null)
        setEditingMaterial(null)
      } catch (error: any) {
        toast({
          title: 'Erro ao fazer upload',
          description: error.response?.data?.message || 'Tente novamente',
          variant: 'destructive',
        })
      } finally {
        setIsEditUploading(false)
        setEditUploadProgress(0)
      }
    } else {
      // Sem novo arquivo, apenas atualiza os metadados
      updateMutation.mutate({
        id: editingMaterial.id,
        data: {
          title: editingMaterial.title,
          description: editingMaterial.description,
          file_url: editingMaterial.file_url,
          is_downloadable: editingMaterial.is_downloadable,
          is_published: editingMaterial.is_published,
        },
      })
    }
  }

  const openEditFileSelector = () => {
    if (editFileInputRef.current) {
      editFileInputRef.current.click()
    }
  }

  const resetEditForm = () => {
    setEditSelectedFile(null)
    setEditUploadProgress(0)
    setEditUploadType('file')
    if (editFileInputRef.current) {
      editFileInputRef.current.value = ''
    }
  }

  const getFileConfig = (fileType: string) => {
    return fileTypeConfig[fileType] || fileTypeConfig.other
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return ''
    const mb = bytes / (1024 * 1024)
    if (mb >= 1) return `${mb.toFixed(1)} MB`
    const kb = bytes / 1024
    return `${kb.toFixed(0)} KB`
  }

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Materiais</h1>
          <p className="text-muted-foreground">
            Gerencie materiais globais como PDFs, documentos, planilhas e links
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Material
        </Button>
      </div>

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFileTypes}
        onChange={handleFileSelect}
        style={{ display: 'none' }}
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : materials.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum material ainda</h3>
          <p className="text-muted-foreground mb-4">
            Adicione PDFs, documentos, planilhas ou links para compartilhar
          </p>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Material
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => {
            const config = getFileConfig(material.file_type)
            return (
              <Card key={material.id} className={cn(
                'group hover:border-primary/50 transition-colors',
                !material.is_published && 'opacity-60'
              )}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn('flex-shrink-0 p-2 rounded-lg bg-muted', config.color)}>
                        {config.icon}
                      </div>
                      <div className="min-w-0">
                        <CardTitle className="text-base line-clamp-1">{material.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {config.label}
                          {material.file_size && ` • ${formatFileSize(material.file_size)}`}
                        </p>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <a href={material.file_url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Abrir
                          </a>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setEditingMaterial(material)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => togglePublished(material)}>
                          {material.is_published ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Despublicar
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Publicar
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => {
                            if (confirm('Tem certeza que deseja excluir este material?')) {
                              deleteMutation.mutate(material.id)
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  {material.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {material.description}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge variant={material.is_published ? 'default' : 'secondary'}>
                      {material.is_published ? 'Publicado' : 'Rascunho'}
                    </Badge>
                    {material.is_downloadable && (
                      <Badge variant="outline">Download</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Dialog para adicionar material */}
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Novo Material</DialogTitle>
            <DialogDescription>
              Faça upload de arquivos ou adicione links externos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => setUploadType('file')}
                className={cn(
                  'flex-1 px-3 py-2 rounded text-sm font-medium transition-colors',
                  uploadType === 'file' ? 'bg-background shadow' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Upload de Arquivo
              </button>
              <button
                onClick={() => setUploadType('link')}
                className={cn(
                  'flex-1 px-3 py-2 rounded text-sm font-medium transition-colors',
                  uploadType === 'link' ? 'bg-background shadow' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Link Externo
              </button>
            </div>

            {uploadType === 'file' ? (
              <>
                {selectedFile ? (
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <File className="w-8 h-8 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
                    </div>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-background rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={openFileSelector}
                    onKeyDown={(e) => e.key === 'Enter' && openFileSelector()}
                    className="w-full p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg hover:border-primary/50 transition-colors flex flex-col items-center gap-2 cursor-pointer"
                  >
                    <Upload className="w-10 h-10 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Clique para selecionar arquivo</span>
                    <span className="text-xs text-muted-foreground/70">JPG, PNG, PDF, DOC, XLS, CSV, MP3, ZIP (máx. 50MB)</span>
                  </div>
                )}

                {isUploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Enviando...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="title">Título (opcional)</Label>
                  <Input
                    id="title"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    placeholder="Nome do arquivo será usado se vazio"
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="title">Título *</Label>
                  <Input
                    id="title"
                    value={newMaterial.title}
                    onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                    placeholder="Ex: Planilha de exercícios"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">URL do Material *</Label>
                  <Input
                    id="url"
                    value={newMaterial.file_url}
                    onChange={(e) => setNewMaterial({ ...newMaterial, file_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="description">Descrição (opcional)</Label>
              <Input
                id="description"
                value={newMaterial.description}
                onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                placeholder="Breve descrição do material"
              />
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="downloadable"
                  checked={newMaterial.is_downloadable}
                  onChange={(e) => setNewMaterial({ ...newMaterial, is_downloadable: e.target.checked })}
                  className="rounded border-muted-foreground/25"
                />
                <Label htmlFor="downloadable" className="cursor-pointer text-sm">
                  Permitir download
                </Label>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="published"
                  checked={newMaterial.is_published}
                  onChange={(e) => setNewMaterial({ ...newMaterial, is_published: e.target.checked })}
                  className="rounded border-muted-foreground/25"
                />
                <Label htmlFor="published" className="cursor-pointer text-sm">
                  Publicar imediatamente
                </Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={uploadType === 'file' ? handleUploadFile : handleAddLink}
              disabled={
                isUploading || 
                addMutation.isPending ||
                (uploadType === 'file' && !selectedFile) ||
                (uploadType === 'link' && (!newMaterial.title || !newMaterial.file_url))
              }
            >
              {isUploading || addMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : uploadType === 'file' ? (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Enviar
                </>
              ) : (
                'Adicionar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Input de arquivo oculto para edição */}
      <input
        ref={editFileInputRef}
        type="file"
        accept={acceptedFileTypes}
        onChange={handleEditFileSelect}
        style={{ display: 'none' }}
      />

      {/* Dialog para editar material */}
      <Dialog open={!!editingMaterial} onOpenChange={(open) => {
        if (!open) {
          setEditingMaterial(null)
          resetEditForm()
        }
      }}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Editar Material</DialogTitle>
            <DialogDescription>
              Atualize as informações ou substitua o arquivo
            </DialogDescription>
          </DialogHeader>

          {editingMaterial && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  value={editingMaterial.title}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-description">Descrição</Label>
                <Input
                  id="edit-description"
                  value={editingMaterial.description || ''}
                  onChange={(e) => setEditingMaterial({ ...editingMaterial, description: e.target.value })}
                  placeholder="Breve descrição do material"
                />
              </div>

              {/* Seção de Arquivo/Link */}
              <div className="space-y-2">
                <Label>Arquivo</Label>
                
                {editSelectedFile ? (
                  // Novo arquivo selecionado
                  <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                    <File className="w-8 h-8 text-primary" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{editSelectedFile.name}</p>
                      <p className="text-xs text-muted-foreground">{formatFileSize(editSelectedFile.size)}</p>
                      <p className="text-xs text-green-500">Novo arquivo selecionado</p>
                    </div>
                    <button
                      onClick={() => setEditSelectedFile(null)}
                      className="p-1 hover:bg-background rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : editingMaterial.file_type === 'link' ? (
                  // Link atual
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <LinkIcon className="w-6 h-6 text-cyan-500" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">Link atual</p>
                      </div>
                    </div>
                    <Input
                      value={editingMaterial.file_url}
                      onChange={(e) => setEditingMaterial({ ...editingMaterial, file_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                ) : (
                  // Arquivo atual
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                      <div className={cn('flex-shrink-0', getFileConfig(editingMaterial.file_type).color)}>
                        {getFileConfig(editingMaterial.file_type).icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">Arquivo atual</p>
                        <p className="text-xs text-muted-foreground">
                          {getFileConfig(editingMaterial.file_type).label}
                          {editingMaterial.file_size && ` • ${formatFileSize(editingMaterial.file_size)}`}
                        </p>
                      </div>
                      <a
                        href={editingMaterial.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-background rounded"
                      >
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={openEditFileSelector}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Substituir arquivo
                    </Button>
                  </div>
                )}

                {isEditUploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Enviando...</span>
                      <span>{editUploadProgress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-300"
                        style={{ width: `${editUploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-downloadable"
                    checked={editingMaterial.is_downloadable}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, is_downloadable: e.target.checked })}
                    className="rounded border-muted-foreground/25"
                  />
                  <Label htmlFor="edit-downloadable" className="cursor-pointer text-sm">
                    Permitir download
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="edit-published"
                    checked={editingMaterial.is_published}
                    onChange={(e) => setEditingMaterial({ ...editingMaterial, is_published: e.target.checked })}
                    className="rounded border-muted-foreground/25"
                  />
                  <Label htmlFor="edit-published" className="cursor-pointer text-sm">
                    Publicado
                  </Label>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditingMaterial(null)
              resetEditForm()
            }}>
              Cancelar
            </Button>
            <Button
              onClick={handleEditSave}
              disabled={isEditUploading || updateMutation.isPending}
            >
              {isEditUploading || updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                'Salvar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function MaterialsPage() {
  return (
    <AdminGuard>
      <MaterialsPageContent />
    </AdminGuard>
  )
}
