import { createFileRoute } from "@tanstack/react-router";
import { Plus, Pencil } from "lucide-react";
import { TIERS, formatBRL } from "@/lib/mock";

export const Route = createFileRoute("/dashboard/regras")({
  component: Rules,
});

function Rules() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 sm:flex sm:flex-wrap sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight">Regras de desconto</h1>
          <p className="text-sm text-muted-foreground">
            Configure os níveis de gamificação por volume mensal abastecido.
          </p>
        </div>
        <button className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-card">
          <Plus className="h-4 w-4" />
          Novo nível
        </button>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="grid grid-cols-12 gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="col-span-4">Nível</div>
          <div className="col-span-4">Volume mensal</div>
          <div className="col-span-3">Desconto / Litro</div>
          <div className="col-span-1 text-right">Ações</div>
        </div>

        {TIERS.map((t) => (
          <div
            key={t.name}
            className="grid grid-cols-12 items-center gap-4 border-b border-border px-5 py-4 last:border-b-0"
          >
            <div className="col-span-4 flex items-center gap-3">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: `var(--${t.color})` }}
              />
              <span className="font-semibold">{t.name}</span>
            </div>
            <div className="col-span-4 text-sm tabular-nums">
              {t.min}L – {t.max === 9999 ? "∞" : `${t.max}L`}
            </div>
            <div className="col-span-3 text-sm font-bold text-primary">
              {formatBRL(t.discount)} <span className="font-normal text-muted-foreground">/L</span>
            </div>
            <div className="col-span-1 flex justify-end">
              <button
                className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-accent"
                aria-label={`Editar ${t.name}`}
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-accent/40 p-5">
        <p className="text-sm font-semibold">Como funciona</p>
        <p className="mt-1 text-sm text-muted-foreground">
          O motorista sobe de nível conforme acumula litros abastecidos no mês. O
          desconto correspondente é aplicado <b>imediatamente na bomba</b>, ao validar
          o CPF e o token de 6 dígitos gerado pelo aplicativo.
        </p>
      </div>
    </div>
  );
}
