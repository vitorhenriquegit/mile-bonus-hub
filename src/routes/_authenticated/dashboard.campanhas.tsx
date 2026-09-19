import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Megaphone,
  Plus,
  Send,
  Calendar,
  Fuel,
  Sparkles,
  MessageSquare,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  Pause,
  Play,
  Trash2,
  Pencil,
  Search,
  Filter,
  DollarSign,
  Users,
  Layers,
  ArrowRight,
  HelpCircle,
  Check,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import {
  getCampaigns,
  saveCampaign,
  toggleCampaignStatus,
  deleteCampaign,
  sendCampaignDispatch,
} from "@/lib/loyalty.functions";
import { formatBRL, type Campaign } from "@/lib/loyalty";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/dashboard/campanhas")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Campanhas Promocionais — FuelRewards" },
      {
        name: "description",
        content: "Crie campanhas sazonais inteligentes, descontos por dia da semana e valor abastecido, e envie mensagens via Push, WhatsApp e SMS.",
      },
    ],
  }),
  component: CampaignsDashboard,
});

const DAYS_OF_WEEK = [
  { id: 0, label: "Dom", full: "Domingo" },
  { id: 1, label: "Seg", full: "Segunda-feira" },
  { id: 2, label: "Ter", full: "Terça-feira" },
  { id: 3, label: "Qua", full: "Quarta-feira" },
  { id: 4, label: "Qui", full: "Quinta-feira" },
  { id: 5, label: "Sex", full: "Sexta-feira" },
  { id: 6, label: "Sáb", full: "Sábado" },
];

const FUEL_TYPES_MAP: Record<string, string> = {
  gasolina_comum: "Gasolina Comum",
  gasolina_aditivada: "Gasolina Aditivada",
  etanol: "Etanol Hidratado",
  diesel_s10: "Diesel S10",
};

