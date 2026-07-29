import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Fuel,
  Percent,
  UserPlus,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  CheckCircle2,
  XCircle,
  Download,
  SlidersHorizontal,
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
import {
  DASHBOARD_METRICS,
  DAILY_SERIES,
  LIVE_TRANSACTIONS,
  TIERS,
  formatBRL,
} from "@/lib/mock";

export const Route = createFileRoute("/dashboard/")({
  component: Overview,
});

function Overview() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Inteligência de Vendas</h1>
          <p className="text-sm text-muted-foreground">
            Performance do programa de fidelidade · rede consolidada
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium shadow-card hover:bg-accent">
            <Calendar className="h-4 w-4" />
            Últimos 30 dias
          </button>
          <button className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium shadow-card hover:bg-accent">
            <Download className="h-4 w-4" />
            Exportar
          </button>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi
          label="Volume Abastecido (Galonagem)"
          value="142.500 L"
          delta={DASHBOARD_METRICS.volumeDelta}
          icon={<Fuel className="h-4 w-4" />}
          hint="vs. mês anterior"
        />
        <Kpi
          label="Descontos Concedidos"
          value={formatBRL(DASHBOARD_METRICS.discountsGranted)}
          delta={DASHBOARD_METRICS.discountsDelta}
          icon={<Percent className="h-4 w-4" />}
          hint="ticket médio R$ 0,087/L"
        />
        <Kpi
          label="Novos Clientes no App"
          value={DASHBOARD_METRICS.newCustomers.toLocaleString("pt-BR")}
          delta={DASHBOARD_METRICS.newCustomersDelta}
          icon={<UserPlus className="h-4 w-4" />}
          hint="ativação no app"
        />
        <Kpi
          label="Risco de Churn"
          value={`${DASHBOARD_METRICS.churnRisk}%`}
          delta={DASHBOARD_METRICS.churnDelta}
          icon={<AlertTriangle className="h-4 w-4" />}
          hint="sem abastecer há 30+ dias"
          danger
        />
      </div>

      {/* Chart */}
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
            <ComposedChart data={DAILY_SERIES} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
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

      {/* Tiers section */}
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
          {TIERS.map((t, i) => (
            <div
              key={t.name}
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
                {t.min}L – {t.max > 999 ? "∞" : `${t.max}L`}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Desconto na bomba</p>
              <p className="text-2xl font-bold tabular-nums">{formatBRL(t.discount)}<span className="text-xs font-medium text-muted-foreground">/L</span></p>
            </div>
          ))}
        </div>
      </div>

      {/* Live transactions table */}
      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="text-sm font-semibold">Transações em Tempo Real</p>
            <p className="text-xs text-muted-foreground">Stream do Data Lake · atualização contínua</p>
          </div>
          <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-2.5 py-1 text-xs font-semibold text-success">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-success" />
            </span>
            Live
          </span>
        </div>
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
              {LIVE_TRANSACTIONS.map((tx) => (
                <tr key={tx.id} className="border-b border-border/60 last:border-0 hover:bg-muted/40">
                  <td className="px-5 py-3">
                    {tx.status === "ok" ? (
                      <CheckCircle2 className="h-4 w-4 text-success" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                  </td>
                  <td className="px-5 py-3 tabular-nums text-muted-foreground">Hoje · {tx.time}</td>
                  <td className="px-5 py-3 font-medium tabular-nums">{tx.cpf}</td>
                  <td className="px-5 py-3 text-muted-foreground">{tx.fuel}</td>
                  <td className="px-5 py-3 text-right tabular-nums">{tx.liters.toFixed(1)} L</td>
                  <td className="px-5 py-3 text-right tabular-nums text-primary font-semibold">
                    {formatBRL(tx.discount)}
                  </td>
                  <td className="px-5 py-3 text-right tabular-nums font-bold">{formatBRL(tx.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  delta,
  icon,
  hint,
  danger,
}: {
  label: string;
  value: string;
  delta: number;
  icon: React.ReactNode;
  hint?: string;
  danger?: boolean;
}) {
  const positive = delta >= 0;
  const isGood = danger ? !positive : positive;
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center justify-between">
        <div
          className={`grid h-9 w-9 place-items-center rounded-lg ${
            danger ? "bg-destructive/10 text-destructive" : "bg-accent text-foreground"
          }`}
        >
          {icon}
        </div>
        <span
          className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold ${
            isGood ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
          }`}
        >
          {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
          {Math.abs(delta).toFixed(1)}%
        </span>
      </div>
      <p className="mt-4 text-xs font-medium text-muted-foreground">{label}</p>
      <p className={`mt-1 text-2xl font-bold tracking-tight tabular-nums ${danger ? "text-destructive" : ""}`}>
        {value}
      </p>
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
