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

export const Route = createFileRoute("/_authenticated/dashboard/")({
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
  const dailySeries = dash.data?.dailySeries || [];
  const recent = dash.data?.recent || [];
  const tiers = (tiersQuery.data ?? []) as unknown as Tier[];
  const avgDiscount = m.volumeMonth > 0 ? m.discountsGranted / m.volumeMonth : 0;

  const handleExportCsv = () => {
    const headers = ["ID", "Data", "Cliente/CPF", "Combustível", "Volume (L)", "Desconto Total (R$)", "Total Pago (R$)"];
    const rows = recent.map((tx) => [
      tx.id,
      new Date(tx.created_at).toLocaleString("pt-BR"),
      tx.customerName || maskCpf(tx.customerCpf),
      tx.fuel_type,
      Number(tx.liters).toFixed(1),
      Number(tx.discount_total).toFixed(2),
      Number(tx.total).toFixed(2),
    ]);
    exportToCsv("relatorio_abastecimentos_fuelrewards", headers, rows);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inteligência de Vendas</h1>
          <p className="text-sm text-muted-foreground">
            Performance do programa de fidelidade · dados do mês corrente
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTerminalModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card hover:opacity-90"
          >
            <ShieldCheck className="h-4 w-4" />
            Validar Token de Frentista
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
          label="Volume Abastecido (Galonagem)"
          value={`${m.volumeMonth.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} L`}
          icon={<Fuel className="h-4 w-4" />}
          hint="mês corrente"
        />
        <Kpi
          label="Descontos Concedidos"
          value={formatBRL(m.discountsGranted)}
          icon={<Percent className="h-4 w-4" />}
          hint={`média ${formatBRL(avgDiscount)}/L`}
        />
        <Kpi
          label="Novos Clientes no App"
          value={m.newCustomers.toLocaleString("pt-BR")}
          icon={<UserPlus className="h-4 w-4" />}
          hint="cadastros neste mês"
        />
        <Kpi
          label="Base total de clientes"
          value={m.totalCustomers.toLocaleString("pt-BR")}
          icon={<Users className="h-4 w-4" />}
          hint={`${m.transactionsMonth} transações no mês`}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Galonagem Diária vs. Descontos Aplicados</p>
            <p className="text-xs text-muted-foreground">Litros abastecidos e desconto pago (R$) por dia</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <Legenda color="var(--primary)" label="Volume (L)" />
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
                  name === "Descontos (R$)" ? [formatBRL(value), name] : [`${value.toLocaleString("pt-BR")} L`, name]
                }
              />
              <Legend wrapperStyle={{ display: "none" }} />
              <Bar yAxisId="left" dataKey="liters" name="Volume (L)" fill="var(--primary)" radius={[6, 6, 0, 0]} maxBarSize={18} />
              <Line yAxisId="right" type="monotone" dataKey="discount" name="Descontos (R$)" stroke="oklch(0.55 0.18 250)" strokeWidth={2.5} dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-sm font-semibold">Motor de Gamificação · Tiers Ativos</p>
            <p className="text-xs text-muted-foreground">Regra vigente aplicada na bomba em tempo real</p>
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
              <p className="mt-3 text-xs text-muted-foreground">Faixa de volume</p>
              <p className="text-sm font-semibold">
                {t.min_liters}L – {t.max_liters > 999 ? "∞" : `${t.max_liters}L`}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Desconto na bomba</p>
              <p className="text-2xl font-bold tabular-nums">
                {formatBRL(t.discount_per_liter)}
                <span className="text-xs font-medium text-muted-foreground">/L</span>
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Transações recentes</p>
            <p className="text-xs text-muted-foreground">Abastecimentos validados pelo token</p>
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
                  <th className="px-5 py-3 text-left font-semibold">Combustível</th>
                  <th className="px-5 py-3 text-right font-semibold">Volume</th>
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
                    <td className="px-5 py-3 text-right tabular-nums">{Number(tx.liters).toFixed(1)} L</td>
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