export default function CampaignsDashboard() {
  const queryClient = useQueryClient();
  const campaignsFn = useServerFn(getCampaigns);
  const saveFn = useServerFn(saveCampaign);
  const toggleFn = useServerFn(toggleCampaignStatus);
  const deleteFn = useServerFn(deleteCampaign);
  const dispatchFn = useServerFn(sendCampaignDispatch);

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ["campaigns"],
    queryFn: () => campaignsFn({}) as Promise<Campaign[]>,
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "scheduled" | "paused">("all");

  // Modal de Criação / Edição
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Partial<Campaign> | null>(null);

  // Modal de Disparo de Mensagem
  const [isDispatchOpen, setIsDispatchOpen] = useState(false);
  const [dispatchTarget, setDispatchTarget] = useState<Campaign | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [dispatchResult, setDispatchResult] = useState<any | null>(null);

  // Mutations
  const saveMutation = useMutation({
    mutationFn: (data: Partial<Campaign> & { title: string }) => saveFn({ data }),
    onSuccess: () => {
      toast.success(editingCampaign?.id ? "Campanha atualizada com sucesso!" : "Nova campanha criada com sucesso!");
      setIsFormOpen(false);
      setEditingCampaign(null);
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: (err: any) => {
      toast.error(err.message || "Erro ao salvar campanha.");
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Status da campanha atualizado!");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: () => toast.error("Não foi possível alterar o status da campanha."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("Campanha excluída!");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    },
    onError: () => toast.error("Não foi possível excluir a campanha."),
  });

  // Estatísticas calculadas
  const activeCount = campaigns.filter((c) => c.status === "active").length;
  const totalMessagesSent = campaigns.reduce((acc, c) => acc + (c.metrics?.messagesSent || 0), 0);
  const totalFuelings = campaigns.reduce((acc, c) => acc + (c.metrics?.fuelingsCount || 0), 0);
  const totalSavings = campaigns.reduce((acc, c) => acc + (c.metrics?.totalDiscountBrl || 0), 0);

  // Filtragem
  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const openNewCampaign = () => {
    setEditingCampaign({
      title: "",
      description: "",
      status: "active",
      discountType: "per_liter",
      discountValue: 0.2,
      minFuelAmount: 100,
      fuelTypes: ["gasolina_comum", "gasolina_aditivada", "etanol"],
      daysOfWeek: [3], // Quarta como padrão de dia promocional
      startDate: new Date().toISOString().slice(0, 10),
      endDate: new Date(Date.now() + 60 * 86400000).toISOString().slice(0, 10),
      channels: { push: true, whatsapp: true, sms: false },
      messageTitle: "⚡ Promoção Exclusiva no Posto!",
      messageBody:
        "Olá, {cliente}! Abasteça acima de R$ {minimo} e garanta {desconto} de desconto imediato no seu abastecimento. Apresente seu app!",
      targetAudience: "all",
    });
    setIsFormOpen(true);
  };

  const openEditCampaign = (camp: Campaign) => {
    setEditingCampaign({ ...camp });
    setIsFormOpen(true);
  };

  const openDispatch = (camp: Campaign) => {
    setDispatchTarget(camp);
    setDispatchResult(null);
    setIsDispatchOpen(true);
  };

  const handleSendDispatch = async () => {
    if (!dispatchTarget) return;
    setIsSending(true);
    try {
      const res = await dispatchFn({
        data: {
          campaignId: dispatchTarget.id,
          channels: dispatchTarget.channels,
        },
      });
      setDispatchResult(res);
      toast.success("Mensagens disparadas com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
    } catch (err: any) {
      toast.error(err.message || "Erro ao realizar disparo.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Campanhas Promocionais</h1>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-xs font-semibold">
              Sazonalidade & CRM
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Crie incentivos por valor abastecido, dias da semana e sazonalidade, e notifique seus clientes via Push, WhatsApp e SMS.
          </p>
        </div>

        <Button onClick={openNewCampaign} className="gap-2 shadow-sm font-semibold">
          <Plus className="h-4 w-4" />
          Nova Campanha
        </Button>
      </div>

      {/* KPIs Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Campanhas Ativas</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <Sparkles className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">{activeCount}</span>
            <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Em vigor
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Regras sazonais ativas na pista</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Mensagens Enviadas</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400">
              <Send className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">{totalMessagesSent.toLocaleString("pt-BR")}</span>
            <span className="text-xs text-muted-foreground">Push / Zap / SMS</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Impacto direto no bolso do cliente</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Abastecimentos Promo</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Fuel className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight">{totalFuelings.toLocaleString("pt-BR")}</span>
            <span className="text-xs text-emerald-600 font-medium">+18% conversão</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Abastecidos dentro das condições</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5 shadow-card transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Descontos Concedidos</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-foreground">{formatBRL(totalSavings)}</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Economia repassada aos fidelizados</p>
        </div>
      </div>

      {/* Controles de Busca e Filtro */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome ou descrição..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-card"
          />
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-muted/60 rounded-xl border border-border self-start sm:self-auto">
          {(["all", "active", "scheduled", "paused"] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                statusFilter === st
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {st === "all" && "Todas"}
              {st === "active" && "Ativas"}
              {st === "scheduled" && "Agendadas"}
              {st === "paused" && "Pausadas"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de Campanhas */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          Carregando campanhas...
        </div>
      ) : filteredCampaigns.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
          <Megaphone className="mx-auto h-12 w-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">Nenhuma campanha encontrada</h3>
          <p className="mt-1 text-sm text-muted-foreground max-w-md mx-auto">
            Crie sua primeira campanha para atrair clientes em dias específicos com descontos maiores e disparos por WhatsApp, Push e SMS.
          </p>
          <Button onClick={openNewCampaign} className="mt-5 gap-2">
            <Plus className="h-4 w-4" />
            Criar Campanha Agora
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
          {filteredCampaigns.map((camp) => {
            const isDiscountPerLiter = camp.discountType === "per_liter";
            const discountLabel = isDiscountPerLiter
              ? `+${formatBRL(camp.discountValue)}/L`
              : `${camp.discountValue}% OFF`;

            return (
              <div
                key={camp.id}
                className="group relative flex flex-col justify-between rounded-2xl border border-border bg-card p-5 shadow-card transition hover:border-primary/40 hover:shadow-lg"
              >
                <div>
                  {/* Status & Período */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge
                      variant="secondary"
                      className={`font-semibold text-xs capitalize ${
                        camp.status === "active"
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
                          : camp.status === "paused"
                          ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30"
                          : "bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30"
                      }`}
                    >
                      {camp.status === "active" ? "● Ativa" : camp.status === "paused" ? "⏸ Pausada" : "🗓 Agendada"}
                    </Badge>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>
                        {new Date(camp.startDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                        {" até "}
                        {new Date(camp.endDate).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                      </span>
                    </div>
                  </div>

                  {/* Título & Descrição */}
                  <div className="mt-3">
                    <h3 className="text-base font-bold text-foreground leading-snug group-hover:text-primary transition-colors">
                      {camp.title}
                    </h3>
                    <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                      {camp.description || "Sem descrição informada."}
                    </p>
                  </div>

                  {/* Regras e Condições Visuais */}
                  <div className="mt-4 space-y-2.5 rounded-xl bg-muted/40 p-3 border border-border/50">
                    {/* Dias da semana em destaque */}
                    <div>
                      <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                        Dias com Desconto Maior:
                      </span>
                      <div className="mt-1.5 flex gap-1 flex-wrap">
                        {DAYS_OF_WEEK.map((d) => {
                          const isActive = camp.daysOfWeek.includes(d.id);
                          return (
                            <span
                              key={d.id}
                              title={d.full}
                              className={`inline-flex items-center justify-center rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
                                isActive
                                  ? "bg-primary text-primary-foreground shadow-xs"
                                  : "bg-muted text-muted-foreground/40"
                              }`}
                            >
                              {d.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* Valor e Benefício */}
                    <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
                      <div>
                        <span className="text-muted-foreground">Mínimo: </span>
                        <strong className="text-foreground">
                          {camp.minFuelAmount > 0 ? formatBRL(camp.minFuelAmount) : "Qualquer valor"}
                        </strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-muted-foreground">Desconto:</span>
                        <span className="rounded-md bg-emerald-500/20 px-2 py-0.5 text-xs font-extrabold text-emerald-600 dark:text-emerald-400">
                          {discountLabel}
                        </span>
                      </div>
                    </div>

                    {/* Combustíveis elegíveis */}
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                      <Fuel className="h-3 w-3 text-primary shrink-0" />
                      <span className="truncate">
                        {camp.fuelTypes.map((f) => FUEL_TYPES_MAP[f] || f).join(", ")}
                      </span>
                    </div>
                  </div>

                  {/* Canais de Mensagem */}
                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground font-medium">Canais de Envio:</span>
                    <div className="flex items-center gap-1.5">
                      <span
                        title="Push Notification"
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          camp.channels?.push
                            ? "bg-blue-500/15 text-blue-600 dark:text-blue-400"
                            : "bg-muted text-muted-foreground/40 line-through"
                        }`}
                      >
                        <Smartphone className="h-3 w-3" />
                        Push
                      </span>
                      <span
                        title="WhatsApp"
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          camp.channels?.whatsapp
                            ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                            : "bg-muted text-muted-foreground/40 line-through"
                        }`}
                      >
                        <MessageSquare className="h-3 w-3" />
                        Whats
                      </span>
                      <span
                        title="SMS"
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                          camp.channels?.sms
                            ? "bg-purple-500/15 text-purple-600 dark:text-purple-400"
                            : "bg-muted text-muted-foreground/40 line-through"
                        }`}
                      >
                        SMS
                      </span>
                    </div>
                  </div>

                  {/* Métricas Rápidas */}
                  <div className="mt-3 grid grid-cols-2 gap-2 border-t border-border/50 pt-3 text-xs">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase">Mensagens</span>
                      <p className="font-bold text-foreground">
                        {(camp.metrics?.messagesSent || 0).toLocaleString("pt-BR")}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase">Abastecimentos</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400">
                        {(camp.metrics?.fuelingsCount || 0).toLocaleString("pt-BR")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ações do Card */}
                <div className="mt-5 flex items-center justify-between gap-2 border-t border-border pt-4">
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => openDispatch(camp)}
                    className="flex-1 gap-1.5 text-xs font-semibold bg-primary text-primary-foreground shadow-xs hover:bg-primary/90"
                  >
                    <Send className="h-3.5 w-3.5" />
                    Disparar Comunicado
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title={camp.status === "active" ? "Pausar Campanha" : "Ativar Campanha"}
                      onClick={() => toggleMutation.mutate(camp.id)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      {camp.status === "active" ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 text-emerald-500" />}
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar Campanha"
                      onClick={() => openEditCampaign(camp)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="ghost"
                      size="icon"
                      title="Excluir Campanha"
                      onClick={() => {
                        if (confirm(`Deseja realmente remover a campanha "${camp.title}"?`)) {
                          deleteMutation.mutate(camp.id);
                        }
                      }}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE CRIAÇÃO / EDIÇÃO DE CAMPANHA */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingCampaign?.id ? "Editar Campanha Promocional" : "Nova Campanha Promocional Sazonal"}
            </DialogTitle>
            <DialogDescription>
              Configure regras de sazonalidade, dias da semana, valores abastecidos e as mensagens para seus clientes.
            </DialogDescription>
          </DialogHeader>

          {editingCampaign && (
            <Tabs defaultValue="regras" className="mt-2">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="geral">1. Geral</TabsTrigger>
                <TabsTrigger value="regras">2. Regras & Sazonalidade</TabsTrigger>
                <TabsTrigger value="mensagens">3. Push, Whats & SMS</TabsTrigger>
              </TabsList>

              {/* ABA 1: GERAL */}
              <TabsContent value="geral" className="space-y-4 pt-3">
                <div>
                  <Label htmlFor="title" className="text-xs font-semibold">
                    Título da Campanha *
                  </Label>
                  <Input
                    id="title"
                    value={editingCampaign.title || ""}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, title: e.target.value })}
                    placeholder="Ex: Super Quarta da Gasolina Aditivada"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="description" className="text-xs font-semibold">
                    Descrição Detalhada
                  </Label>
                  <Textarea
                    id="description"
                    value={editingCampaign.description || ""}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, description: e.target.value })}
                    placeholder="Descreva o objetivo da campanha, regulamento ou instruções adicionais..."
                    className="mt-1"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="startDate" className="text-xs font-semibold">
                      Data Início
                    </Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={editingCampaign.startDate || ""}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, startDate: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate" className="text-xs font-semibold">
                      Data Fim (Validade)
                    </Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={editingCampaign.endDate || ""}
                      onChange={(e) => setEditingCampaign({ ...editingCampaign, endDate: e.target.value })}
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Combustíveis Elegíveis</Label>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {Object.entries(FUEL_TYPES_MAP).map(([key, label]) => {
                      const isSelected = editingCampaign.fuelTypes?.includes(key);
                      return (
                        <button
                          type="button"
                          key={key}
                          onClick={() => {
                            const current = editingCampaign.fuelTypes || [];
                            const updated = isSelected
                              ? current.filter((k) => k !== key)
                              : [...current, key];
                            setEditingCampaign({ ...editingCampaign, fuelTypes: updated });
                          }}
                          className={`flex items-center justify-between rounded-xl border p-2.5 text-xs font-medium transition ${
                            isSelected
                              ? "border-primary bg-primary/10 text-primary font-semibold"
                              : "border-border text-muted-foreground hover:bg-muted/40"
                          }`}
                        >
                          <span>{label}</span>
                          {isSelected && <Check className="h-4 w-4 text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </TabsContent>

              {/* ABA 2: REGRAS E SAZONALIDADE */}
              <TabsContent value="regras" className="space-y-4 pt-3">
                {/* DIAS DA SEMANA */}
                <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-bold text-foreground">
                      Dias da Semana com Desconto Maior
                    </Label>
                    <span className="text-[11px] text-muted-foreground">Clique para marcar/desmarcar</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    A campanha concederá o benefício ampliado exclusivamente nos dias selecionados abaixo:
                  </p>
                  <div className="flex gap-1.5 flex-wrap pt-1">
                    {DAYS_OF_WEEK.map((d) => {
                      const isSelected = editingCampaign.daysOfWeek?.includes(d.id);
                      return (
                        <button
                          type="button"
                          key={d.id}
                          onClick={() => {
                            const current = editingCampaign.daysOfWeek || [];
                            const updated = isSelected
                              ? current.filter((id) => id !== d.id)
                              : [...current, d.id];
                            setEditingCampaign({ ...editingCampaign, daysOfWeek: updated });
                          }}
                          className={`flex h-10 w-12 flex-col items-center justify-center rounded-xl border text-xs font-bold transition ${
                            isSelected
                              ? "border-primary bg-primary text-primary-foreground shadow-sm"
                              : "border-border bg-muted/30 text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          <span>{d.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* VALOR MÍNIMO ABASTECIDO */}
                <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
                  <Label htmlFor="minFuelAmount" className="text-xs font-bold text-foreground">
                    Condição: Valor Mínimo Abastecido (R$)
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    O desconto sazonal só será liberado na bomba se o abastecimento atingir ou ultrapassar este valor:
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">
                        R$
                      </span>
                      <Input
                        id="minFuelAmount"
                        type="number"
                        step="5"
                        min="0"
                        value={editingCampaign.minFuelAmount ?? 0}
                        onChange={(e) =>
                          setEditingCampaign({ ...editingCampaign, minFuelAmount: Number(e.target.value) })
                        }
                        className="pl-9 font-bold"
                        placeholder="100.00"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      (0 = Sem valor mínimo)
                    </span>
                  </div>
                  {/* Atalhos rápidos */}
                  <div className="flex gap-2">
                    {[50, 80, 100, 120, 150, 200].map((val) => (
                      <button
                        type="button"
                        key={val}
                        onClick={() => setEditingCampaign({ ...editingCampaign, minFuelAmount: val })}
                        className={`rounded-lg border px-2 py-1 text-[11px] font-semibold transition ${
                          editingCampaign.minFuelAmount === val
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        R$ {val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* BENEFÍCIO OFERECIDO */}
                <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
                  <Label className="text-xs font-bold text-foreground">Benefício do Desconto Maior</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="discountType" className="text-[11px] text-muted-foreground">
                        Formato do Desconto
                      </Label>
                      <select
                        id="discountType"
                        value={editingCampaign.discountType || "per_liter"}
                        onChange={(e) =>
                          setEditingCampaign({
                            ...editingCampaign,
                            discountType: e.target.value as "per_liter" | "percentage",
                          })
                        }
                        className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      >
                        <option value="per_liter">Desconto por Litro (R$/L)</option>
                        <option value="percentage">Porcentagem OFF (%)</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="discountValue" className="text-[11px] text-muted-foreground">
                        {editingCampaign.discountType === "per_liter" ? "Valor (R$/L extra)" : "Porcentagem (% extra)"}
                      </Label>
                      <Input
                        id="discountValue"
                        type="number"
                        step={editingCampaign.discountType === "per_liter" ? "0.05" : "1"}
                        min="0"
                        value={editingCampaign.discountValue ?? 0.2}
                        onChange={(e) =>
                          setEditingCampaign({ ...editingCampaign, discountValue: Number(e.target.value) })
                        }
                        className="mt-1 font-bold"
                        placeholder="0.25"
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* ABA 3: MENSAGENS E CANAIS (PUSH, WHATSAPP, SMS) */}
              <TabsContent value="mensagens" className="space-y-4 pt-3">
                {/* SELEÇÃO DE CANAIS */}
                <div className="rounded-xl border border-border bg-card p-3.5 space-y-3">
                  <Label className="text-xs font-bold text-foreground">Canais de Envio Ativos</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {/* PUSH */}
                    <div className="flex items-center justify-between rounded-xl border border-border p-3">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-blue-500" />
                        <span className="text-xs font-semibold">Push App</span>
                      </div>
                      <Switch
                        checked={editingCampaign.channels?.push ?? true}
                        onCheckedChange={(val) =>
                          setEditingCampaign({
                            ...editingCampaign,
                            channels: { ...editingCampaign.channels!, push: val },
                          })
                        }
                      />
                    </div>

                    {/* WHATSAPP */}
                    <div className="flex items-center justify-between rounded-xl border border-border p-3">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="h-4 w-4 text-emerald-500" />
                        <span className="text-xs font-semibold">WhatsApp</span>
                      </div>
                      <Switch
                        checked={editingCampaign.channels?.whatsapp ?? true}
                        onCheckedChange={(val) =>
                          setEditingCampaign({
                            ...editingCampaign,
                            channels: { ...editingCampaign.channels!, whatsapp: val },
                          })
                        }
                      />
                    </div>

                    {/* SMS */}
                    <div className="flex items-center justify-between rounded-xl border border-border p-3">
                      <div className="flex items-center gap-2">
                        <Send className="h-4 w-4 text-purple-500" />
                        <span className="text-xs font-semibold">SMS</span>
                      </div>
                      <Switch
                        checked={editingCampaign.channels?.sms ?? false}
                        onCheckedChange={(val) =>
                          setEditingCampaign({
                            ...editingCampaign,
                            channels: { ...editingCampaign.channels!, sms: val },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* SEGMENTAÇÃO */}
                <div>
                  <Label htmlFor="targetAudience" className="text-xs font-semibold">
                    Público-Alvo
                  </Label>
                  <select
                    id="targetAudience"
                    value={editingCampaign.targetAudience || "all"}
                    onChange={(e) =>
                      setEditingCampaign({
                        ...editingCampaign,
                        targetAudience: e.target.value as any,
                      })
                    }
                    className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option value="all">Todos os clientes cadastrados (~450 clientes)</option>
                    <option value="frequent">Clientes Frequentes (abastecem toda semana - ~280 clientes)</option>
                    <option value="inactive">Clientes Inativos (+15 dias sem abastecer - ~175 clientes)</option>
                    <option value="gold_diamond">Clientes VIP (Nível Ouro e Diamante - ~95 clientes)</option>
                  </select>
                </div>

                {/* CONTEÚDO DA MENSAGEM */}
                <div>
                  <Label htmlFor="messageTitle" className="text-xs font-semibold">
                    Título do Comunicado (Push / Assunto)
                  </Label>
                  <Input
                    id="messageTitle"
                    value={editingCampaign.messageTitle || ""}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, messageTitle: e.target.value })}
                    placeholder="Ex: ⚡ Super Quarta: Desconto Especial Hoje!"
                    className="mt-1"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="messageBody" className="text-xs font-semibold">
                      Texto da Mensagem (WhatsApp / Push / SMS)
                    </Label>
                    <span className="text-[10px] text-muted-foreground">
                      Tags: {"{cliente}"}, {"{desconto}"}, {"{minimo}"}
                    </span>
                  </div>
                  <Textarea
                    id="messageBody"
                    value={editingCampaign.messageBody || ""}
                    onChange={(e) => setEditingCampaign({ ...editingCampaign, messageBody: e.target.value })}
                    rows={3}
                    className="mt-1"
                    placeholder="Olá {cliente}! Hoje é dia de abastecer com desconto..."
                  />
                </div>

                {/* PREVIEW DINÂMICO DA MENSAGEM */}
                <div className="rounded-xl border border-border/80 bg-muted/40 p-3 space-y-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                    <Smartphone className="h-3.5 w-3.5 text-primary" />
                    Pré-visualização da Mensagem:
                  </span>

                  {/* Simulação Push */}
                  <div className="rounded-lg bg-card border border-border p-3 shadow-xs">
                    <div className="flex items-center gap-1.5 text-[10px] text-primary font-bold uppercase tracking-wider">
                      <Fuel className="h-3 w-3" />
                      FuelRewards • Agora
                    </div>
                    <p className="mt-1 text-xs font-bold text-foreground">
                      {editingCampaign.messageTitle || "Notificação de Promoção"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {(editingCampaign.messageBody || "")
                        .replace(/{cliente}/g, "Carlos Silva")
                        .replace(
                          /{desconto}/g,
                          editingCampaign.discountType === "per_liter"
                            ? formatBRL(editingCampaign.discountValue || 0.25)
                            : `${editingCampaign.discountValue}%`
                        )
                        .replace(/{minimo}/g, formatBRL(editingCampaign.minFuelAmount || 100))}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter className="mt-4 gap-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!editingCampaign?.title) {
                  toast.error("Informe o título da campanha.");
                  return;
                }
                saveMutation.mutate(editingCampaign as any);
              }}
              disabled={saveMutation.isPending}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Salvar Campanha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE DISPARO DE MENSAGENS MULTICANAL */}
      <Dialog open={isDispatchOpen} onOpenChange={setIsDispatchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Send className="h-5 w-5 text-primary" />
              Disparar Comunicado aos Clientes
            </DialogTitle>
            <DialogDescription>
              Envie comunicados automáticos via Push Notification, WhatsApp e SMS para engajar os motoristas.
            </DialogDescription>
          </DialogHeader>

          {dispatchTarget && (
            <div className="space-y-4 pt-2">
              <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Campanha Selecionada:</span>
                <p className="text-sm font-bold text-foreground">{dispatchTarget.title}</p>
                <p className="text-xs text-muted-foreground">{dispatchTarget.description}</p>
              </div>

              {/* Canais ativados para o disparo */}
              <div>
                <Label className="text-xs font-semibold text-muted-foreground uppercase">Canais que receberão:</Label>
                <div className="mt-1.5 flex gap-2">
                  {dispatchTarget.channels?.push && (
                    <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30 gap-1.5 py-1">
                      <Smartphone className="h-3.5 w-3.5" />
                      Push (~450 clientes)
                    </Badge>
                  )}
                  {dispatchTarget.channels?.whatsapp && (
                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 gap-1.5 py-1">
                      <MessageSquare className="h-3.5 w-3.5" />
                      WhatsApp (~380 clientes)
                    </Badge>
                  )}
                  {dispatchTarget.channels?.sms && (
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30 gap-1.5 py-1">
                      <Send className="h-3.5 w-3.5" />
                      SMS (~270 clientes)
                    </Badge>
                  )}
                </div>
              </div>

              {/* Mensagem que será enviada */}
              <div className="rounded-xl bg-muted/40 p-3 border border-border text-xs">
                <span className="font-semibold text-foreground">Mensagem:</span>
                <p className="mt-1 text-muted-foreground italic">
                  "{dispatchTarget.messageBody.replace(/{cliente}/g, "Nome do Cliente")}"
                </p>
              </div>

              {/* Resultado do Disparo (quando concluído) */}
              {dispatchResult && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold">
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Disparo concluído com sucesso!</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-1 text-foreground font-semibold">
                    <div>Push: {dispatchResult.delivered?.push}</div>
                    <div>WhatsApp: {dispatchResult.delivered?.whatsapp}</div>
                    <div>SMS: {dispatchResult.delivered?.sms}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="mt-3 gap-2">
            <Button variant="outline" onClick={() => setIsDispatchOpen(false)}>
              Fechar
            </Button>
            <Button
              onClick={handleSendDispatch}
              disabled={isSending}
              className="gap-2 bg-primary text-primary-foreground font-semibold shadow-sm"
            >
              {isSending ? (
                <>Enviando mensagens...</>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Confirmar e Disparar Agora
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
