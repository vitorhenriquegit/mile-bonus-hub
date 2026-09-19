import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Users,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Sliders,
  TrendingDown,
  UserX,
  Clock,
  Fuel,
  Info,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  Zap,
  DollarSign,
  AlertOctagon,
  Lock,
  Unlock,
} from "lucide-react";
import { toast } from "sonner";
import {
  getSecurityOverview,
  updateIncidentStatus,
  updateAttendantStatus,
  updateSecurityRuleSettings,
} from "@/lib/loyalty.functions";
import { formatBRL, maskCpf, type FraudIncident, type AttendantSecurityProfile, type SecurityRuleSetting } from "@/lib/loyalty";
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
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/dashboard/seguranca")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Segurança & Auditoria Antifraude — FuelRewards" },
      {
        name: "description",
        content: "Identificação de comportamentos suspeitos, auditoria de frentistas e prevenção a fraudes no programa de fidelidade.",
      },
    ],
  }),
  component: SecurityDashboard,
});

export default function SecurityDashboard() {
  const queryClient = useQueryClient();
  const overviewFn = useServerFn(getSecurityOverview);
  const updateIncidentFn = useServerFn(updateIncidentStatus);
  const updateAttendantFn = useServerFn(updateAttendantStatus);
  const updateRuleFn = useServerFn(updateSecurityRuleSettings);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["security-overview"],
    queryFn: () => overviewFn({}),
  });

  const [activeTab, setActiveTab] = useState<"incidentes" | "frentistas" | "regras">("incidentes");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("pending");
  const [searchIncident, setSearchIncident] = useState("");

  // Modal de Detalhes da Investigação
  const [inspectIncident, setInspectIncident] = useState<FraudIncident | null>(null);

  // Modal de Calibração de Regra
  const [editingRule, setEditingRule] = useState<SecurityRuleSetting | null>(null);

  // Mutations
  const incidentMutation = useMutation({
    mutationFn: (params: { incidentId: string; status: FraudIncident["status"]; notes?: string }) =>
      updateIncidentFn({ data: params }),
    onSuccess: (_, vars) => {
      if (vars.status === "confirmed_fraud") {
        toast.error("Fraude confirmada! Frentista marcado para investigação e score de risco atualizado.");
      } else if (vars.status === "false_positive") {
        toast.info("Incidente marcado como falso positivo.");
      } else {
        toast.success("Incidente atualizado.");
      }
      setInspectIncident(null);
      queryClient.invalidateQueries({ queryKey: ["security-overview"] });
    },
    onError: () => toast.error("Não foi possível atualizar o status do incidente."),
  });

  const attendantMutation = useMutation({
    mutationFn: (params: { attendantId: string; status: AttendantSecurityProfile["status"] }) =>
      updateAttendantFn({ data: params }),
    onSuccess: () => {
      toast.success("Status do frentista atualizado com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["security-overview"] });
    },
    onError: () => toast.error("Erro ao atualizar frentista."),
  });

  const ruleMutation = useMutation({
    mutationFn: (params: { ruleId: string; enabled: boolean; thresholdValue?: number }) =>
      updateRuleFn({ data: params }),
    onSuccess: () => {
      toast.success("Regra de segurança atualizada!");
      setEditingRule(null);
      queryClient.invalidateQueries({ queryKey: ["security-overview"] });
    },
    onError: () => toast.error("Erro ao atualizar regra de segurança."),
  });

  const kpis = data?.kpis || {
    pendingIncidentsCount: 0,
    criticalIncidentsCount: 0,
    confirmedFraudsCount: 0,
    attendantsUnderReviewCount: 0,
    estimatedProtectedAmount: 0,
    complianceScore: 94.2,
  };

  const incidents = (data?.incidents ?? []) as FraudIncident[];
  const attendants = (data?.attendants ?? []) as AttendantSecurityProfile[];
  const rules = (data?.rules ?? []) as SecurityRuleSetting[];

  // Filtragem de Incidentes
  const filteredIncidents = useMemo(() => {
    return incidents.filter((inc) => {
      const matchSeverity = severityFilter === "all" || inc.severity === severityFilter;
      const matchStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "pending"
          ? inc.status === "pending" || inc.status === "investigating"
          : inc.status === statusFilter;
      const matchText =
        inc.attendantName.toLowerCase().includes(searchIncident.toLowerCase()) ||
        inc.customerName.toLowerCase().includes(searchIncident.toLowerCase()) ||
        inc.ruleName.toLowerCase().includes(searchIncident.toLowerCase()) ||
        inc.customerCpf.includes(searchIncident);
      return matchSeverity && matchStatus && matchText;
    });
  }, [incidents, severityFilter, statusFilter, searchIncident]);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical":
        return (
          <Badge className="bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30 gap-1 font-bold">
            <AlertOctagon className="h-3 w-3" />
            Crítico
          </Badge>
        );
      case "high":
        return (
          <Badge className="bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 gap-1 font-bold">
            <AlertTriangle className="h-3 w-3" />
            Alto Risco
          </Badge>
        );
      case "medium":
        return (
          <Badge className="bg-yellow-500/15 text-yellow-600 dark:text-yellow-400 border-yellow-500/30 gap-1 font-semibold">
            Médio
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30 gap-1 font-semibold">
            Baixo
          </Badge>
        );
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 75) return "text-rose-600 dark:text-rose-400 bg-rose-500/15 border-rose-500/30";
    if (score >= 50) return "text-amber-600 dark:text-amber-400 bg-amber-500/15 border-amber-500/30";
    if (score >= 25) return "text-yellow-600 dark:text-yellow-400 bg-yellow-500/15 border-yellow-500/30";
    return "text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 border-emerald-500/30";
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 shadow-xs">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-foreground">Auditoria & Antifraude</h1>
                <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30 text-xs font-semibold">
                  ● Monitoramento Ativo 24/7
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                Detecção em tempo real de frentistas suspeitos, CPFs repetidos e abastecimentos anômalos.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="gap-1.5 text-xs">
            <RefreshCw className="h-3.5 w-3.5" />
            Atualizar
          </Button>
          <Button
            size="sm"
            onClick={() => setActiveTab("regras")}
            className="gap-1.5 text-xs font-semibold bg-primary text-primary-foreground"
          >
            <Sliders className="h-3.5 w-3.5" />
            Calibrar Regras
          </Button>
        </div>
      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Incidentes Críticos */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Alertas Pendentes</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400">
              <AlertOctagon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              {kpis.pendingIncidentsCount}
            </span>
            {kpis.criticalIncidentsCount > 0 && (
              <span className="inline-flex items-center gap-1 text-xs text-rose-600 font-bold bg-rose-500/15 px-2 py-0.5 rounded-md">
                <span className="h-2 w-2 rounded-full bg-rose-500 animate-ping" />
                {kpis.criticalIncidentsCount} Críticos
              </span>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Requerem averiguação do gerente</p>
        </div>

        {/* Frentistas Sob Risco */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Frentistas Sob Auditoria</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              {kpis.attendantsUnderReviewCount}
            </span>
            <span className="text-xs text-amber-600 font-semibold">Com desvio estatístico</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Volume de cupons muito acima da média</p>
        </div>

        {/* Prejuízo Evitado */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Prejuízo Mitigado</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold tracking-tight text-foreground">
              {formatBRL(kpis.estimatedProtectedAmount)}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Economia retida em descontos indevidos</p>
        </div>

        {/* Conformidade Geral */}
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card transition hover:shadow-md">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Conformidade de Pista</span>
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold tracking-tight text-foreground">
              {kpis.complianceScore}%
            </span>
            <span className="text-xs text-emerald-600 font-medium">Saudável</span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Transações dentro dos padrões normais</p>
        </div>
      </div>

      {/* ABAS DO MÓDULO */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3 max-w-md bg-muted/60 p-1 border border-border">
          <TabsTrigger value="incidentes" className="gap-2 font-semibold text-xs">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-500" />
            Incidentes ({kpis.pendingIncidentsCount})
          </TabsTrigger>
          <TabsTrigger value="frentistas" className="gap-2 font-semibold text-xs">
            <Users className="h-3.5 w-3.5 text-amber-500" />
            Frentistas ({attendants.length})
          </TabsTrigger>
          <TabsTrigger value="regras" className="gap-2 font-semibold text-xs">
            <SlidersHorizontal className="h-3.5 w-3.5 text-primary" />
            Regras Ativas ({rules.length})
          </TabsTrigger>
        </TabsList>

        {/* ABA 1: INCIDENTES EM TEMPO REAL */}
        <TabsContent value="incidentes" className="space-y-4">
          {/* Filtros da tabela */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar frentista, CPF ou regra..."
                value={searchIncident}
                onChange={(e) => setSearchIncident(e.target.value)}
                className="pl-9 bg-card"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Filtro Severidade */}
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="all">Todas Severidades</option>
                <option value="critical">Apenas Críticos</option>
                <option value="high">Alto Risco</option>
                <option value="medium">Médio Risco</option>
              </select>

              {/* Filtro Status */}
              <div className="flex items-center p-0.5 bg-muted/60 rounded-lg border border-border">
                <button
                  onClick={() => setStatusFilter("pending")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    statusFilter === "pending" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  Pendentes
                </button>
                <button
                  onClick={() => setStatusFilter("confirmed_fraud")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    statusFilter === "confirmed_fraud" ? "bg-card text-rose-600 shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  Fraudes
                </button>
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                    statusFilter === "all" ? "bg-card text-foreground shadow-xs" : "text-muted-foreground"
                  }`}
                >
                  Histórico
                </button>
              </div>
            </div>
          </div>

          {/* Lista de Incidentes */}
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Carregando incidentes de segurança...</div>
          ) : filteredIncidents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
              <ShieldCheck className="mx-auto h-12 w-12 text-emerald-500/40" />
              <h3 className="mt-3 text-base font-bold text-foreground">Nenhum incidente pendente encontrado</h3>
              <p className="mt-1 text-xs text-muted-foreground max-w-sm mx-auto">
                Todos os abastecimentos estão dentro da normalidade e das regras estatísticas estabelecidas.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredIncidents.map((inc) => (
                <div
                  key={inc.id}
                  className={`rounded-2xl border bg-card p-4 shadow-card transition hover:shadow-md ${
                    inc.severity === "critical"
                      ? "border-rose-500/30 hover:border-rose-500/60"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {getSeverityBadge(inc.severity)}
                        <span className="font-bold text-sm text-foreground">{inc.ruleName}</span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {new Date(inc.occurredAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          {" - "}
                          {new Date(inc.occurredAt).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}
                        </span>
                        {inc.status === "confirmed_fraud" && (
                          <Badge className="bg-rose-500 text-white font-bold text-[10px]">FRAUDE CONFIRMADA</Badge>
                        )}
                        {inc.status === "false_positive" && (
                          <Badge variant="outline" className="text-muted-foreground text-[10px]">FALSO POSITIVO</Badge>
                        )}
                      </div>

                      <p className="text-xs text-muted-foreground leading-relaxed">{inc.description}</p>

                      <div className="flex items-center gap-4 text-xs pt-1 flex-wrap">
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Frentista:</span>
                          <strong className="text-foreground">{inc.attendantName}</strong>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Cliente/CPF:</span>
                          <strong className="text-foreground">{inc.customerName} ({inc.customerCpf})</strong>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-muted-foreground">Bico:</span>
                          <span className="font-semibold text-foreground">Bomba #{inc.pumpNumber}</span>
                        </div>
                        {inc.evidence?.discountTotalBrl && (
                          <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400 font-bold">
                            <span>Desconto Concedido:</span>
                            <span>{formatBRL(inc.evidence.discountTotalBrl)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ações Rápidas */}
                    <div className="flex items-center gap-2 border-t lg:border-t-0 pt-3 lg:pt-0 border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setInspectIncident(inc)}
                        className="gap-1.5 text-xs font-semibold"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Auditar Detalhes
                      </Button>

                      {inc.status === "pending" || inc.status === "investigating" ? (
                        <>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => incidentMutation.mutate({ incidentId: inc.id, status: "confirmed_fraud" })}
                            className="gap-1.5 text-xs font-bold"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                            Confirmar Fraude
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => incidentMutation.mutate({ incidentId: inc.id, status: "false_positive" })}
                            className="gap-1 text-xs text-muted-foreground hover:text-foreground"
                          >
                            Falso Positivo
                          </Button>
                        </>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* ABA 2: AUDITORIA DE FRENTISTAS (RANKING DE RISCO) */}
        <TabsContent value="frentistas" className="space-y-4">
          <div className="rounded-xl border border-border bg-card/60 p-4 text-xs text-muted-foreground flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Info className="h-4 w-4 text-primary shrink-0" />
              <span>
                <strong>Como funciona o Risk Score:</strong> Calculado combinando a taxa de cupons emitidos acima da média da equipe, abastecimentos repetidos para os mesmos CPFs e alertas críticos abertos.
              </span>
            </div>
            <span className="text-xs font-bold text-foreground">Média da Loja: 28% com cupom</span>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {attendants.map((att) => {
              const isAnomaly = att.discountTransactionsRate > att.storeAverageDiscountRate + 20;

              return (
                <div
                  key={att.id}
                  className={`rounded-2xl border bg-card p-5 shadow-card transition flex flex-col justify-between ${
                    att.riskScore >= 75
                      ? "border-rose-500/40 hover:border-rose-500/80"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div>
                    {/* Header do Card */}
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-base font-bold text-foreground leading-snug">{att.name}</h3>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          Matrícula: {att.code} • Turno {att.shift}
                        </span>
                      </div>

                      <div className={`rounded-xl border px-2.5 py-1 text-center font-extrabold text-xs ${getRiskScoreColor(att.riskScore)}`}>
                        <div className="text-[10px] uppercase font-bold tracking-wider">Risk Score</div>
                        <div className="text-lg leading-none mt-0.5">{att.riskScore}%</div>
                      </div>
                    </div>

                    {/* Status do Frentista */}
                    <div className="mt-3 flex items-center gap-2">
                      {att.status === "under_review" && (
                        <Badge className="bg-amber-500/15 text-amber-600 border-amber-500/30 text-[11px] font-bold">
                          ⚠️ Sob Investigação
                        </Badge>
                      )}
                      {att.status === "suspended" && (
                        <Badge className="bg-rose-500/15 text-rose-600 border-rose-500/30 text-[11px] font-bold">
                          🚫 Terminal Bloqueado
                        </Badge>
                      )}
                      {att.status === "active" && (
                        <Badge variant="outline" className="text-emerald-600 border-emerald-500/30 text-[11px] font-semibold">
                          ● Ativo Normal
                        </Badge>
                      )}
                      {att.confirmedFraudsCount > 0 && (
                        <Badge className="bg-rose-500 text-white text-[10px] font-bold">
                          {att.confirmedFraudsCount} Fraude(s) Registrada(s)
                        </Badge>
                      )}
                    </div>

                    {/* Indicadores Comparativos */}
                    <div className="mt-4 space-y-2 rounded-xl bg-muted/40 p-3 border border-border/50 text-xs">
                      <div>
                        <div className="flex justify-between font-semibold">
                          <span className="text-muted-foreground">Taxa de Cupons Aplicados:</span>
                          <span className={isAnomaly ? "text-rose-600 dark:text-rose-400 font-extrabold" : "text-foreground"}>
                            {att.discountTransactionsRate}%
                            {isAnomaly && " (Anômalo)"}
                          </span>
                        </div>
                        <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className={`h-full ${
                              isAnomaly ? "bg-rose-500" : "bg-primary"
                            }`}
                            style={{ width: `${Math.min(100, att.discountTransactionsRate)}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground mt-0.5">
                          <span>0%</span>
                          <span>Média equipe: {att.storeAverageDiscountRate}%</span>
                          <span>100%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <span className="text-muted-foreground">Transações no Mês:</span>
                        <strong className="text-foreground">{att.totalTransactionsMonth}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-muted-foreground">Alertas Ativos:</span>
                        <strong className={att.openIncidentsCount > 0 ? "text-amber-600" : "text-foreground"}>
                          {att.openIncidentsCount}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Ações do Frentista */}
                  <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                    {att.status === "suspended" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => attendantMutation.mutate({ attendantId: att.id, status: "active" })}
                        className="w-full gap-1.5 text-xs text-emerald-600 font-semibold"
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        Desbloquear Terminal
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            attendantMutation.mutate({
                              attendantId: att.id,
                              status: att.status === "under_review" ? "active" : "under_review",
                            })
                          }
                          className="flex-1 text-xs font-semibold"
                        >
                          {att.status === "under_review" ? "Liberar Auditoria" : "Auditar"}
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Deseja bloquear o terminal de pista de ${att.name}? Ele não poderá lançar tokens.`)) {
                              attendantMutation.mutate({ attendantId: att.id, status: "suspended" });
                            }
                          }}
                          className="gap-1 text-xs font-bold"
                        >
                          <Lock className="h-3 w-3" />
                          Bloquear
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        {/* ABA 3: CENTRAL DE REGRAS E CALIBRAÇÃO */}
        <TabsContent value="regras" className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <h3 className="text-base font-bold text-foreground">Regras Ativas do Motor Antifraude</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Ative ou desative regras de validação estatística e calibre a sensibilidade dos gatilhos de alerta.
            </p>

            <div className="mt-5 space-y-4 divide-y divide-border">
              {rules.map((r) => (
                <div key={r.id} className="pt-4 first:pt-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1 max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-foreground">{r.name}</span>
                      {getSeverityBadge(r.severity)}
                    </div>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                    <div className="text-xs font-semibold text-primary pt-0.5">
                      Gatilho atual: Limiar de {r.thresholdValue} {r.thresholdUnit}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingRule({ ...r })}
                      className="text-xs font-semibold gap-1.5"
                    >
                      <Sliders className="h-3 w-3" />
                      Calibrar
                    </Button>

                    <div className="flex items-center gap-2">
                      <Switch
                        checked={r.enabled}
                        onCheckedChange={(checked) => ruleMutation.mutate({ ruleId: r.id, enabled: checked })}
                      />
                      <span className="text-xs font-semibold">{r.enabled ? "Ativo" : "Inativo"}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* MODAL DE AUDITORIA DETALHADA DO INCIDENTE */}
      <Dialog open={!!inspectIncident} onOpenChange={(open) => !open && setInspectIncident(null)}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-rose-500" />
              Auditoria de Incidente Suspeito
            </DialogTitle>
            <DialogDescription>
              Averiguação de conformidade das transações na pista e histórico de abastecimento.
            </DialogDescription>
          </DialogHeader>

          {inspectIncident && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="rounded-xl border border-border bg-card p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{inspectIncident.ruleName}</span>
                  {getSeverityBadge(inspectIncident.severity)}
                </div>
                <p className="text-muted-foreground">{inspectIncident.description}</p>
              </div>

              {/* Informações dos envolvidos */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Frentista Responsável</span>
                  <p className="font-bold text-foreground text-sm mt-0.5">{inspectIncident.attendantName}</p>
                  <p className="text-muted-foreground text-[11px]">Bomba #{inspectIncident.pumpNumber} • {inspectIncident.stationName}</p>
                </div>

                <div className="rounded-xl border border-border bg-muted/30 p-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cliente Registrado</span>
                  <p className="font-bold text-foreground text-sm mt-0.5">{inspectIncident.customerName}</p>
                  <p className="text-muted-foreground text-[11px]">CPF: {inspectIncident.customerCpf}</p>
                </div>
              </div>

              {/* Evidências do Motor */}
              <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-2">
                <span className="font-bold text-foreground flex items-center gap-1.5">
                  <Zap className="h-3.5 w-3.5 text-primary" />
                  Evidências Coletadas pelo Motor Antifraude:
                </span>
                <div className="grid grid-cols-2 gap-2 pt-1 font-medium">
                  {inspectIncident.evidence.transactionCount && (
                    <div className="flex justify-between border-b border-border/40 pb-1">
                      <span className="text-muted-foreground">Abastecimentos na janela:</span>
                      <strong>{inspectIncident.evidence.transactionCount} vezes</strong>
                    </div>
                  )}
                  {inspectIncident.evidence.timeWindowMinutes && (
                    <div className="flex justify-between border-b border-border/40 pb-1">
                      <span className="text-muted-foreground">Janela de tempo:</span>
                      <strong>{inspectIncident.evidence.timeWindowMinutes} minutos</strong>
                    </div>
                  )}
                  {inspectIncident.evidence.totalLiters && (
                    <div className="flex justify-between border-b border-border/40 pb-1">
                      <span className="text-muted-foreground">Volume total registrado:</span>
                      <strong>{inspectIncident.evidence.totalLiters} Litros</strong>
                    </div>
                  )}
                  {inspectIncident.evidence.discountTotalBrl && (
                    <div className="flex justify-between border-b border-border/40 pb-1">
                      <span className="text-muted-foreground">Desconto concedido:</span>
                      <strong className="text-purple-600">{formatBRL(inspectIncident.evidence.discountTotalBrl)}</strong>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 mt-2">
            <Button variant="outline" onClick={() => setInspectIncident(null)}>
              Fechar
            </Button>
            {inspectIncident?.status === "pending" || inspectIncident?.status === "investigating" ? (
              <>
                <Button
                  variant="ghost"
                  onClick={() =>
                    incidentMutation.mutate({ incidentId: inspectIncident.id, status: "false_positive" })
                  }
                  className="text-muted-foreground"
                >
                  Marcar como Falso Positivo
                </Button>
                <Button
                  variant="destructive"
                  onClick={() =>
                    incidentMutation.mutate({ incidentId: inspectIncident.id, status: "confirmed_fraud" })
                  }
                  className="font-bold gap-1.5"
                >
                  <AlertOctagon className="h-4 w-4" />
                  Confirmar Fraude
                </Button>
              </>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL DE CALIBRAÇÃO DE REGRA */}
      <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Sliders className="h-4 w-4 text-primary" />
              Calibrar Sensibilidade da Regra
            </DialogTitle>
            <DialogDescription>
              Ajuste o valor limite que dispara o alerta automático de fraude na pista.
            </DialogDescription>
          </DialogHeader>

          {editingRule && (
            <div className="space-y-3 pt-2 text-xs">
              <div className="rounded-xl bg-muted/40 p-3 border border-border">
                <span className="font-bold text-foreground text-sm">{editingRule.name}</span>
                <p className="text-muted-foreground mt-1">{editingRule.description}</p>
              </div>

              <div>
                <Label htmlFor="threshold" className="text-xs font-semibold">
                  Valor Limiar ({editingRule.thresholdUnit})
                </Label>
                <Input
                  id="threshold"
                  type="number"
                  value={editingRule.thresholdValue}
                  onChange={(e) => setEditingRule({ ...editingRule, thresholdValue: Number(e.target.value) })}
                  className="mt-1 font-bold"
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  Qualquer evento que ultrapassar este valor criará um incidente no painel com severidade {editingRule.severity.toUpperCase()}.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="mt-3 gap-2">
            <Button variant="outline" onClick={() => setEditingRule(null)}>
              Cancelar
            </Button>
            <Button
              onClick={() => {
                if (!editingRule) return;
                ruleMutation.mutate({
                  ruleId: editingRule.id,
                  enabled: editingRule.enabled,
                  thresholdValue: editingRule.thresholdValue,
                });
              }}
              className="font-semibold"
            >
              Salvar Calibração
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
