'use client'

import { useQuery } from '@tanstack/react-query'
import { 
  Award, 
  Download,
  ExternalLink,
  Loader2,
  Calendar
} from 'lucide-react'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface Certificate {
  id: string
  course_id: string
  issued_at: string
  certificate_url: string | null
  course: {
    id: string
    title: string
    thumbnail_url: string | null
  }
}

export default function MyCertificatesPage() {
  const { data: certificates = [], isLoading } = useQuery<Certificate[]>({
    queryKey: ['my-certificates'],
    queryFn: () => api.get('/certificates/my-certificates').then(res => res.data),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meus Certificados</h1>
        <p className="text-muted-foreground">
          Visualize e baixe seus certificados de conclusão
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : certificates.length === 0 ? (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Award className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Nenhum certificado ainda</h3>
          <p className="text-muted-foreground">
            Complete um curso para receber seu certificado de conclusão.
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {certificates.map((certificate) => (
            <Card key={certificate.id} className="overflow-hidden">
              <div className="relative h-32 bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center">
                <Award className="w-16 h-16 text-amber-500" />
              </div>
              
              <CardHeader className="pb-2">
                <h3 className="font-semibold text-lg line-clamp-2">
                  {certificate.course?.title || 'Curso'}
                </h3>
              </CardHeader>

              <CardContent>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="w-4 h-4" />
                  Emitido em {new Date(certificate.issued_at).toLocaleDateString('pt-BR')}
                </div>

                <div className="flex gap-2">
                  {certificate.certificate_url ? (
                    <>
                      <Button variant="outline" size="sm" className="flex-1" asChild>
                        <a href={certificate.certificate_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Visualizar
                        </a>
                      </Button>
                      <Button size="sm" className="flex-1" asChild>
                        <a href={certificate.certificate_url} download>
                          <Download className="w-4 h-4 mr-2" />
                          Baixar
                        </a>
                      </Button>
                    </>
                  ) : (
                    <Button variant="outline" size="sm" className="w-full" disabled>
                      Certificado em processamento
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
