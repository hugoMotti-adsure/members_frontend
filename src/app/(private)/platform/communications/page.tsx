"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Mail, Settings2, Pencil, Eye, ChevronRight } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────

interface Variable {
  key: string;
  label: string;
}

interface EmailTemplate {
  id: string;
  key: string;
  name: string;
  description: string;
  subject: string;
  body: string;
  variables: Variable[];
  is_active: boolean;
  updated_at: string;
}

interface DispatchSetting {
  id: string;
  trigger_key: string;
  name: string;
  description: string;
  template_key: string;
  is_enabled: boolean;
}

// ─── Page ─────────────────────────────────────────────────────

export default function CommunicationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [editingTemplate, setEditingTemplate] = useState<EmailTemplate | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);
  const [editForm, setEditForm] = useState({ subject: "", body: "" });

  // ─── Queries ────────────────────────────────────────────────

  const { data: templates = [], isLoading: loadingTemplates } = useQuery<EmailTemplate[]>({
    queryKey: ["email-templates"],
    queryFn: () => api.get("/platform/communications/templates").then((r) => r.data),
  });

  const { data: settings = [], isLoading: loadingSettings } = useQuery<DispatchSetting[]>({
    queryKey: ["dispatch-settings"],
    queryFn: () => api.get("/platform/communications/settings").then((r) => r.data),
  });

  // ─── Mutations ──────────────────────────────────────────────

  const updateTemplateMutation = useMutation({
    mutationFn: ({ key, data }: { key: string; data: { subject: string; body: string } }) =>
      api.put(`/platform/communications/templates/${key}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["email-templates"] });
      toast({ title: "Template salvo com sucesso!" });
      setEditingTemplate(null);
    },
    onError: () => toast({ title: "Erro ao salvar template", variant: "destructive" }),
  });

  const toggleDispatchMutation = useMutation({
    mutationFn: ({ triggerKey, is_enabled }: { triggerKey: string; is_enabled: boolean }) =>
      api.put(`/platform/communications/settings/${triggerKey}`, { is_enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dispatch-settings"] });
    },
    onError: () => toast({ title: "Erro ao atualizar configuração", variant: "destructive" }),
  });

  // ─── Handlers ───────────────────────────────────────────────

  const openEditor = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setEditForm({ subject: template.subject, body: template.body });
  };

  const insertVariable = (varKey: string) => {
    setEditForm((f) => ({ ...f, body: f.body + varKey }));
  };

  const getTemplateNameForKey = (key: string) =>
    templates.find((t) => t.key === key)?.name || key;

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Comunicações</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Configure os templates e os disparos automáticos de e-mail da plataforma
        </p>
      </div>

      <Tabs defaultValue="templates">
        <TabsList>
          <TabsTrigger value="templates" className="gap-2">
            <Mail className="w-4 h-4" />
            Templates de E-mail
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings2 className="w-4 h-4" />
            Configurações de Disparo
          </TabsTrigger>
        </TabsList>

        {/* ── ABA: TEMPLATES ── */}
        <TabsContent value="templates" className="mt-6 space-y-4">
          {loadingTemplates ? (
            <p className="text-muted-foreground text-sm">Carregando templates...</p>
          ) : (
            templates.map((template) => (
              <Card key={template.key}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base">{template.name}</CardTitle>
                        <Badge variant={template.is_active ? "default" : "secondary"}>
                          {template.is_active ? "Ativo" : "Inativo"}
                        </Badge>
                      </div>
                      <CardDescription className="mt-1">{template.description}</CardDescription>
                      <p className="text-sm text-muted-foreground mt-2">
                        <span className="font-medium">Assunto atual:</span>{" "}
                        <span className="italic">{template.subject}</span>
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPreviewTemplate(template)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Prévia
                      </Button>
                      <Button size="sm" onClick={() => openEditor(template)}>
                        <Pencil className="w-4 h-4 mr-1" />
                        Editar
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="flex flex-wrap gap-2">
                    <span className="text-xs text-muted-foreground">Variáveis disponíveis:</span>
                    {template.variables.map((v) => (
                      <code
                        key={v.key}
                        className="text-xs bg-muted px-2 py-0.5 rounded border"
                        title={v.label}
                      >
                        {v.key}
                      </code>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* ── ABA: CONFIGURAÇÕES DE DISPARO ── */}
        <TabsContent value="settings" className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Controle quais situações disparam o envio automático de e-mail.
          </p>
          {loadingSettings ? (
            <p className="text-muted-foreground text-sm">Carregando configurações...</p>
          ) : (
            settings.map((setting) => (
              <Card key={setting.trigger_key}>
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{setting.name}</p>
                      <p className="text-muted-foreground text-sm mt-0.5">
                        {setting.description}
                      </p>
                      <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        <span>Template:</span>
                        <span className="font-medium text-foreground">
                          {getTemplateNameForKey(setting.template_key)}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm text-muted-foreground">
                        {setting.is_enabled ? "Ativo" : "Inativo"}
                      </span>
                      <Switch
                        checked={setting.is_enabled}
                        onCheckedChange={(checked) =>
                          toggleDispatchMutation.mutate({
                            triggerKey: setting.trigger_key,
                            is_enabled: checked,
                          })
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* ── MODAL: EDITOR DE TEMPLATE ── */}
      <Dialog open={!!editingTemplate} onOpenChange={(open) => !open && setEditingTemplate(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar template: {editingTemplate?.name}</DialogTitle>
            <DialogDescription>{editingTemplate?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Assunto */}
            <div className="space-y-2">
              <Label htmlFor="subject">
                Assunto do e-mail
              </Label>
              <Input
                id="subject"
                value={editForm.subject}
                onChange={(e) => setEditForm((f) => ({ ...f, subject: e.target.value }))}
                placeholder="Assunto do e-mail..."
              />
              <p className="text-xs text-muted-foreground">
                Você pode usar variáveis no assunto. Ex:{" "}
                <code className="bg-muted px-1 rounded">
                  {editingTemplate?.variables?.[0]?.key}
                </code>
              </p>
            </div>

            {/* Variáveis disponíveis */}
            {editingTemplate && editingTemplate.variables.length > 0 && (
              <div className="space-y-2">
                <Label>Variáveis disponíveis — clique para inserir no corpo</Label>
                <div className="flex flex-wrap gap-2">
                  {editingTemplate.variables.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => insertVariable(v.key)}
                      className="flex items-center gap-1 text-xs bg-muted hover:bg-primary/10 hover:text-primary border rounded px-2 py-1 transition-colors"
                      title={`Inserir ${v.key}`}
                    >
                      <ChevronRight className="w-3 h-3" />
                      <code>{v.key}</code>
                      <span className="text-muted-foreground">— {v.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Corpo do e-mail */}
            <div className="space-y-2">
              <Label htmlFor="body">Corpo do e-mail (HTML)</Label>
              <textarea
                id="body"
                value={editForm.body}
                onChange={(e) => setEditForm((f) => ({ ...f, body: e.target.value }))}
                rows={18}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="HTML do corpo do e-mail..."
                spellCheck={false}
              />
              <p className="text-xs text-muted-foreground">
                O corpo aceita HTML completo. Use as variáveis acima para personalizar o conteúdo automaticamente.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTemplate(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() =>
                updateTemplateMutation.mutate({
                  key: editingTemplate!.key,
                  data: editForm,
                })
              }
              disabled={updateTemplateMutation.isPending}
            >
              {updateTemplateMutation.isPending ? "Salvando..." : "Salvar template"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── MODAL: PRÉVIA DO TEMPLATE ── */}
      <Dialog open={!!previewTemplate} onOpenChange={(open) => !open && setPreviewTemplate(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Prévia: {previewTemplate?.name}</DialogTitle>
            <DialogDescription>
              Visualização com variáveis de exemplo substituídas
            </DialogDescription>
          </DialogHeader>

          {previewTemplate && (
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2 text-sm border-b">
                <span className="text-muted-foreground">Assunto: </span>
                <span className="font-medium">
                  {previewTemplate.subject
                    .replace(/{{nome_da_escola}}/g, "Escola Exemplo")
                    .replace(/{{nome_do_aluno}}/g, "João Silva")
                    .replace(/{{nome_do_usuario}}/g, "João Silva")
                    .replace(/{{nome_do_curso}}/g, "Marketing Digital")
                    .replace(/{{nome_do_owner}}/g, "João Silva")}
                </span>
              </div>
              <iframe
                srcDoc={previewTemplate.body
                  .replace(/{{nome_da_escola}}/g, "Escola Exemplo")
                  .replace(/{{nome_do_aluno}}/g, "João Silva")
                  .replace(/{{nome_do_usuario}}/g, "João Silva")
                  .replace(/{{email_do_aluno}}/g, "joao@exemplo.com")
                  .replace(/{{email_do_owner}}/g, "joao@exemplo.com")
                  .replace(/{{senha_do_aluno}}/g, "Senha@123")
                  .replace(/{{senha_do_owner}}/g, "Senha@123")
                  .replace(/{{nome_do_curso}}/g, "Marketing Digital")
                  .replace(/{{link_de_acesso}}/g, "#")
                  .replace(/{{link_de_reset}}/g, "#")
                  .replace(/{{validade_do_link}}/g, "2 horas")
                  .replace(/{{codigo_de_confirmacao}}/g, "847291")
                  .replace(/{{nome_do_owner}}/g, "João Silva")}
                className="w-full h-[500px] border-0"
                title="Prévia do e-mail"
              />
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewTemplate(null)}>
              Fechar
            </Button>
            <Button
              onClick={() => {
                setPreviewTemplate(null);
                openEditor(previewTemplate!);
              }}
            >
              <Pencil className="w-4 h-4 mr-2" />
              Editar este template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
