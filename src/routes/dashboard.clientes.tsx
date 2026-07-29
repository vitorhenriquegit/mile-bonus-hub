import { createFileRoute } from "@tanstack/react-router";
import { Search, Download } from "lucide-react";
import { CUSTOMERS } from "@/lib/mock";

export const Route = createFileRoute("/dashboard/clientes")({
  component: Customers,
});

const tierColor: Record<string, string> = {
  Bronze: "tier-bronze",
  Prata: "tier-silver",
  Ouro: "tier-gold",
  Diamante: "tier-diamond",
};

function Customers() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-sm text-muted-foreground">
            {CUSTOMERS.length} motoristas ativos no programa.
          </p>
        </div>
        <button className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold">
          <Download className="h-4 w-4" />
          Exportar CSV
        </button>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 shadow-card">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
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
            {CUSTOMERS.map((c) => (
              <tr key={c.id} className="border-t border-border">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent text-xs font-bold">
                      {c.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                    </div>
                    <span className="font-semibold">{c.name}</span>
                  </div>
                </td>
                <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.cpf}</td>
                <td className="px-5 py-3 font-semibold tabular-nums">{c.volume}L</td>
                <td className="px-5 py-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-xs font-semibold">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: `var(--${tierColor[c.tier]})` }}
                    />
                    {c.tier}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{c.lastVisit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
