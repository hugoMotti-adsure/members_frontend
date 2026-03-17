'use client'

import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  Loader2, 
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
  X
} from 'lucide-react'
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
import { cn } from '@/lib/utils'

interface Material {
  id: string
  title: string
  description?: string
  file_url: string
  file_type: string
  file_size?: number
  order_index: number
  is_downloadable: boolean
}

interface LessonMaterialsManagerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  lessonId: string
  tenantId: string
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

export function LessonMaterialsManager({ 
  open, 
  onOpenChange, 
  lessonId, 
  tenantId 
}: LessonMaterialsManagerProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [showAddForm, setShowAddForm] = useState(false)
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
  })

  // Busca materiais da aula
  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ['lesson-materials', lessonId],
    queryFn: () => api.get(`/materials/lesson/${lessonId}`).then(res => res.data),
    enabled: open && !!lessonId,
  })

  // Mutation para adicionar material
  const addMutation = useMutation({
    mutationFn: (data: typeof newMaterial) => 
      api.post('/materials', {
        ...data,
        lesson_id: lessonId,
        tenant_id: tenantId,
      }),
    onSuccess: () => {
      toast({ title: 'Material adicionado com sucesso!' })
      queryClient.invalidateQueries({ queryKey: ['lesson-materials', lessonId] })
      // Mantém o formulário aberto para adicionar mais arquivos
      resetForm(true)
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao adicionar material',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  // Mutation para remover material
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/materials/${id}`),
    onSuccess: () => {
      toast({ title: 'Material removido com sucesso!' })
      queryClient.invalidateQueries({ queryKey: ['lesson-materials', lessonId] })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao remover material',
        description: error.response?.data?.message || 'Tente novamente',
        variant: 'destructive',
      })
    },
  })

  const resetForm = (keepFormOpen = false) => {
    if (!keepFormOpen) {
      setShowAddForm(false)
    }
    setSelectedFile(null)
    setUploadProgress(0)
    setNewMaterial({
      title: '',
      description: '',
      file_url: '',
      file_type: 'link',
      file_size: 0,
      is_downloadable: true,
    })
    // Limpa o input file para permitir selecionar novo arquivo
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
      // Limpa o input para permitir tentar novamente
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    setSelectedFile(file)
    // Preenche o título automaticamente com o nome do arquivo
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

      const response = await api.post('/upload/file?folder=materials', formData, {
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

      // Cria o material com a URL do arquivo
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

  // Função para abrir o seletor de arquivos
  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Materiais da Aula</DialogTitle>
          <DialogDescription>
            Faça upload de arquivos complementares (PDF, DOC, CSV, áudio, etc)
          </DialogDescription>
        </DialogHeader>

        {/* Input de arquivo - FORA de todos os condicionais */}
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileSelect}
          style={{ display: 'none' }}
        />

        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Lista de materiais */}
              {materials.length > 0 && (
                <div className="space-y-2">
                  {materials.map((material) => {
                    const config = getFileConfig(material.file_type)
                    return (
                      <div
                        key={material.id}
                        className="flex items-center gap-3 p-3 rounded-lg bg-zinc-900 border border-zinc-800"
                      >
                        <GripVertical className="w-4 h-4 text-zinc-600 cursor-grab" />
                        <div className={cn('flex-shrink-0', config.color)}>
                          {config.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{material.title}</p>
                          <p className="text-xs text-zinc-500 truncate">
                            {config.label}
                            {material.file_size && ` • ${formatFileSize(material.file_size)}`}
                          </p>
                        </div>
                        <a
                          href={material.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-zinc-800 rounded transition-colors"
                          title="Abrir arquivo"
                        >
                          <LinkIcon className="w-4 h-4 text-zinc-400" />
                        </a>
                        <button
                          onClick={() => deleteMutation.mutate(material.id)}
                          disabled={deleteMutation.isPending}
                          className="p-2 hover:bg-red-500/10 rounded transition-colors text-red-500"
                          title="Remover"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Empty state */}
              {materials.length === 0 && !showAddForm && (
                <div className="text-center py-8 text-zinc-500">
                  <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Nenhum material adicionado</p>
                </div>
              )}

              {/* Formulário para adicionar material */}
              {showAddForm ? (
                <div className="space-y-4 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Novo Material</h4>
                    <div className="flex gap-1 bg-zinc-800 rounded-lg p-1">
                      <button
                        onClick={() => setUploadType('file')}
                        className={cn(
                          'px-3 py-1.5 rounded text-xs font-medium transition-colors',
                          uploadType === 'file' ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white'
                        )}
                      >
                        Upload
                      </button>
                      <button
                        onClick={() => setUploadType('link')}
                        className={cn(
                          'px-3 py-1.5 rounded text-xs font-medium transition-colors',
                          uploadType === 'link' ? 'bg-primary text-white' : 'text-zinc-400 hover:text-white'
                        )}
                      >
                        Link
                      </button>
                    </div>
                  </div>

                  {uploadType === 'file' ? (
                    <>
                      {selectedFile ? (
                        <div className="flex items-center gap-3 p-3 bg-zinc-800 rounded-lg">
                          <File className="w-8 h-8 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{selectedFile.name}</p>
                            <p className="text-xs text-zinc-500">{formatFileSize(selectedFile.size)}</p>
                          </div>
                          <button
                            onClick={() => setSelectedFile(null)}
                            className="p-1 hover:bg-zinc-700 rounded"
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
                          className="w-full p-6 border-2 border-dashed border-zinc-700 rounded-lg hover:border-primary/50 transition-colors flex flex-col items-center gap-2 cursor-pointer"
                        >
                          <Upload className="w-8 h-8 text-zinc-500" />
                          <span className="text-sm text-zinc-400">Clique para selecionar arquivo</span>
                          <span className="text-xs text-zinc-600">JPG, PNG, PDF, DOC, XLS, CSV, MP3, ZIP (máx. 50MB)</span>
                        </div>
                      )}

                      {/* Progress bar */}
                      {isUploading && (
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs text-zinc-500">
                            <span>Enviando...</span>
                            <span>{uploadProgress}%</span>
                          </div>
                          <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Título (opcional para upload) */}
                      <div className="space-y-2">
                        <Label htmlFor="mat-title">Título (opcional)</Label>
                        <Input
                          id="mat-title"
                          value={newMaterial.title}
                          onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                          placeholder="Nome do arquivo será usado se vazio"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mat-description">Descrição (opcional)</Label>
                        <Input
                          id="mat-description"
                          value={newMaterial.description}
                          onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                          placeholder="Breve descrição do material"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      {/* Link externo */}
                      <div className="space-y-2">
                        <Label htmlFor="mat-title">Título *</Label>
                        <Input
                          id="mat-title"
                          value={newMaterial.title}
                          onChange={(e) => setNewMaterial({ ...newMaterial, title: e.target.value })}
                          placeholder="Ex: Planilha de exercícios"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mat-description">Descrição (opcional)</Label>
                        <Input
                          id="mat-description"
                          value={newMaterial.description}
                          onChange={(e) => setNewMaterial({ ...newMaterial, description: e.target.value })}
                          placeholder="Breve descrição do material"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="mat-url">URL do Material *</Label>
                        <Input
                          id="mat-url"
                          value={newMaterial.file_url}
                          onChange={(e) => setNewMaterial({ ...newMaterial, file_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </>
                  )}

                  {/* Checkbox de download */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="mat-downloadable"
                      checked={newMaterial.is_downloadable}
                      onChange={(e) => setNewMaterial({ ...newMaterial, is_downloadable: e.target.checked })}
                      className="rounded border-zinc-700"
                    />
                    <Label htmlFor="mat-downloadable" className="cursor-pointer text-sm">
                      Permitir download
                    </Label>
                  </div>

                  <div className="flex gap-2 justify-end pt-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => resetForm()}
                      disabled={isUploading}
                    >
                      Cancelar
                    </Button>
                    <Button
                      type="button"
                      size="sm"
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
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => setShowAddForm(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Material
                </Button>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
