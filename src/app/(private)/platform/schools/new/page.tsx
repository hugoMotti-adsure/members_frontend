"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Building2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface CreateSchoolDto {
  name: string;
  slug: string;
  owner_email: string;
  owner_name: string;
  owner_password: string;
  primary_color?: string;
}

interface CreateSchoolResult {
  tenant: { id: string; name: string; slug: string };
  owner: { id: string; email: string; name: string };
}

function generateSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function NewSchoolPage() {
  const router = useRouter();
  const [created, setCreated] = useState<CreateSchoolResult | null>(null);

  const [form, setForm] = useState<CreateSchoolDto>({
    name: "",
    slug: "",
    owner_email: "",
    owner_name: "",
    owner_password: "",
    primary_color: "#6366F1",
  });

  const [slugEdited, setSlugEdited] = useState(false);

  const handleNameChange = (value: string) => {
    setForm((f) => ({
      ...f,
      name: value,
      slug: slugEdited ? f.slug : generateSlug(value),
    }));
  };

  const createMutation = useMutation({
    mutationFn: (data: CreateSchoolDto) =>
      api.post<CreateSchoolResult>("/platform/schools", data).then((r) => r.data),
    onSuccess: (data) => {
      setCreated(data);
      toast.success("Escola criada com sucesso!");
    },
    onError: (error: any) => {
      const msg =
        error?.response?.data?.message || "Erro ao criar escola";
      toast.error(msg);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.slug || !form.owner_email || !form.owner_name || !form.owner_password) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    createMutation.mutate(form);
  };

  if (created) {
    return (
      <div className="p-6 max-w-lg mx-auto">
        <Card>
          <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Escola criada com sucesso!</h2>
              <p className="text-muted-foreground mt-1">
                A escola <strong>{created.tenant.name}</strong> está pronta para uso.
              </p>
            </div>
            <div className="w-full rounded-lg border bg-muted/50 p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Slug:</span>
                <code className="font-medium">{created.tenant.slug}</code>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Owner:</span>
                <span className="font-medium">{created.owner.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome do owner:</span>
                <span className="font-medium">{created.owner.name}</span>
              </div>
            </div>
            <div className="flex gap-3 mt-2">
              <Button variant="outline" onClick={() => router.push("/platform")}>
                Ver todas as escolas
              </Button>
              <Button
                onClick={() => {
                  setCreated(null);
                  setForm({
                    name: "",
                    slug: "",
                    owner_email: "",
                    owner_name: "",
                    owner_password: "",
                    primary_color: "#6366F1",
                  });
                  setSlugEdited(false);
                }}
              >
                Criar outra escola
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push("/platform")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="w-6 h-6" />
            Nova Escola
          </h1>
          <p className="text-muted-foreground text-sm">
            Crie uma nova escola com seu proprietário
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Dados da escola */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Dados da Escola</CardTitle>
            <CardDescription>
              Informações básicas da nova escola
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Nome da escola <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Ex: Escola de Marketing Digital"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">
                Slug (URL) <span className="text-destructive">*</span>
              </Label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground shrink-0">
                  app.seudominio.com/
                </span>
                <Input
                  id="slug"
                  placeholder="escola-marketing-digital"
                  value={form.slug}
                  onChange={(e) => {
                    setSlugEdited(true);
                    setForm((f) => ({
                      ...f,
                      slug: e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, ""),
                    }));
                  }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Apenas letras minúsculas, números e hífens
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="primary_color">Cor primária</Label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  id="primary_color"
                  value={form.primary_color || "#6366F1"}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, primary_color: e.target.value }))
                  }
                  className="w-10 h-10 rounded-md border cursor-pointer"
                />
                <Input
                  value={form.primary_color || ""}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, primary_color: e.target.value }))
                  }
                  placeholder="#6366F1"
                  className="max-w-[140px]"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados do proprietário */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Proprietário da Escola</CardTitle>
            <CardDescription>
              Dados de acesso do owner desta escola
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="owner_name">
                  Nome completo <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="owner_name"
                  placeholder="João Silva"
                  value={form.owner_name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, owner_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="owner_email">
                  Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="owner_email"
                  type="email"
                  placeholder="dono@escola.com.br"
                  value={form.owner_email}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, owner_email: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="owner_password">
                Senha inicial <span className="text-destructive">*</span>
              </Label>
              <Input
                id="owner_password"
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.owner_password}
                onChange={(e) =>
                  setForm((f) => ({ ...f, owner_password: e.target.value }))
                }
              />
              <p className="text-xs text-muted-foreground">
                O proprietário poderá alterar a senha após o primeiro acesso
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/platform")}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={createMutation.isPending}>
            {createMutation.isPending ? "Criando..." : "Criar escola"}
          </Button>
        </div>
      </form>
    </div>
  );
}
