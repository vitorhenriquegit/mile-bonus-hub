import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import {
  Fuel,
  Percent,
  UserPlus,
  Users,
  Calendar,
  CheckCircle2,
  XCircle,
  SlidersHorizontal,
  Loader2,
  Download,
  ShieldCheck,
  X,
  TrendingUp,
  Smartphone,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { getDashboardData, getTiers } from "@/lib/loyalty.functions";
import { exportToCsv, formatBRL, maskCpf, type Tier } from "@/lib/loyalty";
import { AttendantTerminal } from "@/components/AttendantTerminal";
import { useNiche } from "@/lib/niche-context";
import { NicheIcon } from "@/components/NicheIcon";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Painel do gestor — FuelRewards" },
      { name: "description", content: "Volume abastecido, descontos concedidos e transações do programa de fidelidade." },
      { property: "og:title", content: "Painel do gestor — FuelRewards" },
      { property: "og:description", content: "Volume abastecido, descontos concedidos e transações do programa de fidelidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Overview,
});

function Overview() {
  const { currentNiche } = useNiche();
  const [showTerminalModal, setShowTerminalModal] = useState(false);
  const dashFn = useServerFn(getDashboardData);
  const tiersFn = useServerFn(getTiers);
  const dash = useQuery({ queryKey: ["dashboard"], queryFn: () => dashFn({}) });
  const tiersQuery = useQuery({ queryKey: ["tiers"], queryFn: () => tiersFn({}) });

  if (dash.isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (dash.isError) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
        Você não tem permissão para acessar o painel do gestor.
      </div>
    );
  }

  const m = dash.data?.metrics || {
    volumeMonth: 0,
    discountsGranted: 0,
    newCustomers: 0,
    totalCustomers: 0,
    transactionsMonth: 0,
  };

  const serverTicketMetrics = (dash.data?.metrics as any)?.ticketMetrics;
  const tm =
    serverTicketMetrics && currentNiche.id === "fuel"
      ? serverTicketMetrics
      : {
          ticketWithApp: currentNiche.terms.ticketBenchmarkApp,
          ticketWithoutApp: currentNiche.terms.ticketBenchmarkNoApp,
          upliftPercent:
            Math.round(
              ((currentNiche.terms.ticketBenchmarkApp - currentNiche.terms.ticketBenchmarkNoApp) /
                currentNiche.terms.ticketBenchmarkNoApp) *
                10000,
            ) / 100,
          incrementalPerTx:
            Math.round(
              (currentNiche.terms.ticketBenchmarkApp - currentNiche.terms.ticketBenchmarkNoApp) * 10,
            ) / 10,
          incrementalRevenue:
            Math.round(
              (currentNiche.terms.ticketBenchmarkApp - currentNiche.terms.ticketBenchmarkNoApp) *
                (m.transactionsMonth || 3840),
            ),
          totalAppTransactions: m.transactionsMonth || 3840,
        };

  const dailySeries = dash.data?.dailySeries || [];
  const recent = dash.data?.recent || [];
  const tiers = (tiersQuery.data ?? []) as unknown as Tier[];
  const avgDiscount = m.volumeMonth > 0 ? m.discountsGranted / m.volumeMonth : 0;

  const handleExportCsv = () => {
    const headers = [
      "ID",
      "Data",
      "Cliente/CPF",
      "Item/Serviço",
      `${currentNiche.terms.metricLabel} (${currentNiche.terms.metricShort})`,
      "Desconto Total (R$)",
      "Total Pago (R$)",
    ];
    const rows = recent.map((tx) => [
      tx.id,
      new Date(tx.created_at).toLocaleString("pt-BR"),
      tx.customerName || maskCpf(tx.customerCpf),
      tx.fuel_type,
      Number(tx.liters).toFixed(1),
      Number(tx.discount_total).toFixed(2),
      Number(tx.total).toFixed(2),
    ]);
    exportToCsv(`relatorio_${currentNiche.id}_fidelidade`, headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inteligência de Vendas</h1>
          <p className="text-sm text-muted-foreground">
            Performance do programa de fidelidade · {currentNiche.name}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTerminalModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:opacity-90"
          >
            <ShieldCheck className="h-4 w-4" />
            Validar Token ({currentNiche.terms.operatorLabel})
          </button>
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold text-muted-foreground hover:bg-muted shadow-card"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
          <span className="inline-flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium shadow-card text-muted-foreground">
            <Calendar className="h-4 w-4" />
            Últimos 30 dias
          </span>
        </div>
      </div>

      {showTerminalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowTerminalModal(false)}
              className="absolute right-4 top-4 z-10 grid h-8 w-8 place-items-center rounded-lg bg-muted text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
            <AttendantTerminal onSuccess={() => setShowTerminalModal(false)} />
          </div>
        </div>
      )}


      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label={currentNiche.terms.metricLabel}
          value={`${m.volumeMonth.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} ${currentNiche.terms.metricShort}`}
          icon={<NicheIcon name={currentNiche.iconName} className="h-4 w-4" />}
          hint="mês corrente"
        />
        <Kpi
          label="Descontos Concedidos"
          value={formatBRL(m.discountsGranted)}
          icon={<Percent className="h-4 w-4" />}
          hint={`média ${formatBRL(avgDiscount)} / ${currentNiche.terms.metricShort}`}
        />
        <Kpi
          label={`Novos ${currentNiche.terms.clientLabel} no App`}
          value={m.newCustomers.toLocaleString("pt-BR")}
          icon={<UserPlus className="h-4 w-4" />}
          hint="cadastros neste mês"
        />
        <Kpi
          label={`Base Total de ${currentNiche.terms.clientLabel}`}
          value={m.totalCustomers.toLocaleString("pt-BR")}
          icon={<Users className="h-4 w-4" />}
          hint={`${m.transactionsMonth} ${currentNiche.terms.transactionPlural.toLowerCase()} no mês`}
        />
      </div>

      {/* Indicador Comparativo de Ticket Médio e Faturamento Adicional */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <div className="border-b border-border/60 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground">
                  Impacto do App no Ticket Médio e Receita
                </h2>
                <p className="text-xs text-muted-foreground">
                  Comparativo de consumo entre clientes fidelizados via aplicativo vs. clientes avulsos no(a) {currentNiche.terms.locationLabel}
                </p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+{Number(tm.upliftPercent).toFixed(1)}% no ticket médio</span>
            </div>
          </div>
        </div>

        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-12">
          {/* Lado Esquerdo: Comparativo Visual de Ticket Médio */}
          <div className="space-y-4 lg:col-span-7">
            <div className="grid gap-3 sm:grid-cols-2">
              {/* Card Com App */}
              <div className="relative overflow-hidden rounded-xl border-2 border-primary/40 bg-primary/5 p-4 transition">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-primary">
                    <Smartphone className="h-3.5 w-3.5" />
                    Com App (Fidelizado)
                  </span>
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-bold text-primary">
                    +{Number(tm.upliftPercent).toFixed(1)}%
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground">
                    {formatBRL(Number(tm.ticketWithApp))}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Gasto médio por {currentNiche.terms.transactionSingular.toLowerCase()} no app
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0" />
                  <span>+{formatBRL(Number(tm.incrementalPerTx))} a mais por visita</span>
                </div>
              </div>

              {/* Card Sem App */}
              <div className="rounded-xl border border-border bg-muted/30 p-4 transition">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <NicheIcon name={currentNiche.iconName} className="h-3.5 w-3.5" />
                    Sem App ({currentNiche.terms.locationLabel} Comum)
                  </span>
                  <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
                    Referência
                  </span>
                </div>
                <div className="mt-3">
                  <p className="text-3xl font-extrabold tracking-tight tabular-nums text-foreground/80">
                    {formatBRL(Number(tm.ticketWithoutApp))}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Média de {currentNiche.terms.clientLabel.toLowerCase()} sem identificação
                  </p>
                </div>
                <div className="mt-3 text-xs text-muted-foreground">
                  Base histórica de {currentNiche.terms.locationLabel} do estabelecimento
                </div>
              </div>
            </div>

            {/* Barra Visual de Comparação Proporcional */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5">
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-muted-foreground">
                  Proporção de valor por {currentNiche.terms.transactionSingular.toLowerCase()}
                </span>
                <span className="font-bold text-primary">
                  Diferença: +{formatBRL(Number(tm.incrementalPerTx))} (+{Number(tm.upliftPercent).toFixed(1)}%)
                </span>
              </div>
              <div className="mt-2.5 h-3 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(
                        10,
                        (Number(tm.ticketWithApp) /
                          (Number(tm.ticketWithApp) + Number(tm.ticketWithoutApp) * 0.2)) *
                          100,
                      ),
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>
                  {currentNiche.terms.locationLabel} Comum: {formatBRL(Number(tm.ticketWithoutApp))}
                </span>
                <span className="font-semibold text-foreground">
                  Com Fidelidade: {formatBRL(Number(tm.ticketWithApp))}
                </span>
              </div>
            </div>
          </div>

          {/* Lado Direito: Faturamento Gerado a Mais no Período */}
          <div className="flex flex-col justify-between rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/5 via-emerald-500/10 to-transparent p-5 lg:col-span-5">
            <div>
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-4 w-4" />
                  Ganho Real do Programa
                </span>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                  Mês Atual
                </span>
              </div>

              <div className="mt-4">
                <p className="text-xs font-medium text-muted-foreground">
                  Faturamento Adicional Gerado no Período
                </p>
                <p className="mt-1 text-3xl sm:text-4xl font-black tracking-tight text-emerald-600 dark:text-emerald-400 tabular-nums">
                  +{formatBRL(Number(tm.incrementalRevenue))}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                  Receita extra bruta originada exclusivamente pelo incremento de volume e ticket dos{" "}
                  <strong className="text-foreground">
                    {Number(tm.totalAppTransactions).toLocaleString("pt-BR")}
                  </strong>{" "}
                  {currentNiche.terms.transactionPlural.toLowerCase()} realizados com o aplicativo no período.
                </p>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-emerald-500/20 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Incremento médio por cliente</span>
              <span className="font-bold text-foreground">
                +{formatBRL(Number(tm.incrementalPerTx))} / visita
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">{currentNiche.terms.metricLabel} Diária vs. Descontos Aplicados</p>
            <p className="text-xs text-muted-foreground">
              {currentNiche.terms.metricLabel} e desconto concedido (R$) por dia
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Legenda color="var(--primary)" label={`${currentNiche.terms.metricLabel} (${currentNiche.terms.metricShort})`} />
            <Legenda color="oklch(0.55 0.18 250)" label="Descontos (R$)" />
          </div>
        </div>
        <div className="mt-4 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={dailySeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  background: "var(--card)",
                  border: "1px solid var(--border)",
                  borderRadius: 12,
                  fontSize: 12,
                }}
                formatter={(value: number, name: string) =>
                  name === "Descontos (R$)"
                    ? [formatBRL(value), name]
                    : [`${value.toLocaleString("pt-BR")} ${currentNiche.terms.metricShort}`, name]
                }
              />
              <Legend wrapperStyle={{ display: "none" }} />
              <Bar
                yAxisId="left"
                dataKey="liters"
                name={`${currentNiche.terms.metricLabel} (${currentNiche.terms.metricShort})`}
                fill="var(--primary)"
                radius={[6, 6, 0, 0]}
                maxBarSize={18}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="discount"
                name="Descontos (R$)"
                stroke="oklch(0.55 0.18 250)"
                strokeWidth={2.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Motor de Gamificação · Tiers Ativos ({currentNiche.badge})</p>
            <p className="text-xs text-muted-foreground">
              Regra vigente aplicada em tempo real para {currentNiche.terms.businessType.toLowerCase()}
            </p>
          </div>
          <Link
            to="/dashboard/regras"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:opacity-90"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Ajustar Regras de Gamificação
          </Link>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {tiers.map((t, i) => (
            <div
              key={t.id}
              className="rounded-xl border border-border p-4 transition hover:shadow-card"
              style={{ background: `color-mix(in oklab, var(--${t.color}) 8%, var(--card))` }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nível {i + 1}
                </span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
                  style={{ background: `var(--${t.color})` }}
                >
                  {t.name}
                </span>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">Faixa de Qualificação</p>
              <p className="text-sm font-semibold">
                {t.min_liters} {currentNiche.terms.metricShort} –{" "}
                {t.max_liters > 999 ? "∞" : `${t.max_liters} ${currentNiche.terms.metricShort}`}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Desconto / Benefício</p>
              <p className="text-2xl font-bold tabular-nums">
                {formatBRL(t.discount_per_liter)}
                <span className="text-xs font-medium text-muted-foreground">/{currentNiche.terms.metricShort}</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Transações recentes ({currentNiche.badge})</p>
            <p className="text-xs text-muted-foreground">
              {currentNiche.terms.transactionPlural} validados pelo token no PDV
            </p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Live
          </span>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Nenhuma transação registrada ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-wider text-muted-foreground">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left font-semibold">Status</th>
                  <th className="px-5 py-3 text-left font-semibold">Data/Hora</th>
                  <th className="px-5 py-3 text-left font-semibold">Cliente</th>
                  <th className="px-5 py-3 text-left font-semibold">Item / Serviço</th>
                  <th className="px-5 py-3 text-right font-semibold">
                    Volume ({currentNiche.terms.metricShort})
                  </th>
                  <th className="px-5 py-3 text-right font-semibold">Desconto</th>
                  <th className="px-5 py-3 text-right font-semibold">Valor Final</th>
                </tr>
              </thead>
              <tbody>
                {recent.map((tx) => (
                  <tr key={tx.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                    <td className="px-5 py-3">
                      {tx.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-success" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </td>
                    <td className="px-5 py-3 tabular-nums text-muted-foreground">
                      {new Date(tx.created_at).toLocaleString("pt-BR", {
                        day: "2-digit",
                        month: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="px-5 py-3 font-medium tabular-nums">
                      {tx.customerName ?? maskCpf(tx.customerCpf)}
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{tx.fuel_type}</td>
                    <td className="px-5 py-3 text-right tabular-nums">
                      {Number(tx.liters).toFixed(1)} {currentNiche.terms.metricShort}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums text-primary">
                      {formatBRL(Number(tx.discount_total))}
                    </td>
                    <td className="px-5 py-3 text-right font-semibold tabular-nums">
                      {formatBRL(Number(tx.total))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-foreground">{icon}</div>
      <p className="mt-4 text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Legenda({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-muted-foreground">
      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: color }} />
      {label}
    </span>
  );
}
