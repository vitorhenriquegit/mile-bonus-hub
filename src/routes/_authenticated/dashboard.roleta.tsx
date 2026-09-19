import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Sparkles, Plus, Trash2, Save, Loader2, RefreshCw, Gift, Trophy, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { getWheelPrizes, saveWheelPrizes } from "@/lib/loyalty.functions";
import { SpinWheel } from "@/components/SpinWheel";
import { DEFAULT_WHEEL_PRIZES, type WheelPrize } from "@/lib/loyalty";

export const Route = createFileRoute("/_authenticated/dashboard/roleta")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Configurar Roleta da Sorte — FuelRewards" },
      { name: "description", content: "Gerencie os prêmios, fatias, cores e probabilidades da Roleta da Sorte." },
      { property: "og:title", content: "Configurar Roleta da Sorte — FuelRewards" },
      { property: "og:description", content: "Gerencie os prêmios da Roleta da Sorte." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: DashboardRoletaPage,
});

function DashboardRoletaPage() {
  const queryClient = useQueryClient();
  const getPrizesFn = useServerFn(getWheelPrizes);
  const savePrizesFn = useServerFn(saveWheelPrizes);

  const prizesQuery = useQuery({ queryKey: ["wheel-prizes"], queryFn: () => getPrizesFn({}) });
  const [slices, setSlices] = useState<WheelPrize[]>(DEFAULT_WHEEL_PRIZES);

  useEffect(() => {
    if (prizesQuery.data && prizesQuery.data.length > 0) {
      setSlices(prizesQuery.data);
    }
  }, [prizesQuery.data]);

  const saveMutation = useMutation({
    mutationFn: (newSlices: WheelPrize[]) => savePrizesFn({ data: newSlices }),
    onSuccess: () => {
      toast.success("Configuração da Roleta salva com sucesso!");
      queryClient.invalidateQueries({ queryKey: ["wheel-prizes"] });
    },
    onError: () => toast.error("Não foi possível salvar as fatias da roleta."),
  });

  const handleAddSlice = () => {
    const newId = `slice_${Date.now()}`;
    const colors = ["#3B82F6", "#10B981", "#F59E0B", "#8B5CF6", "#EC4899", "#EF4444"];
    const randomColor = colors[slices.length % colors.length];

    setSlices([
      ...slices,
      {
        id: newId,
        label: "Novo Prêmio",
        sublabel: "Desconto/Bônus",
        color: randomColor,
        textColor: "#FFFFFF",
        weight: 10,
        isWin: true,
      },
    ]);
  };

  const handleRemoveSlice = (index: number) => {
    if (slices.length <= 2) {
      toast.error("A roleta deve conter pelo menos 2 fatias.");
      return;
    }
    setSlices(slices.filter((_, i) => i !== index));
  };

  const handleUpdateSlice = (index: number, patch: Partial<WheelPrize>) => {
    setSlices(slices.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const totalWeight = slices.reduce((acc, s) => acc + (Number(s.weight) || 0), 0) || 1;

  if (prizesQuery.isLoading) {
    return (
      <div className="grid min-h-[50vh] place-items-center text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gerenciador da Roleta da Sorte</h1>
          <p className="text-sm text-muted-foreground">
            Configure fatias, prêmios, cores e probabilidade de sorteio para os clientes
          </p>
        </div>
        <button
          onClick={() => saveMutation.mutate(slices)}
          disabled={saveMutation.isPending}
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-card hover:opacity-90 disabled:opacity-50"
        >
          {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Salvar Alterações
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-foreground">
              <Gift className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Prêmios Ativos</p>
              <p className="text-xl font-bold tabular-nums">{slices.filter((s) => s.isWin).length} fatias</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-foreground">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total de Fatias</p>
              <p className="text-xl font-bold tabular-nums">{slices.length} fatias</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-accent text-foreground">
              <Trophy className="h-4 w-4" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taxa de Vitória Esperada</p>
              <p className="text-xl font-bold tabular-nums text-primary">
                {(
                  (slices.filter((s) => s.isWin).reduce((a, s) => a + s.weight, 0) / totalWeight) *
                  100
                ).toFixed(0)}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Slice List, Right = Live Preview */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Slice Configuration List */}
        <div className="xl:col-span-2 space-y-4">
          <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-5 py-4 shadow-card">
            <div>
              <h2 className="text-base font-bold">Fatias da Roleta</h2>
              <p className="text-xs text-muted-foreground">Personalize cada setor e o peso de probabilidade</p>
            </div>
            <button
              onClick={handleAddSlice}
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
            >
              <Plus className="h-4 w-4" /> Adicionar Fatia
            </button>
          </div>

          <div className="space-y-3">
            {slices.map((slice, index) => {
              const probabilityPct = Math.round(((slice.weight || 0) / totalWeight) * 100);
              return (
                <div
                  key={slice.id || index}
                  className="rounded-2xl border border-border bg-card p-4 shadow-card space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={slice.color}
                        onChange={(e) => handleUpdateSlice(index, { color: e.target.value })}
                        className="h-8 w-8 cursor-pointer rounded-lg border-0 bg-transparent"
                        title="Cor da fatia"
                      />
                      <span className="text-sm font-bold">Fatia {index + 1}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-foreground">
                        Probabilidade: <b>{probabilityPct}%</b>
                      </span>
                      <button
                        onClick={() => handleRemoveSlice(index)}
                        className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
                        title="Excluir fatia"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground">Texto Principal</label>
                      <input
                        type="text"
                        value={slice.label}
                        onChange={(e) => handleUpdateSlice(index, { label: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground">Subtexto / Detalhe</label>
                      <input
                        type="text"
                        value={slice.sublabel}
                        onChange={(e) => handleUpdateSlice(index, { sublabel: e.target.value })}
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-muted-foreground">Peso (Probabilidade)</label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        value={slice.weight}
                        onChange={(e) =>
                          handleUpdateSlice(index, { weight: Math.max(1, parseInt(e.target.value) || 1) })
                        }
                        className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-border/50 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={slice.isWin}
                        onChange={(e) => handleUpdateSlice(index, { isWin: e.target.checked })}
                        className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                      />
                      <span className="font-semibold text-muted-foreground">É um prêmio premiado (Vitória)</span>
                    </label>

                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground">Cor do texto:</span>
                      <input
                        type="color"
                        value={slice.textColor || "#FFFFFF"}
                        onChange={(e) => handleUpdateSlice(index, { textColor: e.target.value })}
                        className="h-6 w-6 cursor-pointer rounded border-0 bg-transparent"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live Wheel Preview Panel */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card flex flex-col items-center justify-center text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            <Sparkles className="h-3.5 w-3.5" /> Prévia em Tempo Real
          </span>
          <h2 className="mt-2 text-base font-bold">Visualização do Cliente</h2>
          <p className="mt-1 text-xs text-muted-foreground mb-6">
            Como a roleta é exibida no app do motorista
          </p>

          <SpinWheel prizes={slices} mustSpin={false} targetIndex={0} onStopSpinning={() => {}} size={280} />

          <div className="mt-6 rounded-xl bg-accent p-4 text-xs text-muted-foreground text-left space-y-1 w-full">
            <p className="font-semibold text-foreground flex items-center gap-1">
              <HelpCircle className="h-3.5 w-3.5" /> Dica de Ponderação:
            </p>
            <p>
              Quanto maior o <b>Peso</b> de uma fatia em relação ao total, maior a chance dela ser sorteada pelo algoritmo.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
