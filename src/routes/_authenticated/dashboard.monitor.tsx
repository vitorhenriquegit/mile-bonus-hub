import { createFileRoute } from "@tanstack/react-router";
import { Fuel, Activity, Gauge, Timer } from "lucide-react";
import { LIVE_TRANSACTIONS, formatBRL } from "@/lib/mock";

export const Route = createFileRoute("/_authenticated/dashboard/monitor")({
  component: Monitor,
});

const PUMPS = [
  { id: 1, fuel: "Gasolina Aditivada", status: "abastecendo", liters: 28.4, client: "***.456.789-**" },
  { id: 2, fuel: "Etanol", status: "livre", liters: 0, client: null },
  { id: 3, fuel: "Diesel S10", status: "abastecendo", liters: 84.2, client: "***.987.321-**" },
  { id: 4, fuel: "Gasolina Comum", status: "livre", liters: 0, client: null },
  { id: 5, fuel: "Gasolina Aditivada", status: "abastecendo", liters: 12.1, client: "***.321.654-**" },
  { id: 6, fuel: "Diesel S10", status: "manutenção", liters: 0, client: null },
];

function Monitor() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Monitor de Pista</h1>
        <p className="text-sm text-muted-foreground">
          Status das bombas em tempo real · Posto Centro
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Bombas ativas" value="3 / 6" icon={<Gauge className="h-4 w-4" />} />
        <Stat label="Vazão média" value="42 L/min" icon={<Activity className="h-4 w-4" />} />
        <Stat label="Tempo médio" value="2m 18s" icon={<Timer className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {PUMPS.map((p) => (
          <div key={p.id} className="rounded-2xl border border-border bg-card p-5 shadow-card">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent">
                  <Fuel className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold">Bomba {p.id}</p>
                  <p className="text-xs text-muted-foreground">{p.fuel}</p>
                </div>
              </div>
              <StatusPill status={p.status} />
            </div>
            <div className="mt-4 rounded-lg bg-muted/60 p-3">
              <p className="text-xs text-muted-foreground">Volume da sessão</p>
              <p className="text-xl font-bold tabular-nums">{p.liters.toFixed(1)} L</p>
              {p.client && (
                <p className="mt-1 text-xs text-muted-foreground tabular-nums">{p.client}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="border-b border-border px-5 py-4">
          <p className="text-sm font-semibold">Últimas transações da pista</p>
        </div>
        <ul className="divide-y divide-border">
          {LIVE_TRANSACTIONS.slice(0, 5).map((tx) => (
            <li key={tx.id} className="flex items-center justify-between px-5 py-3 text-sm">
              <div>
                <p className="font-medium tabular-nums">{tx.cpf}</p>
                <p className="text-xs text-muted-foreground">{tx.fuel} · {tx.station}</p>
              </div>
              <div className="text-right">
                <p className="font-bold tabular-nums">{tx.liters.toFixed(1)} L</p>
                <p className="text-xs text-primary tabular-nums">−{formatBRL(tx.discount)}</p>
              </div>
            </li>
          ))}
        </ul>
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

function StatusPill({ status }: { status: string }) {
  const map: Record<string, string> = {
    abastecendo: "bg-success/10 text-success",
    livre: "bg-muted text-muted-foreground",
    "manutenção": "bg-warning/15 text-warning-foreground",
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${map[status]}`}>
      {status}
    </span>
  );
}
