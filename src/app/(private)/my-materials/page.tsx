'use client'

import { useQuery } from '@tanstack/react-query'
import { 
  FileText, 
  FileSpreadsheet, 
  FileArchive, 
  FileAudio,
  File,
  Image,
  Link as LinkIcon,
  Download,
  ExternalLink,
  Loader2,
  FolderOpen
} from 'lucide-react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface Material {
  id: string
  title: string
  description?: string
  file_url: string
  file_type: string
  file_size?: number
  is_downloadable: boolean
  created_at: string
}

const fileTypeConfig: Record<string, { icon: React.ReactNode; color: string; label: string; bgColor: string }> = {
  image: { icon: <Image className="w-6 h-6" />, color: 'text-pink-500', bgColor: 'bg-pink-500/10', label: 'Imagem' },
  pdf: { icon: <FileText className="w-6 h-6" />, color: 'text-red-500', bgColor: 'bg-red-500/10', label: 'PDF' },
  doc: { icon: <FileText className="w-6 h-6" />, color: 'text-blue-500', bgColor: 'bg-blue-500/10', label: 'Word' },
  xls: { icon: <FileSpreadsheet className="w-6 h-6" />, color: 'text-green-500', bgColor: 'bg-green-500/10', label: 'Excel' },
  csv: { icon: <FileSpreadsheet className="w-6 h-6" />, color: 'text-green-400', bgColor: 'bg-green-400/10', label: 'CSV' },
  ppt: { icon: <FileText className="w-6 h-6" />, color: 'text-orange-500', bgColor: 'bg-orange-500/10', label: 'PowerPoint' },
  audio: { icon: <FileAudio className="w-6 h-6" />, color: 'text-purple-500', bgColor: 'bg-purple-500/10', label: 'Áudio' },
  zip: { icon: <FileArchive className="w-6 h-6" />, color: 'text-yellow-500', bgColor: 'bg-yellow-500/10', label: 'ZIP' },
  link: { icon: <LinkIcon className="w-6 h-6" />, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', label: 'Link' },
  txt: { icon: <FileText className="w-6 h-6" />, color: 'text-zinc-400', bgColor: 'bg-zinc-400/10', label: 'Texto' },
  other: { icon: <File className="w-6 h-6" />, color: 'text-zinc-500', bgColor: 'bg-zinc-500/10', label: 'Arquivo' },
}

export default function MyMaterialsPage() {
  const { data: materials = [], isLoading } = useQuery<Material[]>({
    queryKey: ['my-materials'],
    queryFn: () => api.get('/global-materials/my-materials').then(res => res.data),
  })

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

  const handleOpen = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const downloadUrl = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(downloadUrl)
    } catch {
      // Fallback: abre em nova aba
      window.open(url, '_blank')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meus Materiais</h1>
        <p className="text-muted-foreground">
          Acesse seus materiais de apoio: PDFs, planilhas, documentos e links
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : materials.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FolderOpen className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum material disponível</h3>
          <p className="text-muted-foreground">
            Você ainda não tem acesso a materiais de apoio.
            <br />
            Os materiais serão liberados conforme suas matrículas.
          </p>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {materials.map((material) => {
            const config = getFileConfig(material.file_type)
            return (
              <Card key={material.id} className="group hover:border-primary/50 transition-colors">
                <CardHeader className="pb-3">
                  <div className="flex items-start gap-4">
                    <div className={cn(
                      'flex-shrink-0 p-3 rounded-lg',
                      config.bgColor,
                      config.color
                    )}>
                      {config.icon}
                    </div>
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-base line-clamp-2 mb-1">
                        {material.title}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {config.label}
                        </Badge>
                        {material.file_size && (
                          <span className="text-xs text-muted-foreground">
                            {formatFileSize(material.file_size)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {material.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {material.description}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleOpen(material.file_url)}
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Abrir
                    </Button>
                    {material.is_downloadable && material.file_type !== 'link' && (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleDownload(material.file_url, material.title)}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Baixar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
