import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Search, Loader2 } from "lucide-react";
import { getDashboardData, getTiers } from "@/lib/loyalty.functions";
import { maskCpf, relativeDay, tierFor, type Tier } from "@/lib/loyalty";

export const Route = createFileRoute("/_authenticated/dashboard/clientes")({
  head: () => ({
    meta: [
      { title: "Clientes — FuelRewards" },
      { name: "description", content: "Base de motoristas do programa, volume mensal e nível de fidelidade." },
      { property: "og:title", content: "Clientes — FuelRewards" },
      { property: "og:description", content: "Base de motoristas do programa, volume mensal e nível de fidelidade." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Customers,
});

function Customers() {
  const dashFn = useServerFn(getDashboardData);
  const tiersFn = useServerFn(getTiers);
  const dash = useQuery({ queryKey: ["dashboard"], queryFn: () => dashFn({}) });
  const tiersQuery = useQuery({ queryKey: ["tiers"], queryFn: () => tiersFn({}) });
  const [term, setTerm] = useState("");

  const tiers = (tiersQuery.data ?? []) as unknown as Tier[];
  const customers = dash.data?.customers ?? [];

  const filtered = useMemo(() => {
    const q = term.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) => c.name.toLowerCase().includes(q) || (c.cpf ?? "").includes(q.replace(/\D/g, "")),
    );
  }, [customers, term]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
        <p className="text-sm text-muted-foreground">
          {customers.length} motoristas cadastrados no programa.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-card">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Buscar por nome ou CPF..."
          className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-5 py-3 text-left font-semibold">Cliente</th>
              <th className="px-5 py-3 text-left font-semibold">CPF</th>
              <th className="px-5 py-3 text-left font-semibold">Volume (mês)</th>
              <th className="px-5 py-3 text-left font-semibold">Nível</th>
              <th className="px-5 py-3 text-left font-semibold">Última visita</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                  Nenhum cliente encontrado.
                </td>
              </tr>
            )}
            {filtered.map((c) => {
              const { current } = tierFor(c.volume, tiers);
              return (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold">
                        {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                      </div>
                      <span className="font-semibold">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{maskCpf(c.cpf)}</td>
                  <td className="px-5 py-3 font-semibold tabular-nums">{c.volume.toFixed(0)}L</td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: `var(--${current.color})` }}
                      />
                      {current.name}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{relativeDay(c.lastVisit)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
