'use client'

import { useQuery } from '@tanstack/react-query'
import { Award, Search, ExternalLink } from 'lucide-react'
import { useState } from 'react'
import { api } from '@/lib/api'
import { Input } from '@/components/ui/input'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

export default function AdminCertificatesPage() {
  const [search, setSearch] = useState('')

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['admin-certificates'],
    queryFn: () => api.get('/certificates/admin/all').then((res) => res.data),
  })

  const filtered = certificates.filter((cert: any) => {
    const q = search.toLowerCase()
    return (
      cert.user?.name?.toLowerCase().includes(q) ||
      cert.user?.email?.toLowerCase().includes(q) ||
      cert.course?.title?.toLowerCase().includes(q) ||
      cert.certificate_number?.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Certificados</h1>
          <p className="text-muted-foreground">
            Certificados emitidos pelos alunos da sua escola
          </p>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Award className="h-5 w-5" />
          <span className="text-sm font-medium">{certificates.length} emitidos</span>
        </div>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por aluno, curso ou número..."
          className="pl-10"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Aluno</TableHead>
              <TableHead>Curso</TableHead>
              <TableHead>Nº do Certificado</TableHead>
              <TableHead>Emitido em</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(5)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={5}>
                    <div className="h-12 bg-muted animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                  <Award className="h-10 w-10 mx-auto mb-3 opacity-30" />
                  {search
                    ? `Nenhum certificado encontrado para "${search}"`
                    : 'Nenhum certificado emitido ainda'}
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((cert: any) => (
                <TableRow key={cert.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={cert.user?.avatar_url} />
                        <AvatarFallback>
                          {cert.user?.name?.charAt(0).toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{cert.user?.name || '—'}</p>
                        <p className="text-xs text-muted-foreground">{cert.user?.email || '—'}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {cert.course?.thumbnail_url && (
                        <img
                          src={cert.course.thumbnail_url}
                          alt={cert.course.title}
                          className="h-8 w-12 object-cover rounded"
                        />
                      )}
                      <span className="font-medium">{cert.course?.title || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {cert.certificate_number}
                      </code>
                      <a
                        href={`/verify/${cert.certificate_number}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Verificar certificado"
                      >
                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                      </a>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {cert.issued_at
                      ? new Date(cert.issued_at).toLocaleDateString('pt-BR')
                      : new Date(cert.created_at).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                      Válido
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
