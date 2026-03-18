"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Building2,
  GraduationCap,
  BookOpen,
  Users,
  Plus,
  MoreHorizontal,
  ExternalLink,
  PowerOff,
  Power,
  RefreshCw,
  Search,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useToast } from "@/components/ui/use-toast";

interface PlatformStats {
  total_schools: number;
  total_students: number;
  total_courses: number;
  total_active_enrollments: number;
}

interface School {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  primary_color: string;
  logo_url?: string;
  logo_icon_url?: string;
  created_at: string;
  stats: {
    students: number;
    courses: number;
  };
}

export default function PlatformPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [search, setSearch] = useState("");

  const { data: stats, isLoading: statsLoading } = useQuery<PlatformStats>({
    queryKey: ["platform-stats"],
    queryFn: () => api.get("/platform/stats").then((r) => r.data),
  });

  const { data: schools = [], isLoading: schoolsLoading, refetch } = useQuery<School[]>({
    queryKey: ["platform-schools"],
    queryFn: () => api.get("/platform/schools").then((r) => r.data),
  });

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      api.patch(`/platform/schools/${id}`, { is_active }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-schools"] });
      queryClient.invalidateQueries({ queryKey: ["platform-stats"] });
      toast({ title: "Status da escola atualizado" });
    },
    onError: () => toast({ title: "Erro ao atualizar status", variant: "destructive" }),
  });

  const switchMutation = useMutation({
    mutationFn: (id: string) =>
      api.post(`/platform/schools/${id}/switch`).then((r) => r.data),
    onSuccess: (data) => {
      // Salva token e tenant no localStorage e abre nova aba
      const currentToken = localStorage.getItem("access_token");
      const currentTenantId = localStorage.getItem("tenant_id");

      // Monta URL com params para que a nova aba possa capturar e aplicar
      const params = new URLSearchParams({
        switch_token: data.access_token,
        switch_tenant: data.tenant.id,
        switch_name: data.tenant.name,
      });
      window.open(`/platform/switch?${params.toString()}`, "_blank");
    },
    onError: () => toast({ title: "Erro ao acessar escola", variant: "destructive" }),
  });

  const filtered = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.slug.toLowerCase().includes(search.toLowerCase()),
  );

  const statCards = [
    {
      title: "Escolas Ativas",
      value: stats?.total_schools ?? "—",
      icon: Building2,
      color: "text-indigo-500",
      bg: "bg-indigo-50 dark:bg-indigo-950",
    },
    {
      title: "Total de Alunos",
      value: stats?.total_students ?? "—",
      icon: GraduationCap,
      color: "text-emerald-500",
      bg: "bg-emerald-50 dark:bg-emerald-950",
    },
    {
      title: "Total de Cursos",
      value: stats?.total_courses ?? "—",
      icon: BookOpen,
      color: "text-amber-500",
      bg: "bg-amber-50 dark:bg-amber-950",
    },
    {
      title: "Matrículas Ativas",
      value: stats?.total_active_enrollments ?? "—",
      icon: Users,
      color: "text-sky-500",
      bg: "bg-sky-50 dark:bg-sky-950",
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Painel da Plataforma</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Gerencie todas as escolas e crie novas
          </p>
        </div>
        <Button onClick={() => router.push("/platform/schools/new")}>
          <Plus className="w-4 h-4 mr-2" />
          Nova Escola
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title}>
            <CardContent className="flex items-center gap-4 pt-6">
              <div className={`p-3 rounded-xl ${card.bg}`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-2xl font-bold">
                  {statsLoading ? (
                    <span className="animate-pulse">...</span>
                  ) : (
                    card.value.toLocaleString("pt-BR")
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schools Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Todas as Escolas</CardTitle>
              <CardDescription>
                {schools.length} escola{schools.length !== 1 ? "s" : ""} cadastrada
                {schools.length !== 1 ? "s" : ""}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar escola..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 w-52"
                />
              </div>
              <Button variant="outline" size="icon" onClick={() => refetch()}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {schoolsLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              Carregando escolas...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              Nenhuma escola encontrada
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Escola</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead className="text-center">Alunos</TableHead>
                  <TableHead className="text-center">Cursos</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Criada em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((school) => (
                  <TableRow key={school.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {school.logo_icon_url || school.logo_url ? (
                          <img
                            src={school.logo_icon_url || school.logo_url}
                            alt={school.name}
                            className="w-8 h-8 rounded-md object-contain border"
                          />
                        ) : (
                          <div
                            className="w-8 h-8 rounded-md flex items-center justify-center text-white text-xs font-bold"
                            style={{
                              backgroundColor: school.primary_color || "#6366F1",
                            }}
                          >
                            {school.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="font-medium">{school.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {school.slug}
                      </code>
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {school.stats.students.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell className="text-center font-medium">
                      {school.stats.courses.toLocaleString("pt-BR")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={school.is_active ? "default" : "secondary"}
                        className={
                          school.is_active
                            ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300"
                            : ""
                        }
                      >
                        {school.is_active ? "Ativa" : "Inativa"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDistanceToNow(new Date(school.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => switchMutation.mutate(school.id)}
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Acessar escola
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              toggleActiveMutation.mutate({
                                id: school.id,
                                is_active: !school.is_active,
                              })
                            }
                            className={
                              school.is_active
                                ? "text-destructive focus:text-destructive"
                                : ""
                            }
                          >
                            {school.is_active ? (
                              <>
                                <PowerOff className="w-4 h-4 mr-2" />
                                Desativar escola
                              </>
                            ) : (
                              <>
                                <Power className="w-4 h-4 mr-2" />
                                Ativar escola
                              </>
                            )}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
