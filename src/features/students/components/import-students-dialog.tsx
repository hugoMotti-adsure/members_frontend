'use client'

import { useState, useCallback, useRef } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, XCircle, Download, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
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

interface ImportStudentsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

interface ImportResult {
  total: number
  created: number
  updated: number
  errors: number
  details: {
    email: string
    status: 'created' | 'updated' | 'error' | 'skipped'
    message?: string
  }[]
}

export function ImportStudentsDialog({ open, onOpenChange, onSuccess }: ImportStudentsDialogProps) {
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<{ email: string; name: string }[]>([])
  const [selectedCourse, setSelectedCourse] = useState<string>('')
  const [sendEmail, setSendEmail] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)

  // Busca cursos para seleção
  const { data: coursesData } = useQuery({
    queryKey: ['courses'],
    queryFn: () => api.get('/courses').then(res => res.data),
    enabled: open,
  })

  const courses = coursesData?.data || coursesData || []

  // Mutation para importar
  const importMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Selecione um arquivo')

      const formData = new FormData()
      formData.append('file', file)
      if (selectedCourse) formData.append('course_id', selectedCourse)
      formData.append('send_email', String(sendEmail))

      const response = await api.post('/users/import/csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      return response.data
    },
    onSuccess: (data: ImportResult) => {
      setResult(data)
      queryClient.invalidateQueries({ queryKey: ['students'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
      
      toast({
        title: 'Importação concluída!',
        description: `${data.created} criados, ${data.updated} atualizados, ${data.errors} erros`,
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Erro na importação',
        description: error.response?.data?.message || error.message,
        variant: 'destructive',
      })
    },
  })

  // Parse do CSV para preview
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setResult(null)

    // Lê o arquivo para preview
    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const lines = content.split('\n').filter(line => line.trim())
      
      if (lines.length < 2) {
        toast({ title: 'Arquivo vazio ou inválido', variant: 'destructive' })
        return
      }

      const header = lines[0].toLowerCase().split(/[,;]/).map(h => h.trim())
      const emailIdx = header.findIndex(h => h.includes('email'))
      const nameIdx = header.findIndex(h => h.includes('nome') || h.includes('name'))

      if (emailIdx === -1 || nameIdx === -1) {
        toast({ 
          title: 'Formato inválido', 
          description: 'O CSV deve conter colunas "email" e "nome"',
          variant: 'destructive' 
        })
        return
      }

      const previewData = lines.slice(1, 11).map(line => {
        const cols = line.split(/[,;]/).map(c => c.trim().replace(/^"|"$/g, ''))
        return {
          email: cols[emailIdx] || '',
          name: cols[nameIdx] || '',
        }
      }).filter(row => row.email && row.name)

      setPreview(previewData)
    }
    reader.readAsText(selectedFile)
  }, [toast])

  const handleClose = () => {
    setFile(null)
    setPreview([])
    setResult(null)
    setSelectedCourse('')
    setSendEmail(false)
    onOpenChange(false)
    if (result && result.created > 0) {
      onSuccess?.()
    }
  }

  const downloadTemplate = () => {
    const template = 'email,nome,telefone,senha\njoao@email.com,João Silva,11999999999,\nmaria@email.com,Maria Santos,11888888888,'
    const blob = new Blob([template], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'template-alunos.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            Importar Alunos
          </DialogTitle>
          <DialogDescription>
            Importe alunos em lote através de um arquivo CSV
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Upload Area */}
          {!result && (
            <>
              <div
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors',
                  file ? 'border-green-500 bg-green-500/10' : 'border-border hover:border-primary/50'
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {file ? (
                  <div className="flex flex-col items-center gap-2">
                    <CheckCircle className="w-10 h-10 text-green-500" />
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {preview.length} alunos encontrados (prévia)
                    </p>
                    <Button type="button" variant="outline" size="sm">
                      Trocar arquivo
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload className="w-10 h-10 text-muted-foreground" />
                    <p className="font-medium">Clique para selecionar o arquivo CSV</p>
                    <p className="text-sm text-muted-foreground">
                      ou arraste e solte aqui
                    </p>
                  </div>
                )}
              </div>

              {/* Template Download */}
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm font-medium">Não tem um arquivo?</p>
                  <p className="text-xs text-muted-foreground">Baixe o template de exemplo</p>
                </div>
                <Button variant="outline" size="sm" onClick={downloadTemplate}>
                  <Download className="w-4 h-4 mr-2" />
                  Template
                </Button>
              </div>

              {/* Preview */}
              {preview.length > 0 && (
                <div className="space-y-2">
                  <Label>Prévia dos dados ({preview.length} primeiros)</Label>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="px-3 py-2 text-left">Email</th>
                          <th className="px-3 py-2 text-left">Nome</th>
                        </tr>
                      </thead>
                      <tbody>
                        {preview.map((row, i) => (
                          <tr key={i} className="border-t">
                            <td className="px-3 py-2">{row.email}</td>
                            <td className="px-3 py-2">{row.name}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Opções */}
              {preview.length > 0 && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label htmlFor="course">Matricular no curso (opcional)</Label>
                    <select
                      id="course"
                      value={selectedCourse}
                      onChange={(e) => setSelectedCourse(e.target.value)}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                    >
                      <option value="">Não matricular automaticamente</option>
                      {courses.map((course: any) => (
                        <option key={course.id} value={course.id}>
                          {course.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sendEmail}
                      onChange={(e) => setSendEmail(e.target.checked)}
                      className="rounded border-input"
                    />
                    <span className="text-sm">Enviar email com credenciais para novos alunos</span>
                  </label>
                </div>
              )}
            </>
          )}

          {/* Resultado */}
          {result && (
            <div className="space-y-4">
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{result.total}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-green-500">{result.created}</p>
                  <p className="text-xs text-muted-foreground">Criados</p>
                </div>
                <div className="p-3 bg-blue-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-blue-500">{result.updated}</p>
                  <p className="text-xs text-muted-foreground">Atualizados</p>
                </div>
                <div className="p-3 bg-red-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-red-500">{result.errors}</p>
                  <p className="text-xs text-muted-foreground">Erros</p>
                </div>
              </div>

              {/* Detalhes */}
              <div className="max-h-[200px] overflow-y-auto border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left">Email</th>
                      <th className="px-3 py-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.details.map((row, i) => (
                      <tr key={i} className="border-t">
                        <td className="px-3 py-2">{row.email}</td>
                        <td className="px-3 py-2">
                          <span className={cn(
                            'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full',
                            row.status === 'created' && 'bg-green-500/10 text-green-500',
                            row.status === 'updated' && 'bg-blue-500/10 text-blue-500',
                            row.status === 'error' && 'bg-red-500/10 text-red-500',
                          )}>
                            {row.status === 'created' && <CheckCircle className="w-3 h-3" />}
                            {row.status === 'updated' && <CheckCircle className="w-3 h-3" />}
                            {row.status === 'error' && <XCircle className="w-3 h-3" />}
                            {row.message || row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {!result ? (
            <>
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={() => importMutation.mutate()}
                disabled={!file || preview.length === 0 || importMutation.isPending}
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Importar {preview.length} alunos
                  </>
                )}
              </Button>
            </>
          ) : (
            <Button onClick={handleClose}>
              Fechar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
