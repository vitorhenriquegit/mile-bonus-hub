import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Pencil, Check, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getTiers, updateTier } from "@/lib/loyalty.functions";
import { formatBRL, type Tier } from "@/lib/loyalty";

export const Route = createFileRoute("/_authenticated/dashboard/regras")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Regras de desconto — FuelRewards" },
      { name: "description", content: "Configure faixas de volume e desconto por litro de cada nível do programa." },
      { property: "og:title", content: "Regras de desconto — FuelRewards" },
      { property: "og:description", content: "Configure faixas de volume e desconto por litro de cada nível do programa." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Rules,
});

function Rules() {
  const queryClient = useQueryClient();
  const tiersFn = useServerFn(getTiers);
  const updateFn = useServerFn(updateTier);
  const { data, isLoading } = useQuery({ queryKey: ["tiers"], queryFn: () => tiersFn({}) });
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState({ min_liters: 0, max_liters: 0, discount_per_liter: 0 });

  const save = useMutation({
    mutationFn: (id: string) => updateFn({ data: { id, ...draft } }),
    onSuccess: () => {
      toast.success("Regra atualizada");
      setEditing(null);
      queryClient.invalidateQueries({ queryKey: ["tiers"] });
    },
    onError: () => toast.error("Não foi possível salvar. Verifique suas permissões."),
  });

  const tiers = (data ?? []) as unknown as Tier[];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Regras de desconto</h1>
        <p className="text-sm text-muted-foreground">
          Configure os níveis de gamificação por volume mensal abastecido.
        </p>
      </div>

      <div className="rounded-2xl border border-border bg-card shadow-card">
        <div className="grid grid-cols-12 gap-4 border-b border-border px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="col-span-4">Nível</div>
          <div className="col-span-4">Volume mensal</div>
          <div className="col-span-3">Desconto / Litro</div>
          <div className="col-span-1 text-right">Ações</div>
        </div>

        {isLoading && (
          <div className="grid place-items-center py-10 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
          </div>
        )}

        {tiers.map((t) => {
          const isEditing = editing === t.id;
          return (
            <div
              key={t.id}
              className="grid grid-cols-12 items-center gap-4 border-b border-border px-5 py-4 last:border-b-0"
            >
              <div className="col-span-4 flex items-center gap-3">
                <span className="h-3 w-3 rounded-full" style={{ backgroundColor: `var(--${t.color})` }} />
                <span className="font-semibold">{t.name}</span>
              </div>

              {isEditing ? (
                <>
                  <div className="col-span-4 flex items-center gap-2">
                    <input
                      type="number"
                      value={draft.min_liters}
                      onChange={(e) => setDraft({ ...draft, min_liters: Number(e.target.value) })}
                      className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm tabular-nums"
                    />
                    <span className="text-muted-foreground">–</span>
                    <input
                      type="number"
                      value={draft.max_liters}
                      onChange={(e) => setDraft({ ...draft, max_liters: Number(e.target.value) })}
                      className="w-20 rounded-lg border border-border bg-background px-2 py-1 text-sm tabular-nums"
                    />
                  </div>
                  <div className="col-span-3">
                    <input
                      type="number"
                      step="0.01"
                      value={draft.discount_per_liter}
                      onChange={(e) => setDraft({ ...draft, discount_per_liter: Number(e.target.value) })}
                      className="w-24 rounded-lg border border-border bg-background px-2 py-1 text-sm tabular-nums"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end gap-1">
                    <button
                      onClick={() => save.mutate(t.id)}
                      disabled={save.isPending}
                      className="grid h-8 w-8 place-items-center rounded-lg bg-primary text-primary-foreground"
                      aria-label="Salvar"
                    >
                      {save.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => setEditing(null)}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground"
                      aria-label="Cancelar"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="col-span-4 text-sm tabular-nums">
                    {t.min_liters}L – {t.max_liters >= 9999 ? "∞" : `${t.max_liters}L`}
                  </div>
                  <div className="col-span-3 text-sm font-bold text-primary">
                    {formatBRL(t.discount_per_liter)}{" "}
                    <span className="font-normal text-muted-foreground">/L</span>
                  </div>
                  <div className="col-span-1 flex justify-end">
                    <button
                      onClick={() => {
                        setEditing(t.id);
                        setDraft({
                          min_liters: t.min_liters,
                          max_liters: t.max_liters,
                          discount_per_liter: t.discount_per_liter,
                        });
                      }}
                      className="grid h-8 w-8 place-items-center rounded-lg border border-border text-muted-foreground hover:bg-accent"
                      aria-label={`Editar ${t.name}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-dashed border-border bg-accent/40 p-5">
        <p className="text-sm font-semibold">Como funciona</p>
        <p className="mt-1 text-sm text-muted-foreground">
          O motorista sobe de nível conforme acumula litros abastecidos no mês. O desconto
          correspondente é aplicado <b>imediatamente na bomba</b>, ao validar o CPF e o token de 6
          dígitos gerado pelo aplicativo.
        </p>
      </div>
    </div>
  );
}
