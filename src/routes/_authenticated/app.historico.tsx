import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Fuel, MapPin, Loader2 } from "lucide-react";
import { getMyFuelings } from "@/lib/loyalty.functions";
import { formatBRL, formatDate } from "@/lib/loyalty";

export const Route = createFileRoute("/_authenticated/app/historico")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Histórico de abastecimentos — FuelRewards" },
      { name: "description", content: "Todos os seus abastecimentos, litros e economia acumulada." },
      { property: "og:title", content: "Histórico de abastecimentos — FuelRewards" },
      { property: "og:description", content: "Todos os seus abastecimentos, litros e economia acumulada." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: History,
});

function History() {
  const fn = useServerFn(getMyFuelings);
  const { data, isLoading } = useQuery({ queryKey: ["my-fuelings"], queryFn: () => fn({}) });

  const rows = data ?? [];
  const totalSaved = rows.reduce((s, h) => s + Number(h.discount_total || 0), 0);
  const totalLiters = rows.reduce((s, h) => s + Number(h.liters || 0), 0);

  return (
    <div className="px-5 pt-6">
      <h1 className="text-2xl font-bold tracking-tight">Histórico</h1>
      <p className="mt-1 text-sm text-muted-foreground">Seus últimos abastecimentos</p>

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

      {isLoading ? (
        <div className="mt-10 grid place-items-center text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhum abastecimento registrado ainda. Gere seu token e abasteça em um posto participante.
        </div>
      ) : (
        <ul className="mt-6 space-y-3 pb-8">
          {rows.map((h) => (
            <li key={h.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-accent text-foreground">
                <Fuel className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{Number(h.liters).toFixed(1)} litros</p>
                  <p className="text-sm font-semibold text-success">−{formatBRL(Number(h.discount_total))}</p>
                </div>
                <div className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {h.stations?.name ?? "Posto"}
                  </span>
                  <span>{formatDate(h.created_at)}</span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
