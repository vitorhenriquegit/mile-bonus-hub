import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Activity, Gauge, Timer, Loader2 } from "lucide-react";
import { getDashboardData } from "@/lib/loyalty.functions";
import { formatBRL, maskCpf } from "@/lib/loyalty";

export const Route = createFileRoute("/_authenticated/dashboard/monitor")({
  head: () => ({
    meta: [
      { title: "Monitor de pista — FuelRewards" },
      { name: "description", content: "Acompanhe em tempo real os abastecimentos validados pelo programa de fidelidade." },
      { property: "og:title", content: "Monitor de pista — FuelRewards" },
      { property: "og:description", content: "Acompanhe em tempo real os abastecimentos validados pelo programa de fidelidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Monitor,
});

function Monitor() {
  const dashFn = useServerFn(getDashboardData);
  const dash = useQuery({
    queryKey: ["dashboard"],
    queryFn: () => dashFn({}),
    refetchInterval: 15_000,
  });

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
        Você não tem permissão para acessar esta página.
      </div>
    );
  }

  const recent = dash.data!.recent;
  const m = dash.data!.metrics;
  const avgLiters = m.transactionsMonth > 0 ? m.volumeMonth / m.transactionsMonth : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Monitor de Pista</h1>
        <p className="text-sm text-muted-foreground">
          Abastecimentos validados pelo app · atualização automática
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat
          label="Transações no mês"
          value={m.transactionsMonth.toLocaleString("pt-BR")}
          icon={<Gauge className="h-4 w-4" />}
        />
        <Stat
          label="Volume médio"
          value={`${avgLiters.toFixed(1)} L`}
          icon={<Activity className="h-4 w-4" />}
        />
        <Stat
          label="Descontos no mês"
          value={formatBRL(m.discountsGranted)}
          icon={<Timer className="h-4 w-4" />}
        />
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-4">
          <p className="text-sm font-semibold">Últimas transações da pista</p>
        </div>
        {recent.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Nenhuma transação registrada ainda.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {recent.slice(0, 8).map((tx) => (
              <li key={tx.id} className="flex items-center justify-between px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">{tx.customerName ?? maskCpf(tx.customerCpf)}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.fuel_type} · {tx.stations?.name ?? "Posto"}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular-nums">{Number(tx.liters).toFixed(1)} L</p>
                  <p className="text-xs tabular-nums text-primary">
                    −{formatBRL(Number(tx.discount_total))}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold tabular-nums">{value}</p>
        </div>
      </div>
    </div>
  );
}
