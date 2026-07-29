import { createFileRoute } from "@tanstack/react-router";
import { Fuel, MapPin } from "lucide-react";
import { HISTORY, formatBRL } from "@/lib/mock";

export const Route = createFileRoute("/app/historico")({
  component: History,
});

function History() {
  const totalSaved = HISTORY.reduce((s, h) => s + h.saved, 0);
  const totalLiters = HISTORY.reduce((s, h) => s + h.liters, 0);

  return (
    <div className="px-5 pt-6">
      <h1 className="text-2xl font-bold tracking-tight">Histórico</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Seus últimos abastecimentos
      </p>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-3">
          <p className="text-xs text-muted-foreground">Volume total</p>
          <p className="mt-1 text-lg font-bold">{totalLiters.toFixed(1)}L</p>
        </div>
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-3">
          <p className="text-xs text-muted-foreground">Economia total</p>
          <p className="mt-1 text-lg font-bold text-primary">{formatBRL(totalSaved)}</p>
        </div>
      </div>

      <ul className="mt-6 space-y-3">
        {HISTORY.map((h) => (
          <li
            key={h.id}
            className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4"
          >
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-foreground">
              <Fuel className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-sm font-semibold">{h.liters.toFixed(1)} litros</p>
                <p className="text-sm font-semibold text-success">
                  −{formatBRL(h.saved)}
                </p>
              </div>
              <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {h.station}
                </span>
                <span>{h.date}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
